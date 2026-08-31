import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { assertWriteSucceeded } from "../../../../../../utils/assignmentWrites";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import Chip from "../../../../../../components/UX/Chip/Chip";
import Input from "../../../../../../components/UX/inputs/Input";
import Label from "../../../../../../components/UX/inputs/Label";
import { ProfileSkeleton } from "../../../../../../components/UX/profile";
import { useStatusNotification } from "../../../../../../components/notification/alerts/useStatusNotification";
import { checkArray } from "../../../../../../components/utils/checkArray";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { formatDate } from "../../../../../inventory/utils/dateFormat";
import "../../../../../../styles/global/actionForm.css";
import LegalDocumentModal from "./components/legalDOcuments/LegalDocumentModal";
import {
  buildInventoryOptions,
  findOptionForDevice,
  isAddressUsable,
  remainingUnits,
  resolveSerialScan,
  summarizePick,
} from "../../../../../../utils/assignmentSelection";
import { buildLeaseEventName } from "./utils/leaseEventName";

/**
 * Handing warehouse units to a staff member.
 *
 * The form used to ask for a *starting serial number* and a *quantity*, then
 * slice that many rows out of the location's list. The whole submit path was
 * three nested `if`s with no `else`: a serial that matched nothing did nothing
 * at all — no request, no message, spinner cleared — and `option1` only
 * reported success from inside `if (newEventInfo.insertId && ...)`, so a failed
 * event creation was equally silent. The ✓/✗ beside the field came from an
 * effect that only re-evaluated when the typed length happened to equal the
 * first serial's length, and the submit button was disabled until it turned ✓.
 *
 * Units are picked now, one at a time or all at once, from the list that was
 * actually fetched. Read top to bottom: which device, which units, where it
 * will be used, what has to be signed, then one button that names the count.
 *
 * Every request and payload is unchanged.
 */
const AssignmentFromExistingInventory = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Arriving from a device's own page, which already knows which unit is in
     hand. The drawer there promises "we'll take you there with <serial> in
     hand" and used to land on an empty form, so the operator picked the
     category, the location and the serial they had just been standing over. */
  const handedOverDevice = useLocation().state?.device ?? null;
  const [pendingSerial, setPendingSerial] = useState(null);
  const prefilledFromDevice = useRef(false);

  const [addContracts, setAddContracts] = useState(false);
  const [contractList, setContractList] = useState([]);

  // Stamped once per mount so every record written for this assignment agrees.
  const dateToUse = useMemo(() => formatDate(new Date()), []);
  const stampTime = useMemo(() => new Date().toISOString(), []);
  const referenceDateTime = useMemo(() => new Date().getTime(), []);
  const localDate = useMemo(() => new Date().toLocaleDateString(), []);

  const itemsInInventoryQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-group-location-quantity", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        enableAssignFeature: 1,
        logistic_status: "in-stock",
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 60 * 1000,
  });

  const staffMemberQuery = useQuery({
    queryKey: ["staffMemberInfo", profile.email],
    queryFn: () =>
      devitrakApi.post("/db_staff/consulting-member", { email: profile.email }),
    enabled: !!profile.email,
    staleTime: 60 * 1000,
  });

  const options = useMemo(
    () =>
      buildInventoryOptions(
        itemsInInventoryQuery.data?.data?.groupedInventory
      ),
    [itemsInInventoryQuery.data]
  );

  const pending = useMemo(() => remainingUnits(available, picked), [available, picked]);
  const summary = summarizePick({ picked, available });

  const eventName = buildLeaseEventName({
    profile,
    date: localDate,
    reference: referenceDateTime,
  });

  const closeModal = () => navigate(`/staff/${profile.adminUserInfo.id}/main`);

  /** Step 1 → 2: the units this location actually holds. */
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
      // The list was fetched only to read its first and last serial for a
      // placeholder; nothing showed which units were actually free.
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

  /* Step 1, done for you: pick the group that holds the device we arrived with.
     findOptionForDevice refuses to guess when the location is unknown and the
     same model sits in more than one place — loading the wrong shelf would hand
     over a different unit with the same model name. */
  useEffect(() => {
    if (prefilledFromDevice.current || !handedOverDevice || options.length === 0) {
      return;
    }
    const option = findOptionForDevice(options, handedOverDevice);
    if (!option) return;
    prefilledFromDevice.current = true;
    setPendingSerial(handedOverDevice.serial_number);
    handleSelectGroup(option.value);
    // handleSelectGroup is recreated every render and this must run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, handedOverDevice]);

  /* Step 2: the serials arrive asynchronously, so the unit can only be picked
     once they are here. Routed through resolveSerialScan rather than pushed
     straight into `picked`, so a device that has moved since the drawer read it
     is refused with the same message a mistyped scan gets. */
  useEffect(() => {
    if (!pendingSerial || available.length === 0) return;
    const result = resolveSerialScan({ serial: pendingSerial, available, picked: [] });
    setPendingSerial(null);
    if (result.ok) setPicked([result.unit]);
    setFeedback({ tone: result.ok ? "ok" : "error", message: result.message });
  }, [available, pendingSerial]);

  const addUnit = (unit, message) => {
    setPicked((current) => [...current, unit]);
    setFeedback({ tone: "ok", message });
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

  const handleRemove = (unit) => {
    setPicked((current) =>
      current.filter((item) => item.serial_number !== unit.serial_number)
    );
    setFeedback(null);
  };

  // ─── The write path. Same requests, same order, same bodies. ───────────────

  const createSqlEvent = async (address) => {
    const response = await devitrakApi.post("/db_event/new_event", {
      event_name: eventName,
      venue_name: eventName,
      street_address: address.street,
      city_address: address.city,
      state_address: address.state,
      zip_address: address.zip,
      email_company: profile.email,
      phone_number: profile.adminUserInfo.phone ?? "000-000-0000",
      company_assigned_event_id: user.sqlInfo.company_id,
      contact_name: `${user.name} ${user.lastName}`,
    });

    assertWriteSucceeded(response, "Opening the lease record");

    const insertId = response.data?.consumer?.insertId;
    // Previously caught and turned into `null`, which made the caller's guard
    // fail and the whole submission end without a word either way.
    if (!insertId) throw new Error("The lease record could not be created.");
    return insertId;
  };

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

  const createVerification = async () => {
    const verification = await devitrakApi.post(
      "/document/verification/staff_member/signed_document",
      {
        staff_member_id: profile.adminUserInfo.id,
        contract_list: contractList,
        company_id: user.companyData.id,
        assigner_staff_member_id: user.id ?? user.uid,
        date: stampTime,
      }
    );
    assertWriteSucceeded(verification, "Recording the signed document");

    const verificationId = verification.data?.verificationInfo?._id;
    /* Every lease and the event below are written against this id. Letting an
       undefined one through wrote a set of records that point at nothing. */
    if (!verificationId) {
      throw new Error(
        "The signed document was not recorded, so the lease has nothing to reference. Nothing else was written."
      );
    }
    return verificationId;
  };

  const createLeases = async ({ deviceInfo, address, verificationId }) => {
    const staffMember = checkArray(staffMemberQuery.data?.data?.member);
    if (!staffMember?.staff_id) {
      throw new Error("This person has no staff record to lease against.");
    }

    for (const device of deviceInfo) {
      assertWriteSucceeded(
        await devitrakApi.post("/db_lease/new-lease", {
          staff_admin_id: user.sqlMemberInfo.staff_id,
          company_id: user.sqlInfo.company_id,
          subscription_expected_return_data: dateToUse,
          location: `${address.street} ${address.city} ${address.state} ${address.zip}`,
          staff_member_id: staffMember.staff_id,
          device_id: device.item_id,
          verification_id: verificationId,
        }),
        `Leasing ${device.serial_number}`
      );
    }
  };

  const emailContracts = (items, verificationId) =>
    devitrakApi.post("/nodemailer/liability-contract-email-notification", {
      company_name: user.companyData.company_name,
      email_admin: user.email,
      staff: {
        name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`,
        email: profile.email,
        staff_member_id: profile.adminUserInfo.id,
      },
      contract_list: contractList,
      subject: "Device Liability Contract",
      items,
      company_id: user.companyData.id,
      date_reference: stampTime,
      verification_id: verificationId,
    });

  const registerDevicesInPool = async ({ deviceInfo, verificationId }) => {
    const items = [];
    for (const device of deviceInfo) {
      assertWriteSucceeded(
        await devitrakApi.post("/receiver/receivers-pool", {
          device: device.serial_number,
          status: "Operational",
          activity: true,
          comment: "No comment",
          eventSelected: eventName,
          provider: user.company,
          type: device.item_group,
          company: user.companyData.id,
          contract_type: "lease",
        }),
        `Registering ${device.serial_number}`
      );
      items.push({
        serial_number: device.serial_number,
        type: device.item_group,
        id: device.item_id,
      });
    }

    if (addContracts) await emailContracts(items, verificationId);
  };

  const createNoSqlEvent = async ({ deviceInfo, address, verificationId }) => {
    const leasedTime = new Date();
    leasedTime.setFullYear(leasedTime.getFullYear() + 2);

    const response = await devitrakApi.post("/event/create-event", {
      user: user.email,
      company: user.company,
      subscription: [],
      eventInfoDetail: {
        eventName,
        eventLocation: `${address.state}, ${address.zip}`,
        address: `${address.street}, ${address.city} ${address.state}, ${address.zip}`,
        building: eventName,
        floor: "",
        merchant: false,
        dateBegin: new Date().toString(),
        dateEnd: leasedTime.toString(),
        dateBeginTime: new Date().getTime(),
      },
      staff: {
        adminUser: [
          {
            firstName: user.name,
            lastName: user.lastName,
            email: user.email,
            role: "Administrator",
          },
        ],
        headsetAttendees: [],
      },
      deviceSetup: [
        {
          category: deviceInfo[0].category_name,
          group: deviceInfo[0].item_group,
          value: deviceInfo[0].cost,
          description: deviceInfo[0].descript_item,
          company: deviceInfo[0].company_id,
          ownership: deviceInfo[0].ownership,
          createdBy: user.email,
          key: deviceInfo[0].item_id,
          dateCreated: deviceInfo[0].create_at,
          resume: deviceInfo[0].descript_item,
          existing: true,
          quantity: deviceInfo.length,
          consumerUses: false,
          startingNumber: deviceInfo[0].serial_number,
          endingNumber: deviceInfo.at(-1).serial_number,
        },
      ],
      extraServicesNeeded: false,
      extraServices: [],
      active: true,
      contactInfo: {
        name: `${user.name} ${user.lastName}`,
        phone: [user.phone],
        email: user.email,
      },
      qrCodeLink: `https://app.devitrak.net/?event=${eventName.replace(
        / /g,
        "%20"
      )}&company=${user.companyData.id}`,
      type: "lease",
      company_id: user.companyData.id,
      contract_for: "staff",
    });

    if (!response.data?.ok) {
      throw new Error("The lease event could not be created.");
    }

    const created = checkArray(response.data.event);
    assertWriteSucceeded(
      await devitrakApi.patch(`/event/edit-event/${created.id}`, {
        qrCodeLink: `https://app.devitrak.net/?event=${created.id}&company=${user.companyData.id}`,
      }),
      "Stamping the lease event with its QR link"
    );
    await registerDevicesInPool({ deviceInfo, verificationId });
  };

  const linkDevicesToEvent = async ({ sqlEventId, deviceInfo }) => {
    for (const device of deviceInfo) {
      assertWriteSucceeded(
        await devitrakApi.post("/db_event/event_device_directly", {
          event_id: sqlEventId,
          item_id: device.item_id,
        }),
        `Linking ${device.serial_number} to the lease event`
      );
    }

    ["staffMemberInfo", "imagePerItemList", "ItemsInventoryCheckingQuery"].forEach(
      (key) => queryClient.invalidateQueries({ queryKey: [key] })
    );
    queryClient.invalidateQueries({ queryKey: ["assignedEquipmentStaff"] });
  };

  const onSubmit = async (data) => {
    setNotice(null);

    if (!summary.canSubmit) {
      return setFeedback({
        tone: "error",
        message: "Pick at least one unit to assign.",
      });
    }
    if (!isAddressUsable(data)) {
      return setNotice(
        "Complete the address or leave it empty — answering is optional, but a partial address cannot be used, and the ZIP needs to contain numbers."
      );
    }

    setIsSubmitting(true);
    try {
      // Re-read the picked serials as full item rows: the lease, the pool
      // record and the generated event all read fields the serial list does
      // not carry.
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

      const sqlEventId = await createSqlEvent(data);
      await updateDeviceInWarehouse(deviceInfo);
      const verificationId = await createVerification();
      await createLeases({ deviceInfo, address: data, verificationId });
      await createNoSqlEvent({ deviceInfo, address: data, verificationId });
      await linkDevicesToEvent({ sqlEventId, deviceInfo });

      notify(
        "success",
        `${deviceInfo.length} device${deviceInfo.length === 1 ? "" : "s"} assigned.`,
        `${profile.firstName ?? "This person"} is now holding them.`
      );
      return closeModal();
    } catch (error) {
      setNotice(
        error?.message ??
          "The assignment did not complete. Check the units and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemsInInventoryQuery.isLoading || staffMemberQuery.isLoading) {
    return <ProfileSkeleton lines={4} />;
  }

  const stepClass = (done) =>
    `action-form__step${done ? " action-form__step--done" : ""}`;

  return (
    <>
      {contextHolder}
      <form className="action-form" onSubmit={handleSubmit(onSubmit)}>
        <p className="action-form__lead">
          Units leave the warehouse and are leased to{" "}
          <strong>
            {[profile.firstName, profile.lastName].filter(Boolean).join(" ")}
          </strong>
          . Nothing is written until you confirm.
        </p>

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
              disabled={isSubmitting}
              placeholder="Search a device, category or location"
              optionFilterProp="label"
              style={{ ...AntSelectorStyle, width: "100%" }}
              onChange={handleSelectGroup}
              options={options.map((option) => ({
                // A plain label, so the built-in search actually matches on it.
                // Each option used to be a three-column Typography block, which
                // the filter could not read.
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
                  disabled={isSubmitting}
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
                      disabled={isSubmitting}
                      onChange={(changeEvent) => setSerial(changeEvent.target.value)}
                      onKeyDown={(keyEvent) => {
                        // Enter adds a unit; it must not submit the whole form.
                        if (keyEvent.key === "Enter") handleAddSerial(keyEvent);
                      }}
                    />
                  </div>
                  <BlueButtonComponent
                    title="Add"
                    buttonType="button"
                    disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                            isSubmitting
                              ? undefined
                              : () =>
                                  addUnit(unit, `${unit.serial_number} added.`)
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

        {/* 3 — where it will be used */}
        <section className={stepClass(isAddressUsable(watch()))}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">3</span>
              Where the equipment will be used
            </h3>
          </div>
          <p className="action-form__step-note">
            Stamped on the lease record and on the generated event.
          </p>
          <div className="action-form__grid">
            <div className="action-form__field action-form__field--wide">
              <Label>Street</Label>
              <Input {...register("street")} disabled={isSubmitting} />
            </div>
            <div className="action-form__field">
              <Label>City</Label>
              <Input {...register("city")} disabled={isSubmitting} />
            </div>
            <div className="action-form__field">
              <Label>State</Label>
              <Input {...register("state")} disabled={isSubmitting} />
            </div>
            <div className="action-form__field">
              <Label>ZIP</Label>
              <Input {...register("zip")} disabled={isSubmitting} />
            </div>
          </div>
        </section>

        {/* 4 — documents */}
        <section className={stepClass(addContracts && contractList.length > 0)}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">4</span>
              Documents to sign
            </h3>
          </div>
          <LegalDocumentModal
            addContracts={addContracts}
            setAddContracts={setAddContracts}
            setValue={setValue}
            register={register}
            loadingStatus={isSubmitting}
            profile={profile}
            selectedDocuments={contractList}
            setSelectedDocuments={setContractList}
            titleRef={"staff"}
          />
        </section>

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
              <dt>Documents</dt>
              <dd>{addContracts ? contractList.length : "None"}</dd>
            </div>
          </dl>
        )}

        {notice && <p className="action-form__notice">{notice}</p>}

        <div className="action-form__footer">
          <p className="action-form__consequence">
            The units are marked as assigned and a lease is opened for them.
          </p>
          <GrayButtonComponent
            title="Cancel"
            buttonType="button"
            disabled={isSubmitting}
            func={closeModal}
          />
          <BlueButtonComponent
            title={
              summary.canSubmit
                ? `Assign ${summary.picked} device${summary.picked === 1 ? "" : "s"}`
                : "Assign equipment"
            }
            buttonType="submit"
            isDisabled={!summary.canSubmit || isSubmitting}
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </>
  );
};

export default AssignmentFromExistingInventory;
