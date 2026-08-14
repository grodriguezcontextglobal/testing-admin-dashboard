/* eslint-disable no-unused-vars */
import {
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Divider, Select } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { getIndustryProfile } from "../../../../../../../config/industryProfiles";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { registerStaffActivity } from "../../../../../../../api/activityLog";
import DevitrakLoading from "../../../../../../../components/animation/DevitrakLoading";
import { BorderedCloseIcon } from "../../../../../../../components/icons/BorderedCloseIcon";
import { CheckIcon } from "../../../../../../../components/icons/CheckIcon";
import { formatDate } from "../../../../../../../components/utils/dateFormat";
import {
  parseDateInputValue,
  todayDateInputValue,
} from "../../../../../utils/leaseDateUtils";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import { AntSelectorStyle } from "../../../../../../../styles/global/AntSelectorStyle";
import CenteringGrid from "../../../../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import { useStatusNotification } from "../../../../../../../components/notification/alerts/useStatusNotification";
import LegalDocumentModal from "../documents/DocumentsLoadedAsContracts";
import { useStaffRoleAndLocations } from "../../../../../../../utils/checkStaffRoleAndLocations";
import Input from "../../../../../../../components/UX/inputs/Input";
import {
  classifyAssignmentError,
  getAssignmentErrorMessage,
} from "../../../../../utils/assignmentErrorUtils";
import {
  isConsentRequired,
  hasValidConsent,
  getConsentStatusMessage,
} from "../../../../../utils/consentCheckUtils";
import { fetchStudentConsent } from "../../../../../utils/guardianConsentApi";
import {
  isContractEmailRequired,
  shouldSendContractEmail,
} from "../../../../../utils/contractEmailPolicy";
import {
  normalizeConsentStatus,
  isAssignmentBlockedByConsent,
  isConsentRequiredForMember,
  getConsentStatusCopy,
} from "../../../../../utils/guardianConsentUtils";
import { buildAssignmentRollbackPayload } from "../../../../../utils/leaseReturnUtils";
import { fetchSchoolSettings } from "../../../../../../../pages/Profile/school_compliance/utils/schoolComplianceUtils";
import ReceiptModal from "../../../../../../payment/components/ReceiptModal";
import { mapAssignmentToReceipt } from "../../../../../../payment/utils/receiptUtils";

const AssignmentDevicesToMember = () => {
  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      quantity: 1,
    },
  });
  const { user } = useSelector((state) => state.admin);
  const { memberInfo } = useSelector((state) => state.member);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [checkingSerialNumberInputted, setCheckingSerialNumberInputted] =
    useState(false);
  const [addContracts, setAddContracts] = useState(false);
  // COPPA: handing a device to a member under 13 always notifies the guardian,
  // so the staff member cannot opt out of the email. Being a minor is NOT
  // enough on its own — 13-17 keeps the email optional, which is why this
  // reads under_13 rather than minor.
  //
  // The recipient is guaranteed: emailContractToMember already routes to
  // parent_guardian_email whenever the member is a minor, and the guardian
  // gate further down blocks the assignment outright when a minor has no
  // complete guardian on file.
  //
  // Derived rather than forced into addContracts via an effect, so the two can
  // never drift apart — and so unchecking the box can't silently win.
  //
  // The coercion lives in contractEmailPolicy because under_13 arrives as
  // 1/0, "1"/"0" or true/false depending on the path, and a bare
  // Boolean(under_13) reads the string "0" as true — which would have forced
  // the email for members who are not under 13.
  const contractEmailRequired = isContractEmailRequired(memberInfo);
  const sendContractEmail = shouldSendContractEmail(memberInfo, addContracts);
  const [contractList, setContractList] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  // Handover slip, offered after a successful assignment. Optional by design —
  // the modal's Close button skips it. Both answers navigate to the member
  // page, so the flow ends in the same place either way.
  const [assignmentReceipt, setAssignmentReceipt] = useState(null);
  const verificationInfo = {};
  const dateToUse = useMemo(() => formatDate(new Date()), []);
  let dataFound = useRef([]);
  const stampTime = useMemo(() => new Date().toISOString(), []);
  const navigate = useNavigate();
  // Initialize expected return date with today's date in the form.
  // YYYY-MM-DD, not the full "YYYY-MM-DD HH:mm:ss" stamp: `<input type="date">`
  // rejects a value carrying a time outright, so the default was invisible — the
  // field rendered empty while the form state claimed a default.
  const defaultDueDate = useMemo(() => todayDateInputValue(), []);
  useEffect(() => {
    setValue("expectedReturnDate", defaultDueDate);
  }, [defaultDueDate, setValue]);


  const { role, locationsAssignPermission } = useStaffRoleAndLocations();
  // const bodyFetchRequest = () => {
  //   if (role === "0" || role === 0) {
  //     return {
  //       company_id: user.sqlInfo.company_id,
  //       warehouse: 1,
  //       enableAssignFeature: 1,
  //     };
  //   }
  //   return {
  //     company_id: user.sqlInfo.company_id,
  //     warehouse: 1,
  //     enableAssignFeature: 1,
  //     location: locationsAssignPermission,
  //   };
  // };
  const itemsInInventoryQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post(
        "/db_event/retrieve-item-group-location-quantity",
        {
          company_id: user.sqlInfo.company_id,
          warehouse: 1,
          enableAssignFeature: 1,
          location: locationsAssignPermission,
          logistic_status:"in-stock"
        }
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 1 * 60 * 100, // 1 minutes
  });
  const queryClient = useQueryClient();
  dataFound.current = itemsInInventoryQuery?.data?.data;

  // Fetch school compliance settings for Education companies
  const isEducation = user?.companyData?.industry === "Education";
  const schoolSettingsQuery = useQuery({
    queryKey: ["schoolSettings", user.sqlInfo.company_id],
    queryFn: () => fetchSchoolSettings(user.sqlInfo.company_id),
    enabled: isEducation,
    staleTime: 5 * 60 * 1000,
  });
  const schoolSettings = schoolSettingsQuery.data?.settings || {};
  const memberIsMinor = isEducation && Number(memberInfo?.minor) === 1;
  const memberIsUnder13 = isEducation && Boolean(memberInfo?.under_13);
  // Whether consent even applies to this member: each toggle is an age scope, so
  // with both off no age is checked and the assignment proceeds. An earlier
  // version of this gate blocked every minor regardless of the settings, which
  // asked a school for consent it had explicitly not turned on.
  const consentApplies = isConsentRequiredForMember({
    isMinor: memberIsMinor,
    isUnder13: memberIsUnder13,
    settings: schoolSettings,
  });
  // Fetch real consent status from server, exactly when it could change the
  // answer. Was gated on `schoolSettings.enforce_member_consent`, a key
  // /school/settings does not return — so the condition read `undefined` and the
  // query never ran for any company that had not also switched on
  // enforce_under_13. Without the status there was nothing to block on, and the
  // first thing to notice the missing consent was the server, one warehouse write
  // too late.
  const consentQuery = useQuery({
    queryKey: [
      "studentConsentStatus",
      memberInfo?.member_id,
      user.sqlInfo.company_id,
    ],
    queryFn: () => fetchStudentConsent(user.sqlInfo.company_id, memberInfo.member_id),
    enabled: !!memberInfo?.member_id && consentApplies,
    staleTime: 1 * 60 * 1000,
  });
  const consentData = consentQuery.data;
  const consentStatus = normalizeConsentStatus(
    consentData,
    schoolSettings.required_consent_policy_version
  );
  const isConsentBlocking = isAssignmentBlockedByConsent({
    consentStatus,
    settings: schoolSettings,
    isMinor: memberIsMinor,
    isUnder13: memberIsUnder13,
  });
  const optionsToRenderInSelector = () => {
    const result = [];
    const groupedInventory = dataFound.current?.groupedInventory ?? {};

    // Iterate through categories (Category1, Category2, etc.)
    for (const [categoryName, categoryData] of Object.entries(
      groupedInventory
    )) {
      // Iterate through items within each category (Item1, Item2, etc.)
      for (const [itemGroup, itemData] of Object.entries(categoryData)) {
        // Iterate through locations within each item
        for (const [location, quantity] of Object.entries(itemData)) {
          result.push({
            category_name: categoryName,
            item_group: itemGroup,
            location: location,
            total: quantity,
            data: JSON.stringify({
              category_name: categoryName,
              item_group: itemGroup,
              location: location,
              quantity: quantity,
            }),
          });
        }
      }
    }

    return result;
  };
  const onChange = async (value) => {
    const optionRendering = JSON.parse(value);
    const fetchSelectedItem = await devitrakApi.post(
      "/db_event/inventory-query",
      {
        queryName: "inventory.serialsByGroupCategoryLocation",
        params: {
          itemGroup: optionRendering.item_group,
          categoryName: optionRendering.category_name,
          location: optionRendering.location,
        },
      }
    );
    if (fetchSelectedItem.data) {
      if (fetchSelectedItem.data.result.length === 1) {
        setValue(
          "startingNumber",
          fetchSelectedItem.data.result[0].serial_number
        );
        return setValueItemSelected({
          ...optionRendering,
          min_serial_number: fetchSelectedItem.data.result[0].serial_number,
          max_serial_number: fetchSelectedItem.data.result?.at(-1)?.serial_number,
          data: JSON.stringify(fetchSelectedItem.data.result),
          quantity: 0,
        });
      }
      setValue(
        "startingNumber",
        fetchSelectedItem.data.result[0].serial_number
      );
      return setValueItemSelected({
        ...optionRendering,
        min_serial_number: fetchSelectedItem.data.result[0].serial_number,
        max_serial_number: fetchSelectedItem.data.result?.at(-1)?.serial_number,
        data: JSON.stringify(fetchSelectedItem.data.result),
        quantity: 0,
      });
    }
  };
  const { notify, contextHolder } = useStatusNotification();
  const updateDeviceInWarehouse = async (props) => {
    await devitrakApi.post("/db_item/item-out-warehouse", {
      warehouse: 0,
      logistic_status: "assigned",
      company_id: user.sqlInfo.company_id,
      item_group: props.item_group,
      category_name: props.category_name,
      data: props.data,
    });
  };
  const createNewLease = async (props) => {
    const verificationContractID = await verificationContractMember();
    // parseDateInputValue, not new Date(): the field hands over "2026-08-20",
    // which new Date reads as midnight UTC, and formatDate then writes local
    // components — so a device picked to be due on the 20th was stored as due
    // the 19th at 20:00 anywhere west of Greenwich. Resolved once for the whole
    // batch so every device in one handover carries the same due date.
    const dueDate = parseDateInputValue(props.expectedReturnDate);
    const expectedReturnDate = dueDate ? formatDate(dueDate) : dateToUse;
    for (let data of props.deviceInfo) {
      const newLease = await devitrakApi.post(
        "/db_member/new-member-assigned-device-lease",
        {
          staff_member_id: user.sqlMemberInfo.staff_id,
          company_id: user.sqlInfo.company_id,
          location: `${props.street} ${props.city} ${props.state} ${props.zip}`,
          member_id: memberInfo.member_id,
          device_id: data.item_id,
          verification_id: verificationContractID.data.verificationInfo._id,
          expected_return_date: expectedReturnDate,
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
        details: { device_id: data.item_id },
      });
    }
    return (verificationInfo._id =
      verificationContractID.data.verificationInfo._id);
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
      await devitrakApi.post("/db_item/item-out-warehouse", payload);
      return [];
    } catch {
      return payload.data;
    }
  };

  // First-class lease lifecycle: warehouse-out -> lease rows (+ contract
  // verification) -> contract email -> done. No pseudo-events, no receiver
  // pools — the lease table is the single source of truth.
  const option1 = async (props) => {
    const deviceInfo = props.selectedData; //*array of existing devices in sql db
    if (deviceInfo.length > 0) {
      await updateDeviceInWarehouse({
        item_group: deviceInfo[0].item_group,
        category_name: deviceInfo[0].category_name,
        data: [...deviceInfo.map((item) => item.serial_number)],
      });
      // Anything that stops the lease from being written has to put the hardware
      // back. The pre-flight gate below catches the common case (a minor without
      // consent), but a race, a stale device or a dropped connection all end here
      // too, and every one of them used to cost a device from the shelf.
      try {
        await createNewLease({ ...props.template, deviceInfo });
      } catch (error) {
        const stranded = await rollbackWarehouseAssignment(deviceInfo);
        if (stranded.length > 0) {
          error.strandedSerials = stranded;
        }
        throw error;
      }
      if (sendContractEmail) {
        await emailContractToMember({
          contractList: contractList,
          items: deviceInfo.map((d) => ({
            serial_number: d.serial_number,
            type: d.item_group,
            id: d.item_id,
          })),
          verification_id: verificationInfo._id,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["staffMemberInfo"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["imagePerItemList"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["ItemsInventoryCheckingQuery"], exact: true });
      queryClient.invalidateQueries({
        queryKey: ["memberAssignedDevices"],
        exact: true,
        refetchType: "active",
        refetchActive: true,
      });
      notify(
        "success",
        "Equipment assigned to member.",
        ""
      );
      setLoadingStatus(false);
      // Offer the receipt before leaving: navigating first unmounts the prompt.
      // Whichever button is used, closing it navigates to the member page, so a
      // staff member who does not want a printout ends up exactly where the
      // flow used to take them.
      return setAssignmentReceipt(
        mapAssignmentToReceipt({
          member: memberInfo,
          devices: deviceInfo,
          company: user?.company,
          date: stampTime,
          staffName: [user?.name, user?.lastName].filter(Boolean).join(" "),
          reference: watch("expectedReturnDate")
            ? `Due ${watch("expectedReturnDate")}`
            : "",
        })
      );
    }
  };
  const verificationContractMember = async () => {
    const verification = await devitrakApi.post(
      "/document/verification/member/signed_document",
      {
        contract_list: contractList,
        date: stampTime,
        company_id: user.sqlInfo.company_id,
        member_id: memberInfo.member_id,
        assigner_staff_member_id: user.sqlMemberInfo.staff_id,
      }
    );
    return verification;
  };
  const emailContractToMember = async (props) => {
    // Responsible party: for minors the parent/guardian (representative)
    // receives and signs the liability contract; adults sign for themselves.
    const isMinor = Number(memberInfo.minor) === 1;
    const responsibleParty = isMinor
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
        contract_list: props.contractList,
        subject: "Device Liability Contract",
        items: props.items,
        company_id: user.companyData.id,
        date_reference: stampTime,
        verification_id: props.verification_id ?? verificationInfo._id,
      }
    );
    return null;
  };
  const assignDeviceToMember = async (data) => {
    try {
      const template = {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        expectedReturnDate: data.expectedReturnDate,
      };
      setLoadingStatus(true);
      if (data.startingNumber?.length > 0) {
        const data_serial_numbers = JSON.parse(valueItemSelected.data);
        if (data_serial_numbers.length > 0) {
          const index = data_serial_numbers.findIndex(
            (item) => item.serial_number === data.startingNumber
          );
          if (index > -1) {
            const selectedData = data_serial_numbers.slice(
              index,
              index + Number(data.quantity)
            );
            const gettingAllInfo = await devitrakApi.post(
              "/db_event/inventory-query",
              {
                queryName: "inventory.itemsByGroupCategoryLocationSerials",
                params: {
                  itemGroup: valueItemSelected.item_group,
                  categoryName: valueItemSelected.category_name,
                  location: valueItemSelected.location,
                  serialNumbers: selectedData.map((item) => item.serial_number),
                },
              }
            );

            // Pre-assignment consent gate: block before any warehouse mutation.
            //
            // This is the check that let the reported bug through. It read
            // `enforce_member_consent`, a key /school/settings does not return, so
            // enforcement evaluated as OFF even for a school that had switched it
            // ON. The gate passed, the device left the warehouse, and the lease
            // came back CONSENT_REQUIRED with nothing recorded.
            const memberUnder13Check = memberIsUnder13;
            const consentAlreadyExistsCheck = hasValidConsent(memberInfo.consent);

            // Real consent status when the endpoint answered; the record on the
            // member when it did not. Both defer to the same age scopes, so a
            // company with both toggles off is never asked for consent.
            const preCheckConsentBlocking = consentQuery.isSuccess
              ? isAssignmentBlockedByConsent({
                  consentStatus,
                  settings: schoolSettings,
                  isMinor: memberIsMinor,
                  isUnder13: memberUnder13Check,
                })
              : consentApplies && !consentAlreadyExistsCheck;

            if (preCheckConsentBlocking) {
              const consentMsg = consentQuery.isSuccess
                ? getConsentStatusCopy(consentStatus)
                : getConsentStatusMessage({
                    isMinor: memberIsMinor,
                    isUnder13: memberUnder13Check,
                    consentRequired: true,
                    consentExists: false,
                  });
              notify("warning", consentMsg, "");
              setLoadingStatus(false);
              navigate(`/member/${memberInfo.member_id}/update-member-information`);
              return;
            }

            await option1({
              groupingType: valueItemSelected.item_group,
              template: template,
              quantity: data.quantity,
              selectedData: gettingAllInfo.data.result,
            });
          }
        }
      }
    } catch (error) {
      const classification = classifyAssignmentError(error);
      const baseMessage = getAssignmentErrorMessage(classification);
      // The rollback is best-effort; when it fails too, the serials it could not
      // restore are named here. Inventory now disagrees with reality and only a
      // human can fix it, so this must never be folded into a generic message.
      const errorMessage = error.strandedSerials?.length
        ? `${baseMessage} WARNING: ${error.strandedSerials.join(
            ", "
          )} could not be returned to stock — fix them in inventory before assigning again.`
        : baseMessage;

      // Takes precedence over every classification below, and deliberately does
      // not navigate away: this is the one failure a staff member has to act on,
      // and the consent branches leave the page.
      if (error.strandedSerials?.length) {
        notify("error", errorMessage, "");
        setLoadingStatus(false);
        return;
      }

      if (classification.type === "CONSENT_REQUIRED") {
        notify("warning", errorMessage, "");
        setLoadingStatus(false);
        navigate(`/member/${memberInfo.member_id}/update-member-information`);
        return;
      }

      if (classification.type === "UNDER_13_CONSENT_REQUIRED") {
        notify("warning", errorMessage, "");
        setLoadingStatus(false);
        navigate(`/member/${memberInfo.member_id}/update-member-information`);
        return;
      }

      if (classification.type === "GUARDIAN_REQUIRED") {
        notify("warning", errorMessage, "");
        setLoadingStatus(false);
        navigate(`/member/${memberInfo.member_id}/update-member-information`);
        return;
      }

      notify("error", errorMessage, "");
      setLoadingStatus(false);
    } finally {
      setLoadingStatus(false);
    }
  };
  const renderTitle = () => {
    return (
      <>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <p
            style={{
              ...TextFontSize30LineHeight38,
              textAlign: "left",
              color: "var(--gray600, #475467)",
            }}
          >
            Assign a device to member: {`${memberInfo.first_name ?? ""} ${memberInfo.last_name ?? ""
              }`} from existing inventory.
          </p>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              color: "var(--gray600, #475467)",
              textAlign: "left",
              textTransform: "none",
            }}
          >
            You can enter all the details manually or use a scanner to enter the
            serial number.
          </p>
        </InputLabel>
      </>
    );
  };
  useEffect(() => {
    const checkingSerialNumberInputted = async () => {
      // No device group selected yet — nothing to validate.
      if (!valueItemSelected?.data || !watch("startingNumber")) return;
      const data = JSON.parse(valueItemSelected.data);
      if (!Array.isArray(data) || !data.length) return;
      if (watch("startingNumber").length === data[0].serial_number.length) {
        setCheckingSerialNumberInputted(
          data.some((item) => item.serial_number === watch("startingNumber"))
        );
      }
    };
    checkingSerialNumberInputted();
  }, [watch("startingNumber"), valueItemSelected]);

  // Deep links hydrate memberInfo asynchronously (dashboard fetch -> Redux);
  // render the loading state until the member is available.
  if (!memberInfo?.member_id) {
    return (
      <div style={CenteringGrid}>
        <DevitrakLoading />
      </div>
    );
  }

  // Representative accountability: minors need a complete parent/guardian on
  // file — the guardian is the responsible party who signs the contract.
  const isMinor = Number(memberInfo.minor) === 1;
  const repLabel = getIndustryProfile(
    user?.companyData?.industry
  ).representative.label.toLowerCase();
  const guardianComplete = Boolean(
    memberInfo.parent_guardian_first_name?.trim?.() &&
      memberInfo.parent_guardian_email?.trim?.()
  );
  const guardianIncomplete = isMinor && !guardianComplete;

  // Consent gate: use real consent status from API when available,
  // fall back to isConsentRequired for companies without consent endpoint
  const memberUnder13 = Boolean(memberInfo.under_13);
  const enforceConsent = Boolean(schoolSettings.enforce_member_consent);
  const enforceUnder13Flag = Boolean(schoolSettings.enforce_under_13);
  const consentAlreadyExists = hasValidConsent(memberInfo.consent);
  const consentNeededLegacy = isConsentRequired({
    isMinor,
    isUnder13: memberUnder13,
    enforceMemberConsent: enforceConsent,
    enforceUnder13: enforceUnder13Flag,
    consentExists: consentAlreadyExists,
  });

  // Use real API status when query succeeded, otherwise fall back to legacy check
  const consentNeeded = consentQuery.isSuccess
    ? isConsentBlocking
    : consentNeededLegacy;

  const responsibleBanner = () => {
    const base = {
      width: "100%",
      textAlign: "left",
      borderRadius: "var(--radius-md, 8px)",
      padding: "12px 16px",
      margin: "0 0 16px",
      fontFamily: "Inter, sans-serif",
      fontSize: "14px",
      lineHeight: "20px",
    };
    if (guardianIncomplete) {
      return (
        <div
          role="alert"
          style={{
            ...base,
            background: "var(--error-25, #fdf7f5)",
            border: "1px solid var(--error-300, #e28f75)",
            color: "var(--error-700, #9a3922)",
          }}
        >
          <strong>Representative required.</strong> {memberInfo.first_name} is a
          minor and has no complete {repLabel} on file. Devices cannot be
          assigned until a representative (name + email) is added in{" "}
          <NavLink
            to={`/member/${memberInfo.member_id}/update-member-information`}
            style={{ color: "var(--error-700, #9a3922)", fontWeight: 700 }}
          >
            Update member info
          </NavLink>
          .
        </div>
      );
    }

    // Consent required banner (Education companies with consent enforcement)
    if (consentNeeded) {
      const statusCopy = consentQuery.isSuccess
        ? getConsentStatusCopy(consentStatus)
        : getConsentStatusMessage({
            isMinor,
            isUnder13: memberUnder13,
            consentRequired: true,
            consentExists: false,
          });

      const bannerColor =
        consentStatus === "agreed"
          ? {
              bg: "var(--success-25, #f0fdf4)",
              border: "var(--success-300, #86efac)",
              text: "var(--success-700, #15803d)",
            }
          : consentStatus === "refused"
            ? {
                bg: "var(--error-25, #fdf7f5)",
                border: "var(--error-300, #e28f75)",
                text: "var(--error-700, #9a3922)",
              }
            : consentStatus === "pending"
              ? {
                  bg: "var(--blue-50, #eff8ff)",
                  border: "var(--blue-200, #b2ddff)",
                  text: "var(--blue-800, #1849a9)",
                }
              : {
                  bg: "var(--warning-bg, #FEF3C7)",
                  border: "var(--warning-border, #F59E0B)",
                  text: "var(--warning-text, #92400E)",
                };

      return (
        <div
          role="alert"
          style={{
            ...base,
            background: bannerColor.bg,
            border: `1px solid ${bannerColor.border}`,
            color: bannerColor.text,
          }}
        >
          <strong>Consent status: {consentStatus}.</strong> {statusCopy}{" "}
          <NavLink
            to={`/member/${memberInfo.member_id}/update-member-information`}
            style={{ color: bannerColor.text, fontWeight: 700 }}
          >
            {consentStatus === "pending"
              ? "View consent panel"
              : consentStatus === "agreed"
                ? "View consent details"
                : "Update consent"}
          </NavLink>
          .
        </div>
      );
    }

    if (isMinor) {
      return (
        <div
          style={{
            ...base,
            background: "var(--blue-50, #eff8ff)",
            border: "1px solid var(--blue-200, #b2ddff)",
            color: "var(--blue-800, #1849a9)",
          }}
        >
          <strong>Minor — represented by {memberInfo.parent_guardian_first_name}{" "}
          {memberInfo.parent_guardian_last_name}</strong> (
          {memberInfo.parent_guardian_email}). The liability contract will be
          sent to the representative for signature; responsibility for the
          device falls on them.
        </div>
      );
    }
    return (
      <div
        style={{
          ...base,
          background: "var(--gray-50, #f7f7f4)",
          border: "1px solid var(--gray-200, #ddded6)",
          color: "var(--gray-600, #5d615a)",
        }}
      >
        <strong>Adult.</strong> {memberInfo.first_name} signs their own
        liability contract and is directly responsible for the device.
      </div>
    );
  };

  return (
    <>
      {itemsInInventoryQuery.isLoading ? (
        <div style={CenteringGrid}>
          <DevitrakLoading />
        </div>
      ) : (
        <Grid
          container
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          marginY={2}
          key={"settingUp-deviceList-event"}
        >
          {contextHolder}
          {renderTitle()}
          {responsibleBanner()}
          <form
            style={{ width: "100%" }}
            onSubmit={handleSubmit(assignDeviceToMember)}
          >
            <Grid
              style={{
                borderRadius: "8px",
                border: "1px solid var(--gray-300, #D0D5DD)",
                background: "var(--gray-100, #F2F4F7)",
                padding: "24px",
                width: "100%",
              }}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <InputLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                <p style={Subtitle}>
                  Location where device is going to be used/located physically.
                </p>
              </InputLabel>
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                  margin: "0 0 20px 0",
                  gap: "1rem",
                }}
              >
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>Street</p>
                  </InputLabel>
                  <Input
                    {...register("street")}
                    disabled={loadingStatus}
                    style={{
                      
                      width: "100%",
                    }}
                    fullWidth
                    required
                  />
                </div>
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>City</p>
                  </InputLabel>
                  <Input
                    disabled={loadingStatus}
                    {...register("city")}
                    style={{
                      
                      width: "100%",
                    }}
                    required
                    fullWidth
                  />
                </div>
              </div>
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                  margin: "0 0 20px 0",
                  gap: "1rem",
                }}
              >
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>State</p>
                  </InputLabel>
                  <Input
                    {...register("state")}
                    disabled={loadingStatus}
                    style={{
                      
                      width: "100%",
                    }}
                    required
                    fullWidth
                  />
                </div>
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>Zip</p>
                  </InputLabel>
                  <Input
                    disabled={loadingStatus}
                    {...register("zip")}
                    style={{
                      
                      width: "100%",
                    }}
                    required
                    fullWidth
                  />
                </div>
              </div>
              {/* Expected Return Date */}
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                  margin: "0 0 20px 0",
                  gap: "1rem",
                }}
              >
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>Expected return date</p>
                  </InputLabel>
                  <Input
                    type="date"
                    disabled={loadingStatus}
                    {...register("expectedReturnDate")}
                    style={{
                      
                      width: "100%",
                    }}
                    fullWidth
                  />
                </div>
              </div>
              <LegalDocumentModal
                emailRequired={contractEmailRequired}
                addContracts={addContracts}
                setAddContracts={setAddContracts}
                setValue={setValue}
                register={register}
                loadingStatus={loadingStatus}
                profile={memberInfo}
                selectedDocuments={contractList}
                setSelectedDocuments={setContractList}
                titleRef={`${memberInfo.first_name} ${memberInfo.last_name}`}
              />
              <Divider />
              <InputLabel
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    ...TextFontSize20LineHeight30,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Device
                </p>
              </InputLabel>
              <div
                style={{
                  width: "100%",
                }}
              >
                <Grid
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  marginY={2}
                  gap={2}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <Grid
                    style={{ alignSelf: "baseline" }}
                    item
                    xs={6}
                    sm={6}
                    md={11}
                    lg={11}
                  >
                    <InputLabel
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      <p
                        style={{
                          ...TextFontSize20LineHeight30,
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#000",
                          textTransform: "none",
                        }}
                      >
                        Select from existing category
                      </p>
                    </InputLabel>
                    <Select
                      className="custom-autocomplete"
                      showSearch
                      placeholder="Search item to add to inventory."
                      optionFilterProp="children"
                      style={{ ...AntSelectorStyle, width: "100%" }}
                      onChange={onChange}
                      options={optionsToRenderInSelector().map((item) => {
                        return {
                          label: (
                            <Typography
                              textTransform={"capitalize"}
                              style={{
                                ...Subtitle,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <span style={{ width: "50%" }}>
                                <span style={{ fontWeight: 700 }}>
                                  {item.category_name}
                                </span>{" "}
                                {item.item_group}
                              </span>
                              <span style={{ textAlign: "left", width: "30%" }}>
                                Location:{" "}
                                <span style={{ fontWeight: 700 }}>
                                  {item.location}
                                </span>
                              </span>
                              <span
                                style={{ textAlign: "right", width: "20%" }}
                              >
                                Total available: {item.total}
                              </span>
                            </Typography>
                          ),
                          value: item.data,
                        };
                      })}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={6}
                    sm={6}
                    md={1}
                    lg={1}
                    style={{ alignSelf: "baseline" }}
                  >
                    <InputLabel
                      style={{ marginBottom: "0.2rem", width: "100%" }}
                    >
                      <p style={Subtitle}>Quantity</p>
                    </InputLabel>
                    <Input
                      disabled={loadingStatus}
                      required
                      {...register("quantity")}
                      style={{
                        
                        width: "100%",
                      }}
                      placeholder="e.g. 0"
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Grid
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  marginY={2}
                  gap={2}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                    style={{ alignSelf: "baseline" }}
                  >
                    <InputLabel
                      style={{ marginBottom: "0.2rem", width: "100%" }}
                    >
                      <p style={Subtitle}>
                        Starting serial number | Current range{" "}
                        <strong>
                          (starting: {valueItemSelected.min_serial_number ?? 0}{" "}
                          ending: {valueItemSelected.max_serial_number ?? 0})
                        </strong>
                      </p>
                    </InputLabel>
                    <Input
                      disabled={
                        loadingStatus ||
                        valueItemSelected.max_serial_number ===
                        valueItemSelected.min_serial_number
                      }
                      required
                      {...register("startingNumber", {
                        required: true,
                        message: "Starting serial number is required",
                      })}
                      style={{
                        
                        width: "100%",
                      }}
                      placeholder={`Selected category serial numbers start: ${valueItemSelected.min_serial_number} end: ${valueItemSelected.max_serial_number}`}
                      fullWidth
                      endAdornment={
                        <InputAdornment position="end">
                          {checkingSerialNumberInputted ? (
                            <CheckIcon />
                          ) : (
                            <BorderedCloseIcon />
                          )}
                        </InputAdornment>
                      }
                    />
                  </Grid>
                </Grid>
              </div>
            </Grid>
            <Grid
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
              }}
              marginY={"0.5rem"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <GrayButtonComponent
                title={"Go back"}
                func={() => navigate(`/member/${memberInfo?.member_id}/main`)}
              />
              <BlueButtonComponent
                disabled={
                  watch("startingNumber")?.length === 0 ||
                  !watch("startingNumber") ||
                  loadingStatus ||
                  !checkingSerialNumberInputted ||
                  guardianIncomplete ||
                  consentNeeded
                }
                buttonType="submit"
                loadingState={loadingStatus}
                title={`Assign equipment to member ${memberInfo?.first_name} ${memberInfo?.last_name}`}
                func={() => null}
                styles={{ ...CenteringGrid, width: "100%" }}
              />
            </Grid>
          </form>
        </Grid>
      )}
      {/* No QR on a handover slip. The lookup behind it needs member_id +
          company_id, both small sequential integers, so a scannable URL would
          be trivially enumerable against records that carry a student's name
          and a guardian's email. The device's current status is already on the
          member's profile, where it is behind the session. */}
      {assignmentReceipt && (
        <ReceiptModal
          openModal={Boolean(assignmentReceipt)}
          setOpenModal={() => setAssignmentReceipt(null)}
          receipt={assignmentReceipt}
          title={"Print a receipt for this handover?"}
          onClose={() => navigate(`/member/${memberInfo?.member_id}/main`)}
        />
      )}
    </>
  );
};

export default AssignmentDevicesToMember;
