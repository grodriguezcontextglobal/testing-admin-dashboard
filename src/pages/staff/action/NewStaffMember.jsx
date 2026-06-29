/* eslint-disable react/prop-types */
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import * as yup from "yup";
import { devitrakApi } from "../../../api/devitrakApi";
import { LEGACY_ROLE_MAP, ROLE_LABELS, ROLE_LEVELS, resolveRoleType } from "../../../config/roles";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import "../detail/components/equipment_components/assingmentComponents/style.css";

const labelStyle = {
  marginTop: "0.5rem",
  marginBottom: "0px",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  textAlign: "left",
};

const errorStyle = {
  fontSize: "12px",
  fontFamily: "Inter",
  color: "var(--error-500, #F04438)",
  marginTop: "4px",
  display: "block",
};

const ALL_ROLE_OPTIONS = [
  { label: ROLE_LABELS.root_admin,        value: 0 },
  { label: ROLE_LABELS.admin,             value: 1 },
  { label: ROLE_LABELS.sale_manager,      value: 2 },
  { label: ROLE_LABELS.event_manager,     value: 3 },
  { label: ROLE_LABELS.inventory_manager, value: 4 },
  { label: ROLE_LABELS.assistant,         value: 5 },
];

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
  role: yup.number().required("Role is required"),
  name: yup.string().when("$needCreate", {
    is: true,
    then: (s) => s.required("Name is required"),
    otherwise: (s) => s.optional(),
  }),
  lastName: yup.string().when("$needCreate", {
    is: true,
    then: (s) => s.required("Last name is required"),
    otherwise: (s) => s.optional(),
  }),
  phoneNumber: yup.string().when("$needCreate", {
    is: true,
    then: (s) => s.required("Phone number is required"),
    otherwise: (s) => s.optional(),
  }),
});

export const NewStaffMember = ({ modalState, setModalState }) => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [needCreate, setNeedCreate] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const userLevel = ROLE_LEVELS[resolveRoleType(user)] ?? 99;
  const roleOptions = userLevel === 0
    ? ALL_ROLE_OPTIONS
    : ALL_ROLE_OPTIONS.filter((o) => o.value > userLevel);

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema, { context: { needCreate } }),
  });

  const allStaffSavedQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
    refetchOnMount: false,
  });

  const companiesQuery = useQuery({
    queryKey: ["companyListQuery"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    allStaffSavedQuery.refetch();
    companiesQuery.refetch();
    return () => controller.abort();
  }, [user.company]); // eslint-disable-next-line react-hooks/exhaustive-deps

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
        {
          user: email,
          firstName: name,
          lastName: lastName,
          status: "Pending",
          super_user: false,
          role: String(role),
          roleType: LEGACY_ROLE_MAP[Number(role)] ?? "assistant",
          active: true,
        },
      ],
    });

    const roleType = LEGACY_ROLE_MAP[Number(role)] ?? "assistant";
    await devitrakApi.post("/nodemailer/new_invitation", {
      consumer: email,
      subject: "Invitation",
      company: user.company,
      link: `https://admin.devitrak.net/invitation?first=${encodeURIComponent(name)}&last=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&question=${encodeURIComponent("company name")}&answer=${encodeURIComponent(user.company)}&role=${encodeURIComponent(role)}&roleType=${encodeURIComponent(roleType)}&company=${encodeURIComponent(user.companyData.id)}`,
    });

    queryClient.invalidateQueries({ queryKey: ["listAdminUsers"], exact: true });
    queryClient.invalidateQueries({ queryKey: ["staff"], exact: true });
    queryClient.invalidateQueries({ queryKey: ["employeesPerCompanyList"], exact: true });
    await clearCacheMemory(`_id=${user.companyData.id}`);
    await clearCacheMemory(`company_id=${user.companyData.id}`);
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

        notify("success", `An invitation was sent to ${existing?.name ?? ""} ${existing?.lastName ?? ""}!`);
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

        notify("success", `An invitation was sent to ${data.name} ${data.lastName}!`);
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

  if (!allStaffSavedQuery.data) return null;

  const bodyModal = () => (
    <form onSubmit={handleSubmit(onSubmitRegister)} style={{ width: "100%" }}>
      <Grid marginY={"20px"} marginX={0} item xs={12}>
        <InputLabel style={labelStyle}>Email</InputLabel>
        <OutlinedInput
          {...register("email", { required: true })}
          style={OutlinedInputStyle}
          placeholder="Enter staff email"
          type="text"
          fullWidth
        />
        {errors?.email?.message && (
          <span style={errorStyle}>{errors.email.message}</span>
        )}
      </Grid>

      {needCreate && (
        <>
          <Grid marginY={"20px"} marginX={0} item xs={12}>
            <InputLabel style={labelStyle}>Name</InputLabel>
            <OutlinedInput
              type="text"
              {...register("name")}
              aria-invalid={!!errors.name}
              style={OutlinedInputStyle}
              placeholder="Enter name"
              fullWidth
            />
            {errors?.name?.message && (
              <span style={errorStyle}>{errors.name.message}</span>
            )}
          </Grid>

          <Grid marginY={"20px"} marginX={0} item xs={12}>
            <InputLabel style={labelStyle}>Last name</InputLabel>
            <OutlinedInput
              type="text"
              {...register("lastName")}
              aria-invalid={!!errors.lastName}
              style={OutlinedInputStyle}
              placeholder="Enter last name"
              fullWidth
            />
            {errors?.lastName?.message && (
              <span style={errorStyle}>{errors.lastName.message}</span>
            )}
          </Grid>

          <Grid marginY={"20px"} marginX={0} item xs={12}>
            <InputLabel style={labelStyle}>Phone number</InputLabel>
            <OutlinedInput
              type="text"
              {...register("phoneNumber")}
              aria-invalid={!!errors.phoneNumber}
              style={OutlinedInputStyle}
              placeholder="Enter phone number"
              fullWidth
            />
            {errors?.phoneNumber?.message && (
              <span style={errorStyle}>{errors.phoneNumber.message}</span>
            )}
          </Grid>
        </>
      )}

      <Grid marginY={"20px"} marginX={0} item xs={12}>
        <InputLabel style={labelStyle}>Role</InputLabel>
        <Select
          {...register("role")}
          displayEmpty
          fullWidth
          style={AntSelectorStyle}
        >
          {roleOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {errors?.role?.message && (
          <span style={errorStyle}>{errors.role.message}</span>
        )}
      </Grid>

      <Grid
        marginY={"20px"}
        marginX={0}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        gap={1}
        item
        xs={12}
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
            disabled={loadingStatus || verifying}
          />
        ) : (
          <GrayButtonComponent
            title={verifying ? "Verifying..." : "Verify Email"}
            func={verifyEmailExists}
            buttonType="button"
            styles={{ width: "100%" }}
            disabled={verifying || loadingStatus}
          />
        )}
      </Grid>
    </form>
  );

  return (
    <>
      {contextHolder}
      <ModalUX
        title={<p style={TextFontSize30LineHeight38}>New staff</p>}
        openDialog={modalState}
        closeModal={() => setModalState(false)}
        body={bodyModal()}
      />
    </>
  );
};
