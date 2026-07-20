/* eslint-disable react/prop-types */
import { yupResolver } from "@hookform/resolvers/yup";
import { MenuItem, Select } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { ROLE_LEVELS, resolveRoleType } from "../../../config/roles";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import "../detail/components/equipment_components/assingmentComponents/style.css";
import {
  buildEmployeeEntry,
  buildInvitationLink,
  buildRoleOptions,
  newStaffSchema,
  roleTypeFromRole,
} from "./utils/newStaffMemberUtils";

const titleStyle = {
  color: "var(--gray-900, #101828)",
  fontFamily: "Inter",
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  margin: 0,
};

const errorCaption = {
  fontSize: "12px",
  fontFamily: "Inter",
  color: "var(--error, #B42318)",
  marginTop: "4px",
  display: "block",
};

const fieldWrapper = { display: "flex", flexDirection: "column", gap: "6px", width: "100%" };

export const NewStaffMember = ({ modalState, setModalState }) => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [needCreate, setNeedCreate] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const userLevel = ROLE_LEVELS[resolveRoleType(user)] ?? 99;
  const roleOptions = buildRoleOptions(userLevel);

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(newStaffSchema, { context: { needCreate } }),
  });

  const companiesQuery = useQuery({
    queryKey: ["companyListQuery"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", { _id: user.companyData.id }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    companiesQuery.refetch();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.company]);

  const notify = (type, content) => {
    messageApi.open({ type, content, onClose: () => setValue("email", "") });
  };

  const addEmployeeAndInvite = async ({ name, lastName, email, role }) => {
    const companyInfo = companiesQuery?.data?.data?.company?.[0];
    if (!companyInfo?.id) {
      notify("error", "Company info not loaded. Please try again.");
      return;
    }

    await devitrakApi.patch(`/company/update-company/${companyInfo.id}`, {
      employees: [
        ...companyInfo.employees,
        buildEmployeeEntry({ name, lastName, email, role }),
      ],
    });

    await devitrakApi.post("/nodemailer/new_invitation", {
      consumer: email,
      subject: "Invitation",
      company: user.company,
      link: buildInvitationLink({
        name,
        lastName,
        email,
        company: user.company,
        companyId: user.companyData.id,
        role,
        roleType: roleTypeFromRole(role),
      }),
    });

    queryClient.invalidateQueries({ queryKey: ["listAdminUsers"], exact: true });
    queryClient.invalidateQueries({ queryKey: ["staff"], exact: true });
    queryClient.invalidateQueries({ queryKey: ["employeesPerCompanyList"], exact: true });
    // Both cache keys are independent, so clear them concurrently instead of
    // one after the other.
    await Promise.all([
      clearCacheMemory(`_id=${user.companyData.id}`),
      clearCacheMemory(`company_id=${user.companyData.id}`),
    ]);
  };

  const verifyEmailExists = async () => {
    const email = watch("email");
    const role = watch("role");
    if (!email || String(role) === "") {
      return notify("warning", "Please enter email and select a role before verifying.");
    }

    setVerifying(true);
    try {
      const resp = await devitrakApi.post("/staff/admin-users", { email });
      const adminUsers = resp?.data?.adminUsers;
      if (adminUsers && adminUsers.length > 0) {
        const existing = adminUsers.at(-1);
        setValue("name", existing?.name ?? "");
        setValue("lastName", existing?.lastName ?? "");
        setNeedCreate(false);

        await addEmployeeAndInvite({
          name: existing?.name ?? "Staff",
          lastName: existing?.lastName ?? "Member",
          email,
          role,
        });

        notify("success", `An invitation to ${existing?.name ?? ""} ${existing?.lastName ?? ""} is queued and will be sent shortly.`);
        setModalState(false);
      } else {
        setNeedCreate(true);
        messageApi.open({
          type: "info",
          content: "Email does not exist in the system. Please provide name, last name, and phone number.",
        });
      }
    } catch {
      notify("error", "Failed to verify email. Please try later.");
    } finally {
      setVerifying(false);
    }
  };

  const onSubmitRegister = async (data) => {
    try {
      setLoadingStatus(true);
      if (needCreate) {
        await devitrakApi.post("/db_staff/new_member", {
          first_name: data.name,
          last_name: data.lastName,
          email: data.email,
          phone_number: data.phoneNumber,
        });

        await addEmployeeAndInvite({
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
        });

        notify("success", `An invitation to ${data.name} ${data.lastName} is queued and will be sent shortly.`);
        setTimeout(() => setModalState(false), 1500);
      } else {
        await verifyEmailExists();
      }
    } catch {
      notify("error", "Please try later. If error persists, please contact administrator.");
    } finally {
      setLoadingStatus(false);
    }
  };

  const bodyModal = () => (
    <form onSubmit={handleSubmit(onSubmitRegister)} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
      <div style={fieldWrapper}>
        <Label>Email</Label>
        <Input
          {...register("email", { required: true })}
          placeholder="Enter staff email"
          error={!!errors.email}
          helperText={errors.email?.message}
        />
      </div>

      {needCreate && (
        <>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={fieldWrapper}>
              <Label>Name</Label>
              <Input
                {...register("name")}
                placeholder="Enter name"
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </div>
            <div style={fieldWrapper}>
              <Label>Last name</Label>
              <Input
                {...register("lastName")}
                placeholder="Enter last name"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </div>
          </div>

          <div style={fieldWrapper}>
            <Label>Phone number</Label>
            <Input
              {...register("phoneNumber")}
              placeholder="Enter phone number"
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message}
            />
          </div>
        </>
      )}

      <div style={fieldWrapper}>
        <Label>Role</Label>
        <Select {...register("role")} displayEmpty fullWidth style={AntSelectorStyle}>
          {roleOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {errors?.role?.message && <span style={errorCaption}>{errors.role.message}</span>}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          paddingTop: "16px",
          borderTop: "1px solid var(--gray-200, #EAECF0)",
        }}
      >
        <GrayButtonComponent
          title="Cancel"
          func={() => setModalState(false)}
          buttonType="reset"
          styles={{ width: "100%" }}
          disabled={loadingStatus || verifying}
        />
        {needCreate ? (
          <BlueButtonComponent
            title="Save"
            buttonType="submit"
            styles={{ width: "100%" }}
            isDisabled={loadingStatus || verifying}
            isLoading={loadingStatus}
          />
        ) : (
          <GrayButtonComponent
            title={verifying ? "Verifying..." : "Verify email"}
            func={verifyEmailExists}
            buttonType="button"
            styles={{ width: "100%" }}
            disabled={verifying || loadingStatus}
          />
        )}
      </div>
    </form>
  );

  return (
    <>
      {contextHolder}
      <ModalUX
        title={<p style={titleStyle}>New staff</p>}
        openDialog={modalState}
        closeModal={() => setModalState(false)}
        width={480}
        footer={null}
        body={bodyModal()}
      />
    </>
  );
};
