import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { registerStaffActivity } from "../../../../../../../api/activityLog";
import {
  assertWriteSucceeded,
  strandedAfterRollback,
} from "../../../../../../../utils/assignmentWrites";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import Chip from "../../../../../../../components/UX/Chip/Chip";
import Input from "../../../../../../../components/UX/inputs/Input";
import Label from "../../../../../../../components/UX/inputs/Label";
import { ProfileSkeleton } from "../../../../../../../components/UX/profile";
import { formatDate } from "../../../../../../../components/utils/dateFormat";
import { getIndustryProfile } from "../../../../../../../config/industryProfiles";
import { AntSelectorStyle } from "../../../../../../../styles/global/AntSelectorStyle";
import "../../../../../../../styles/global/actionForm.css";
import {
  buildInventoryOptions,
  formatLeaseLocation,
  isAddressUsable,
  remainingUnits,
  resolveSerialScan,
  summarizePick,
} from "../../../../../../../utils/assignmentSelection";
import { useStaffRoleAndLocations } from "../../../../../../../utils/checkStaffRoleAndLocations";
import ReceiptModal from "../../../../../../payment/components/ReceiptModal";
import { mapAssignmentToReceipt } from "../../../../../../payment/utils/receiptUtils";
import { fetchSchoolSettings } from "../../../../../../Profile/school_compliance/utils/schoolComplianceUtils";
import {
  classifyAssignmentError,
  getAssignmentErrorMessage,
} from "../../../../../utils/assignmentErrorUtils";
import {
  getConsentStatusMessage,
  hasValidConsent,
} from "../../../../../utils/consentCheckUtils";
import {
  isContractEmailRequired,
  shouldSendContractEmail,
} from "../../../../../utils/contractEmailPolicy";
import { fetchStudentConsent } from "../../../../../utils/guardianConsentApi";
import {
  getConsentStatusCopy,
  isAssignmentBlockedByConsent,
  isConsentRequiredForMember,
  normalizeConsentStatus,
} from "../../../../../utils/guardianConsentUtils";
import {
  parseDateInputValue,
  todayDateInputValue,
} from "../../../../../utils/leaseDateUtils";
import { buildAssignmentRollbackPayload } from "../../../../../utils/leaseReturnUtils";
import ContractDocumentsPicker from "../documents/ContractDocumentsPicker";
import MemberResponsibilityBanner from "./MemberResponsibilityBanner";

/**
 * Handing devices to a member.
 *
 * The lease lifecycle, the consent gates, the warehouse rollback and the
 * contract-email policy are unchanged — they are the careful part of this
 * screen and every request it makes is the same. What changed is how it is
 * driven and how it is read.
 *
 * It used to ask for a *starting serial number* and a *quantity* and then
 * `slice(index, index + quantity)` out of the location's list: a blind slice
 * hands over fewer units than asked for whenever the range runs out, and it did
 * so without a word. The submit path was four nested `if`s with no `else`
 * anywhere — a serial that matched nothing produced no request, no message and
 * no error, just a spinner that stopped. The ✓/✗ beside the field came from an
 * effect that only re-evaluated when the typed length happened to equal the
 * first serial's length, and the submit button stayed disabled until it turned
 * ✓, so a valid serial of a different length could not be submitted at all.
 *
 * Units are picked now — scanned, tapped, or all at once — from the list that
 * was actually fetched, and the form reads in the order the work happens:
 * who is accountable, which device, which units, where and until when, what has
 * to be signed.
 */
const AssignmentDevicesToMember = () => {
  const { user } = useSelector((state) => state.admin);
  const { memberInfo } = useSelector((state) => state.member);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();
  const serialRef = useRef(null);

  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: { street: "", city: "", state: "", zip: "" },
  });

  const [selection, setSelection] = useState(null);
  const [available, setAvailable] = useState([]);
  const [picked, setPicked] = useState([]);
  const [serial, setSerial] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [addContracts, setAddContracts] = useState(false);
  const [contractList, setContractList] = useState([]);
  const [assignmentReceipt, setAssignmentReceipt] = useState(null);

  const verificationInfo = useRef({});
  const dateToUse = useMemo(() => formatDate(new Date()), []);
  const stampTime = useMemo(() => new Date().toISOString(), []);
  const defaultDueDate = useMemo(() => todayDateInputValue(), []);

  useEffect(() => {
    // YYYY-MM-DD, not the full "YYYY-MM-DD HH:mm:ss" stamp: `<input type="date">`
    // rejects a value carrying a time outright, so the default was invisible —
    // the field rendered empty while the form state claimed a default.
    setValue("expectedReturnDate", defaultDueDate);
  }, [defaultDueDate, setValue]);

  const { locationsAssignPermission } = useStaffRoleAndLocations();

  const itemsInInventoryQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-group-location-quantity", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        enableAssignFeature: 1,
        location: locationsAssignPermission,
        logistic_status: "in-stock",
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 60 * 1000,
  });

  // ─── Compliance: who may receive a device at all ───────────────────────────

  const isEducation = user?.companyData?.industry === "Education";
  const schoolSettingsQuery = useQuery({
    queryKey: ["schoolSettings", user.sqlInfo.company_id],
    queryFn: () => fetchSchoolSettings(user.sqlInfo.company_id),
    enabled: isEducation,
    staleTime: 5 * 60 * 1000,
  });
  const schoolSettings = schoolSettingsQuery.data?.settings || {};

  const isMinor = isEducation && Number(memberInfo?.minor) === 1;
  const isUnder13 = isEducation && Boolean(memberInfo?.under_13);

  // Whether consent even applies to this member: each toggle is an age scope, so
  // with both off no age is checked and the assignment proceeds. An earlier
  // version blocked every minor regardless of the settings, which asked a school
  // for consent it had explicitly not turned on.
  const consentApplies = isConsentRequiredForMember({
    isMinor,
    isUnder13,
    settings: schoolSettings,
  });

  // Fetched exactly when it could change the answer. This was gated on
  // `enforce_member_consent`, a key /school/settings does not return — so the
  // condition read `undefined`, the query never ran, and the first thing to
  // notice the missing consent was the server, one warehouse write too late.
  const consentQuery = useQuery({
    queryKey: [
      "studentConsentStatus",
      memberInfo?.member_id,
      user.sqlInfo.company_id,
    ],
    queryFn: () =>
      fetchStudentConsent(user.sqlInfo.company_id, memberInfo.member_id),
    enabled: !!memberInfo?.member_id && consentApplies,
    staleTime: 60 * 1000,
  });

  const consentStatus = normalizeConsentStatus(
    consentQuery.data,
    schoolSettings.required_consent_policy_version
  );

  /**
   * One consent verdict, used by the banner, the disabled button and the
   * pre-flight guard alike.
   *
   * There used to be two: the render read `isAssignmentBlockedByConsent` with an
   * `isConsentRequired` fallback, and the submit path recomputed the same idea
   * with a different fallback. Two spellings of one rule is how a screen ends up
   * with an enabled button that redirects the moment it is pressed.
   */
  const consentBlocking = consentQuery.isSuccess
    ? isAssignmentBlockedByConsent({
        consentStatus,
        settings: schoolSettings,
        isMinor,
        isUnder13,
      })
    : consentApplies && !hasValidConsent(memberInfo?.consent);

  const consentCopy = consentQuery.isSuccess
    ? getConsentStatusCopy(consentStatus)
    : getConsentStatusMessage({
        isMinor,
        isUnder13,
        consentRequired: true,
        consentExists: false,
      });

  // COPPA: under 13 always notifies the guardian, so the staff member cannot opt
  // out of the email. Derived rather than forced into `addContracts` by an
  // effect, so the two can never drift and unchecking cannot silently win.
  const contractEmailRequired = isContractEmailRequired(memberInfo);
  const sendContractEmail = shouldSendContractEmail(memberInfo, addContracts);

  const representative = getIndustryProfile(
    user?.companyData?.industry
  ).representative.label.toLowerCase();

  const guardianComplete = Boolean(
    memberInfo?.parent_guardian_first_name?.trim?.() &&
      memberInfo?.parent_guardian_email?.trim?.()
  );
  const guardianIncomplete = Number(memberInfo?.minor) === 1 && !guardianComplete;

  const isBlocked = guardianIncomplete || consentBlocking;

  // ─── Picking the units ────────────────────────────────────────────────────

  const options = useMemo(
    () => buildInventoryOptions(itemsInInventoryQuery.data?.data?.groupedInventory),
    [itemsInInventoryQuery.data]
  );
  const pending = useMemo(() => remainingUnits(available, picked), [available, picked]);
  const summary = summarizePick({ picked, available });

  const goBack = () => navigate(`/member/${memberInfo?.member_id}/main`);
  const memberUpdateLink = `/member/${memberInfo?.member_id}/update-member-information`;

  const handleSelectGroup = async (value) => {
    const option = JSON.parse(value);
    setSelection(option);
    setPicked([]);
    setSerial("");
    setFeedback(null);
    setNotice(null);
    setIsLoadingUnits(true);

    try {
      const response = await devitrakApi.post("/db_event/inventory-query", {
        queryName: "inventory.serialsByGroupCategoryLocation",
        params: {
          itemGroup: option.item_group,
          categoryName: option.category_name,
          location: option.location,
        },
      });
      const units = response.data?.result ?? [];
      setAvailable(units);
      if (units.length === 0) {
        setNotice(
          "This location reports stock but returned no serial numbers. Refresh and try again."
        );
      }
    } catch {
      setAvailable([]);
      setNotice("Could not read this location's serial numbers. Try again.");
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleAddSerial = (event) => {
    event?.preventDefault?.();
    const result = resolveSerialScan({ serial, available, picked });
    setFeedback({ tone: result.ok ? "ok" : "error", message: result.message });
    if (result.ok) {
      setPicked((current) => [...current, result.unit]);
      setSerial("");
    }
    serialRef.current?.focus();
  };

  const handleAddAll = () => {
    if (pending.length === 0) return;
    setPicked(available);
    setFeedback({
      tone: "ok",
      message: `${pending.length} unit${pending.length === 1 ? "" : "s"} added.`,
    });
  };

  const handleRemove = (unit) =>
    setPicked((current) =>
      current.filter((item) => item.serial_number !== unit.serial_number)
    );

  // ─── The write path. Same requests, same order, same bodies. ──────────────

  const updateDeviceInWarehouse = async (deviceInfo) =>
    assertWriteSucceeded(
      await devitrakApi.post("/db_item/item-out-warehouse", {
        warehouse: 0,
        logistic_status: "assigned",
        company_id: user.sqlInfo.company_id,
        item_group: deviceInfo[0].item_group,
        category_name: deviceInfo[0].category_name,
        data: deviceInfo.map((item) => item.serial_number),
      }),
      "Taking the units out of the warehouse"
    );

  const verificationContractMember = async () =>
    assertWriteSucceeded(
      await devitrakApi.post("/document/verification/member/signed_document", {
        contract_list: contractList,
        date: stampTime,
        company_id: user.sqlInfo.company_id,
        member_id: memberInfo.member_id,
        assigner_staff_member_id: user.sqlMemberInfo.staff_id,
      }),
      "Recording the signed document"
    );

  const createNewLease = async ({ deviceInfo, address, expectedReturnDate }) => {
    const verification = await verificationContractMember();
    const verificationId = verification.data.verificationInfo._id;
    verificationInfo.current._id = verificationId;

    // parseDateInputValue, not new Date(): the field hands over "2026-08-20",
    // which new Date reads as midnight UTC, and formatDate then writes local
    // components — so a device due on the 20th was stored as due the 19th at
    // 20:00 anywhere west of Greenwich. Resolved once for the whole batch so
    // every device in one handover carries the same due date.
    const dueDate = parseDateInputValue(expectedReturnDate);
    const dueDateStamp = dueDate ? formatDate(dueDate) : dateToUse;

    for (const device of deviceInfo) {
      const newLease = await devitrakApi.post(
        "/db_member/new-member-assigned-device-lease",
        {
          staff_member_id: user.sqlMemberInfo.staff_id,
          company_id: user.sqlInfo.company_id,
          location: formatLeaseLocation({
            address,
            deviceLocation: device.location,
            companyAddress: user?.companyData?.address,
          }),
          member_id: memberInfo.member_id,
          device_id: device.item_id,
          verification_id: verificationId,
          expected_return_date: dueDateStamp,
          returned: 0,
          assigned_date: formatDate(new Date()),
        }
      );
      if (!newLease?.data?.ok) {
        throw new Error("Failed to create the device lease record.");
      }
      registerStaffActivity({
        action: "ASSIGN",
        target_model: "Lease",
        target_id: memberInfo.member_id,
        details: { device_id: device.item_id },
      });
    }

    return verificationId;
  };

  /**
   * Puts devices back in stock when the lease could not be created.
   *
   * The warehouse write happens first and is not part of the same transaction as
   * the lease, so a rejected lease used to leave the device at logistic_status
   * "assigned" with nobody recorded as holding it. Rolling back is best-effort by
   * nature — if the undo also fails the caller is told exactly which serials are
   * stranded, because a silent one is how inventory drifts from reality.
   *
   * @returns {string[]} serials that could NOT be restored
   */
  const rollbackWarehouseAssignment = async (deviceInfo) => {
    const payload = buildAssignmentRollbackPayload({
      serials: deviceInfo.map((item) => item.serial_number),
      itemGroup: deviceInfo[0]?.item_group,
      categoryName: deviceInfo[0]?.category_name,
      companyId: user.sqlInfo.company_id,
    });
    if (!payload) return [];
    try {
      const restock = await devitrakApi.post(
        "/db_item/item-out-warehouse",
        payload
      );
      return strandedAfterRollback(restock, payload.data);
    } catch {
      return payload.data;
    }
  };

  const emailContractToMember = async ({ items, verificationId }) => {
    // Responsible party: for minors the parent/guardian (representative)
    // receives and signs the liability contract; adults sign for themselves.
    const minor = Number(memberInfo.minor) === 1;
    const responsibleParty = minor
      ? {
          name: `${memberInfo.parent_guardian_first_name ?? ""} ${
            memberInfo.parent_guardian_last_name ?? ""
          } (representative for ${memberInfo.first_name ?? ""} ${
            memberInfo.last_name ?? ""
          })`,
          email: memberInfo.parent_guardian_email,
          member_id: memberInfo.member_id,
        }
      : {
          name: `${memberInfo.first_name ?? ""} ${memberInfo.last_name ?? ""}`,
          email: memberInfo.email,
          member_id: memberInfo.member_id,
        };

    await devitrakApi.post(
      "/nodemailer/liability-contract-member-email-notification",
      {
        company_name: user.companyData.company_name,
        email_admin: user.email,
        member: responsibleParty,
        contract_list: contractList,
        subject: "Device Liability Contract",
        items,
        company_id: user.companyData.id,
        date_reference: stampTime,
        verification_id: verificationId,
      }
    );
  };

  /**
   * First-class lease lifecycle: warehouse-out → lease rows (+ contract
   * verification) → contract email → done. No pseudo-events, no receiver pools —
   * the lease table is the single source of truth.
   */
  const handOverDevices = async ({ deviceInfo, address, expectedReturnDate }) => {
    await updateDeviceInWarehouse(deviceInfo);

    // Anything that stops the lease from being written has to put the hardware
    // back. The pre-flight gate catches the common case (a minor without
    // consent), but a race, a stale device or a dropped connection all end here
    // too, and every one of them used to cost a device from the shelf.
    let verificationId;
    try {
      verificationId = await createNewLease({
        deviceInfo,
        address,
        expectedReturnDate,
      });
    } catch (error) {
      const stranded = await rollbackWarehouseAssignment(deviceInfo);
      if (stranded.length > 0) error.strandedSerials = stranded;
      throw error;
    }

    if (sendContractEmail) {
      await emailContractToMember({
        items: deviceInfo.map((device) => ({
          serial_number: device.serial_number,
          type: device.item_group,
          id: device.item_id,
        })),
        verificationId,
      });
    }

    ["staffMemberInfo", "imagePerItemList", "ItemsInventoryCheckingQuery"].forEach(
      (key) => queryClient.invalidateQueries({ queryKey: [key], exact: true })
    );
    queryClient.invalidateQueries({
      queryKey: ["memberAssignedDevices"],
      exact: true,
      refetchType: "active",
    });

    notify(
      "success",
      `${deviceInfo.length} device${deviceInfo.length === 1 ? "" : "s"} handed over.`,
      `${memberInfo.first_name ?? "The member"} is now holding them.`
    );

    // Offer the receipt before leaving: navigating first unmounts the prompt.
    // Whichever button is used, closing it navigates to the member page, so a
    // staff member who does not want a printout ends up where the flow used to
    // take them anyway.
    setAssignmentReceipt(
      mapAssignmentToReceipt({
        member: memberInfo,
        devices: deviceInfo,
        company: user?.company,
        companyLogo: user?.companyData?.company_logo,
        date: stampTime,
        staffName: [user?.name, user?.lastName].filter(Boolean).join(" "),
        reference: expectedReturnDate ? `Due ${expectedReturnDate}` : "",
      })
    );
  };

  const onSubmit = async (data) => {
    setNotice(null);

    if (!summary.canSubmit) {
      return setFeedback({
        tone: "error",
        message: "Pick at least one unit to hand over.",
      });
    }
    if (!isAddressUsable(data)) {
      return setNotice(
        "Complete the address or leave it empty — answering is optional, but a partial address cannot be used, and the ZIP needs to contain numbers."
      );
    }
    if (isBlocked) {
      // Belt and braces: the button is already disabled for both cases.
      return setNotice(
        guardianIncomplete
          ? `A complete ${representative} is required before anything can be handed over.`
          : consentCopy
      );
    }

    setLoadingStatus(true);
    try {
      // Re-read the picked serials as full item rows: the lease and the receipt
      // read fields the serial list does not carry.
      const full = await devitrakApi.post("/db_event/inventory-query", {
        queryName: "inventory.itemsByGroupCategoryLocationSerials",
        params: {
          itemGroup: selection.item_group,
          categoryName: selection.category_name,
          location: selection.location,
          serialNumbers: picked.map((unit) => unit.serial_number),
        },
      });

      const deviceInfo = full.data?.result ?? [];
      if (deviceInfo.length === 0) {
        throw new Error("Those units are no longer available in this location.");
      }

      await handOverDevices({
        deviceInfo,
        address: data,
        expectedReturnDate: data.expectedReturnDate,
      });
    } catch (error) {
      const classification = classifyAssignmentError(error);
      const baseMessage = getAssignmentErrorMessage(classification);

      // The rollback is best-effort; when it fails too, the serials it could not
      // restore are named here. Inventory now disagrees with reality and only a
      // human can fix it, so this must never be folded into a generic message —
      // and, unlike the consent branches, it does not navigate away.
      if (error.strandedSerials?.length) {
        return setNotice(
          `${baseMessage} WARNING: ${error.strandedSerials.join(
            ", "
          )} could not be returned to stock — fix them in inventory before assigning again.`
        );
      }

      if (
        ["CONSENT_REQUIRED", "UNDER_13_CONSENT_REQUIRED", "GUARDIAN_REQUIRED"].includes(
          classification.type
        )
      ) {
        notify("warning", baseMessage, "");
        return navigate(memberUpdateLink);
      }

      setNotice(baseMessage);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Deep links hydrate memberInfo asynchronously (dashboard fetch → Redux).
  if (!memberInfo?.member_id) return <ProfileSkeleton lines={5} />;

  const memberName = `${memberInfo.first_name ?? ""} ${
    memberInfo.last_name ?? ""
  }`.trim();

  const bannerState = guardianIncomplete
    ? "blocked"
    : consentBlocking
    ? "consent"
    : Number(memberInfo.minor) === 1
    ? "minor"
    : "adult";

  const stepClass = (done) =>
    `action-form__step${done ? " action-form__step--done" : ""}`;

  if (itemsInInventoryQuery.isLoading) return <ProfileSkeleton lines={5} />;

  return (
    <>
      {contextHolder}
      <form className="action-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="action-form__header">
          <h2 className="action-form__title">Hand over a device</h2>
          <p className="action-form__lead">
            Units leave the warehouse and are leased to{" "}
            <strong>{memberName}</strong>. Nothing is written until you confirm.
          </p>
        </div>

        <MemberResponsibilityBanner
          state={bannerState}
          memberName={memberInfo.first_name}
          representativeName={`${memberInfo.parent_guardian_first_name ?? ""} ${
            memberInfo.parent_guardian_last_name ?? ""
          }`.trim()}
          representativeEmail={memberInfo.parent_guardian_email}
          representativeLabel={representative}
          consentStatus={consentStatus}
          consentCopy={consentCopy}
          memberUpdateLink={memberUpdateLink}
        />

        {/* 1 — which device */}
        <section className={stepClass(Boolean(selection))}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">1</span>
              Device and location
            </h3>
            {selection && (
              <p className="action-form__step-note">
                {available.length} unit{available.length === 1 ? "" : "s"} free here
              </p>
            )}
          </div>
          <div className="action-form__field">
            <Label>Pick a unit</Label>
            <Select
              className="custom-autocomplete"
              showSearch
              disabled={loadingStatus || isBlocked}
              placeholder="Search a device, category or location"
              optionFilterProp="label"
              style={{ ...AntSelectorStyle, width: "100%" }}
              onChange={handleSelectGroup}
              options={options.map((option) => ({
                // A plain label, so the built-in search can match on it. Each
                // option used to be a three-column Typography block, which the
                // filter could not read.
                label: `${option.category_name} · ${option.item_group} · ${option.location} — ${option.total} available`,
                value: option.value,
              }))}
            />
          </div>
        </section>

        {/* 2 — which units */}
        {selection && (
          <section className={stepClass(summary.canSubmit)}>
            <div className="action-form__step-head">
              <h3 className="action-form__step-title">
                <span className="action-form__step-index">2</span>
                Units to hand over ({summary.picked})
              </h3>
              {pending.length > 0 && (
                <GrayButtonComponent
                  title={`Add all ${pending.length}`}
                  size="sm"
                  buttonType="button"
                  disabled={loadingStatus}
                  func={handleAddAll}
                />
              )}
            </div>

            {isLoadingUnits ? (
              <ProfileSkeleton lines={2} />
            ) : (
              <>
                <div className="action-form__row">
                  <div className="action-form__field">
                    <Label>Scan or type a serial number</Label>
                    <Input
                      ref={serialRef}
                      name="serialNumber"
                      autoComplete="off"
                      placeholder="e.g. SN-4471"
                      value={serial}
                      disabled={loadingStatus}
                      onChange={(event) => setSerial(event.target.value)}
                      onKeyDown={(event) => {
                        // Enter adds a unit; it must not submit the handover.
                        if (event.key === "Enter") handleAddSerial(event);
                      }}
                    />
                  </div>
                  <BlueButtonComponent
                    title="Add"
                    buttonType="button"
                    disabled={loadingStatus}
                    func={handleAddSerial}
                  />
                </div>

                {feedback && (
                  <p
                    className={`action-form__feedback action-form__feedback--${feedback.tone}`}
                    role="status"
                  >
                    {feedback.message}
                  </p>
                )}

                {picked.length === 0 ? (
                  <p className="action-form__empty">
                    Nothing picked yet. Scan a serial number, or choose from the
                    list below.
                  </p>
                ) : (
                  <ul className="action-form__picked">
                    {picked.map((unit) => (
                      <li key={unit.serial_number}>
                        <span className="action-form__serial">
                          {unit.serial_number}
                        </span>
                        <button
                          className="action-form__remove"
                          type="button"
                          disabled={loadingStatus}
                          onClick={() => handleRemove(unit)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {pending.length > 0 && (
                  <>
                    <p className="action-form__step-note">
                      Free in this location — tap to add
                    </p>
                    <div className="action-form__chips">
                      {pending.map((unit) => (
                        <Chip
                          key={unit.serial_number}
                          label={unit.serial_number}
                          variant="outlined"
                          onClick={
                            loadingStatus
                              ? undefined
                              : () => {
                                  setPicked((current) => [...current, unit]);
                                  setFeedback({
                                    tone: "ok",
                                    message: `${unit.serial_number} added.`,
                                  });
                                }
                          }
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {/* 3 — where and until when */}
        <section className={stepClass(isAddressUsable(watch()))}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">3</span>
              Where it will be kept, and until when
            </h3>
          </div>
          <div className="action-form__grid">
            <div className="action-form__field action-form__field--wide">
              <Label>Street</Label>
              <Input {...register("street")} disabled={loadingStatus} />
            </div>
            <div className="action-form__field">
              <Label>City</Label>
              <Input {...register("city")} disabled={loadingStatus} />
            </div>
            <div className="action-form__field">
              <Label>State</Label>
              <Input {...register("state")} disabled={loadingStatus} />
            </div>
            <div className="action-form__field">
              <Label>ZIP</Label>
              <Input {...register("zip")} disabled={loadingStatus} />
            </div>
            <div className="action-form__field">
              <Label>Expected return date</Label>
              <Input
                type="date"
                {...register("expectedReturnDate")}
                disabled={loadingStatus}
              />
            </div>
          </div>
        </section>

        {/* 4 — documents */}
        <ContractDocumentsPicker
          addContracts={addContracts}
          setAddContracts={setAddContracts}
          loadingStatus={loadingStatus}
          selectedDocuments={contractList}
          setSelectedDocuments={setContractList}
          recipientEmail={
            Number(memberInfo.minor) === 1
              ? memberInfo.parent_guardian_email
              : memberInfo.email
          }
          recipientLabel={representative}
          emailRequired={contractEmailRequired}
        />

        {selection && summary.canSubmit && (
          <dl className="action-form__summary">
            <div>
              <dt>Device</dt>
              <dd>{selection.item_group}</dd>
            </div>
            <div>
              <dt>From</dt>
              <dd>{selection.location}</dd>
            </div>
            <div>
              <dt>Units</dt>
              <dd>{summary.picked}</dd>
            </div>
            <div>
              <dt>Due back</dt>
              <dd>{watch("expectedReturnDate") || "—"}</dd>
            </div>
          </dl>
        )}

        {notice && <p className="action-form__notice">{notice}</p>}

        <div className="action-form__footer">
          <p className="action-form__consequence">
            The units are marked as assigned and a lease is opened against{" "}
            {memberName || "this member"}.
          </p>
          <GrayButtonComponent
            title="Back"
            buttonType="button"
            disabled={loadingStatus}
            func={goBack}
          />
          <BlueButtonComponent
            title={
              summary.canSubmit
                ? `Hand over ${summary.picked} device${
                    summary.picked === 1 ? "" : "s"
                  }`
                : "Hand over devices"
            }
            buttonType="submit"
            isDisabled={!summary.canSubmit || loadingStatus || isBlocked}
            isLoading={loadingStatus}
          />
        </div>
      </form>

      {/* No QR on a handover slip. The lookup behind it needs member_id +
          company_id, both small sequential integers, so a scannable URL would be
          trivially enumerable against records that carry a student's name and a
          guardian's email. The device's current status is already on the
          member's profile, where it is behind the session. */}
      {assignmentReceipt && (
        <ReceiptModal
          openModal={Boolean(assignmentReceipt)}
          setOpenModal={() => setAssignmentReceipt(null)}
          receipt={assignmentReceipt}
          title={"Print a receipt for this handover?"}
          onClose={goBack}
        />
      )}
    </>
  );
};

export default AssignmentDevicesToMember;
