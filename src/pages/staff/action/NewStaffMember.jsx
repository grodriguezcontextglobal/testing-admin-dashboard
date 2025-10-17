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
import dicRole from "../../../components/general/dicRole";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import "../detail/components/equipment_components/assingmentComponents/style.css";

export const NewStaffMember = ({ modalState, setModalState }) => {
  const roles = [0, 1, 2, 3, 4];

  // Switch to conditional validation: only require name/last/phone if creating new staff
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

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [needCreate, setNeedCreate] = useState(false);
  // const [existingAdminUser, setExistingAdminUser] = useState(null);
  const { user } = useSelector((state) => state.admin);
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema, { context: { needCreate } }),
  });
  function closeModal() {
    setModalState(false);
  }
  const queryClient = useQueryClient();

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

  // Add: helper to update company employees and send invitation
  const addEmployeeAndInvite = async ({ name, lastName, email, role }) => {
    const companyInfo = companiesQuery?.data?.data?.company?.[0];
    if (!companyInfo?.id) {
      warning("error", "Company info not loaded. Please try again.");
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
          role,
        },
      ],
    });

    await devitrakApi.post("/nodemailer/new_invitation", {
      consumer: email,
      subject: "Invitation",
      company: user.company,
      link: `https://admin.devitrak.net/invitation?first=${encodeURIComponent(
        name
      )}&last=${encodeURIComponent(lastName)}&email=${encodeURIComponent(
        email
      )}&question=${encodeURIComponent(
        "company name"
      )}&answer=${encodeURIComponent(user.company)}&role=${encodeURIComponent(
        role
      )}&company=${encodeURIComponent(user.companyData.id)}`,
    });

    queryClient.invalidateQueries({
      queryKey: ["listAdminUsers"],
      exact: true,
    });
    queryClient.invalidateQueries({ queryKey: ["staff"], exact: true });
    queryClient.invalidateQueries({
      queryKey: ["employeesPerCompanyList"],
      exact: true,
    });
    await clearCacheMemory(`_id=${user.companyData.id}`);
    await clearCacheMemory(`company_id=${user.companyData.id}`);
  };

  // Add: step 1 - verify email existence
  const verifyEmailExists = async () => {
    const email = watch("email");
    const role = watch("role");
    if (email.length === 0 || String(role) === "") {
      console.log({ email, role });
      return warning(
        "warning",
        "Please enter email and select a role before verifying."
      );
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

        warning(
          "success",
          `An invitation was sent to ${existing?.name ?? ""} ${
            existing?.lastName ?? ""
          }!`
        );
        setModalState(false);
      } else {
        setNeedCreate(true);
        messageApi.open({
          type: "info",
          content:
            "Email does not exist in the system. Please provide name, last name, and phone number.",
        });
      }
    } catch (error) {
      warning("error", "Failed to verify email. Please try later.");
    } finally {
      setVerifying(false);
    }
  };

  // Updated: submit handler only creates staff (step 3) when needed
  const onSubmitRegister = async (data) => {
    try {
      setLoadingStatus(true);
      const role = data.role;

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
          role,
        });

        warning(
          "success",
          `An invitation was sent to ${data.name} ${data.lastName}!`
        );
        await setTimeout(() => closeModal(), 1500);
      } else {
        await verifyEmailExists();
      }
    } catch (error) {
      warning(
        "error",
        "Please try later. If error persists, please contact administrator."
      );
    } finally {
      setLoadingStatus(false);
    }
  };

  const [messageApi, contextHolder] = message.useMessage();
  const warning = (type, content) => {
    messageApi.open({
      type,
      content,
      onClose: () => setValue("email", ""),
    });
  };
  useEffect(() => {
    const controller = new AbortController();
    allStaffSavedQuery.refetch();
    companiesQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [user.company]);

  if (allStaffSavedQuery.data) {
    // const onSubmitRegister = async (data) => {
    //   try {
    //     setLoadingStatus(true);
    //     const templateNewUser = {
    //       name: data.name,
    //       lastName: data.lastName,
    //       email: data.email,
    //       question: "company name",
    //       answer: user.company,
    //       role: data.role,
    //       company: user.companyData.id,
    //     };
    //     await devitrakApi.patch(
    //       `/company/update-company/${companiesQuery.data.data.company[0].id}`,
    //       {
    //         employees: [
    //           ...companiesQuery.data.data.company[0].employees,
    //           {
    //             user: templateNewUser.email,
    //             firstName: templateNewUser.name,
    //             lastName: templateNewUser.lastName,
    //             status: "Pending",
    //             super_user: false,
    //             role: templateNewUser.role,
    //           },
    //         ],
    //       }
    //     );

    //     await devitrakApi.post("/nodemailer/new_invitation", {
    //       consumer: templateNewUser.email,
    //       subject: "Invitation",
    //       company: user.company,
    //       link: `https://admin.devitrak.net/invitation?first=${templateNewUser.name}&last=${templateNewUser.lastName}&email=${templateNewUser.email}&question=${templateNewUser.question}&answer=${templateNewUser.answer}&role=${templateNewUser.role}&company=${templateNewUser.company}`,
    //     });
    //     queryClient.invalidateQueries({
    //       queryKey: ["listAdminUsers"],
    //       exact: true,
    //     });
    //     queryClient.invalidateQueries({ queryKey: ["staff"], exact: true });
    //     queryClient.invalidateQueries({
    //       queryKey: ["employeesPerCompanyList"],
    //       exact: true,
    //     });
    //     await clearCacheMemory(`_id=${user.companyData.id}`);
    //     await clearCacheMemory(`company_id=${user.companyData.id}`);

    //     warning(
    //       "success",
    //       `An invitation was sent to ${data.name} ${data.lastName}!`
    //     );
    //     await setTimeout(() => {
    //       return closeModal();
    //     }, 3500);
    //   } catch (error) {
    //     warning(
    //       "error",
    //       "Please try later. If error persists, please contact administrator."
    //     );
    //     setLoadingStatus(false);
    //   }
    // };

    const bodyModal = () => {
      return (
        <form
          onSubmit={handleSubmit(onSubmitRegister)}
          style={{ width: "100%" }}
        >
          <Grid marginY={"20px"} marginX={0} textAlign={"center"} item xs={12}>
            <InputLabel
              style={{
                marginTop: "0.5rem",
                marginBottom: "0px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                gap: "10px",
              }}
            >
              <span>Email</span>
            </InputLabel>
            <OutlinedInput
              {...register("email", { required: true })}
              style={OutlinedInputStyle}
              placeholder="Enter staff email"
              type="text"
              fullWidth
            />
            {errors?.email?.message}
          </Grid>

          {/* Show name/last/phone only when we need to create new staff */}
          {needCreate && (
            <>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"center"}
                item
                xs={12}
              >
                <InputLabel
                  style={{
                    marginTop: "0.5rem",
                    marginBottom: "0px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    textAlign: "left",
                  }}
                >
                  Name
                </InputLabel>
                <OutlinedInput
                  type="text"
                  {...register("name")}
                  aria-invalid={errors.name ? true : false}
                  style={OutlinedInputStyle}
                  placeholder="Enter name"
                  fullWidth
                />
                {errors?.name?.message}
              </Grid>

              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"center"}
                item
                xs={12}
              >
                <InputLabel
                  style={{
                    marginTop: "0.5rem",
                    marginBottom: "0px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    textAlign: "left",
                  }}
                >
                  Last name
                </InputLabel>
                <OutlinedInput
                  type="text"
                  {...register("lastName")}
                  aria-invalid={errors.lastName ? true : false}
                  style={OutlinedInputStyle}
                  placeholder="Enter last name"
                  fullWidth
                />
                {errors?.lastName?.message}
              </Grid>

              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"center"}
                item
                xs={12}
              >
                <InputLabel
                  style={{
                    marginTop: "0.5rem",
                    marginBottom: "0px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    textAlign: "left",
                  }}
                >
                  Phone number
                </InputLabel>
                <OutlinedInput
                  type="text"
                  {...register("phoneNumber")}
                  aria-invalid={errors.phoneNumber ? true : false}
                  style={OutlinedInputStyle}
                  placeholder="Enter phone number"
                  fullWidth
                />
                {errors?.phoneNumber?.message}
              </Grid>
            </>
          )}

          <Grid marginY={"20px"} marginX={0} textAlign={"center"} item xs={12}>
            <InputLabel
              style={{
                marginTop: "0.5rem",
                marginBottom: "0px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                textAlign: "left",
              }}
            >
              Role
            </InputLabel>
            <Grid
              item
              xs={12}
              display={"flex"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Select
                {...register("role")}
                displayEmpty
                fullWidth
                style={AntSelectorStyle}
              >
                {roles.map((company) => {
                  return (
                    <MenuItem key={company} value={company}>
                      {dicRole[company]}
                    </MenuItem>
                  );
                })}
              </Select>
            </Grid>
            {errors?.role?.message}
          </Grid>

          <Grid
            marginY={"20px"}
            marginX={0}
            textAlign={"center"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            gap={1}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <GrayButtonComponent
              title={"Cancel"}
              func={() => setModalState(false)}
              buttonType="reset"
              styles={{ width: "100%" }}
              disabled={loadingStatus || verifying}
            />
            {needCreate ? (
              <BlueButtonComponent
                title={needCreate ? "Save" : "Verify & Invite"}
                // func={() => handleSubmit(onSubmitRegister)()}
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
    };

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
  }
};
