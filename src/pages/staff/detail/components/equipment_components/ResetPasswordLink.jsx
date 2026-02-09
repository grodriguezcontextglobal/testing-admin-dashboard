import { yupResolver } from "@hookform/resolvers/yup";
import { FormControl, FormLabel, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import ReusableCardWithHeaderAndFooter from "../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import Input from "../../../../../components/UX/inputs/Input";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { Subtitle } from "../../../../../styles/global/Subtitle";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
});

const ForgetPasswordLinkFromStaffPage = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const adminUserInfoRef = useRef(null);
  const { register, watch, setValue, handleSubmit } = useForm({
    resolver: yupResolver(schema),
  });
  const listAdminUsers = useQuery({
    queryKey: ["listOfAdminUsers"],
    queryFn: () =>
      devitrakApi.post("/staff/admin-users", {
        company: user.companyData.companyName,
      }),
    enabled: !!user.companyData.companyName,
  });

  useEffect(() => {
    const controller = new AbortController();
    listAdminUsers.refetch();
    setValue("email", `${profile.email}`);
    return () => {
      controller.abort();
    };
  }, []);

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };

  const navigate = useNavigate();
  const findStaff = useCallback(() => {
    const groupByEmail = groupBy(
      listAdminUsers?.data?.data?.adminUsers,
      "email",
    );

    return groupByEmail[watch("email")];
  }, [listAdminUsers?.data?.data?.adminUsers, watch("email")]); //eslint-disable-line react-hooks/exhaustive-deps

  adminUserInfoRef.current = findStaff();

  const sendingResetPasswordLink = useMutation({
    mutationFn: (data) =>
      devitrakApi.post("/nodemailer/reset-admin-password", data),
    onSuccess: (resp) => {
      if (resp.data.ok) {
        openNotificationWithIcon("Success", "Email was sent to email address.");
        handleClose();
      }
    },
    onError: (error) => {
      console.log(error);
      openNotificationWithIcon("error", error.message);
    },
  });
  const handleSubmitEmailLink = async (data) => {
    console.log(data)
    console.log(adminUserInfoRef.current)
    if (adminUserInfoRef.current) {
      const stampTime = `${new Date()}`;
      sendingResetPasswordLink.mutateAsync({
        adminUser: {
          firstName: adminUserInfoRef.current.at(-1).name,
          lastName: adminUserInfoRef.current.at(-1).lastName,
        },
        linkToResetPassword: `https://admin.devitrak.net/reset-password?uid=${
          adminUserInfoRef.current.at(-1).id
        }&stamp-time=${encodeURI(stampTime)}`,
        contactInfo: {
          email: data.email,
          company: adminUserInfoRef.current.at(-1).company,
        },
        company_logo: user.companyData.company_logo,
      });
    }
  };
  const handleClose = () => {
    setValue("email", "");
    return navigate(`/staff/${profile.adminUserInfo.id}/main`);
  };
  const renderTitle = () => {
    return (
      <Typography
        style={{
          color: "var(--gray900, #101828)",
          textAlign: "center",
          fontFamily: "Inter",
          fontSize: "18px",
          fontWeight: "600",
          lineHeight: "28px",
        }}
        id="transition-modal-title"
        variant="h6"
        component="h2"
      >
        Reset your password
      </Typography>
    );
  };

  const modalBody = () => {
    return (
      <ReusableCardWithHeaderAndFooter
        title="Reset Password"
        actions={[
          <div
            key="reset-password"
            style={{ width: "100%", padding: "0 24px" }}
          >
            <BlueButtonComponent
              title="Reset password"
              buttonType="submit"
              form="form-reset-password-link"
            />
          </div>,
        ]}
      >
        {" "}
        <form
          style={{
            width: "100%",
          }}
          onSubmit={handleSubmit(handleSubmitEmailLink)}
          id="form-reset-password-link"
        >
          <FormControl fullWidth>
            <FormLabel>
              <p style={{ margin: "5px 0", padding: "5px 0", ...Subtitle }}>
                Enter your email to get a link to reset your password.
              </p>
              <Typography
                style={{
                  ...Subtitle,
                  textAlign: "left",
                  margin: "1rem 0 0",
                  paddingBottom: "5px",
                }}
              >
                Email
              </Typography>
            </FormLabel>
            <Input
              {...register("email")}
              required
              type="email"
              placeholder="Enter your email"
            />
          </FormControl>
        </form>
      </ReusableCardWithHeaderAndFooter>
    );
  };
  return (
    <>
      {contextHolder}
      <ModalUX
        title={renderTitle()}
        body={modalBody()}
        openDialog={true}
        closeModal={() => handleClose()}
      />
      {/* <Modal
        title={renderTitle()}
        width={1000}
        open={true}
        onOk={() => handleClose()}
        onCancel={() => handleClose()}
        footer={[]}
        centered
        maskClosable={false}
        style={{ zIndex: 30 }}
      >
        <Grid container>
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            alignSelf={"stretch"}
            margin={"0 auto"}
            item
            xs={10}
          >
            <Typography id="transition-modal-description" sx={{ mt: 2, mb: 2 }}>
              Enter your email to get a link to reset your password.
            </Typography>
          </Grid>
          <Grid container></Grid>
        </Grid>
      </Modal> */}
    </>
  );
};

export default ForgetPasswordLinkFromStaffPage;

ForgetPasswordLinkFromStaffPage.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.bool,
};
