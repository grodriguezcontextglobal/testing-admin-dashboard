import {
  Typography,
  Grid,
  FormControl,
  FormLabel,
  OutlinedInput,
  Button,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Modal, notification } from "antd";
import { useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

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
        company: user.company,
      }),
    // enabled: false,
    refetchOnMount: false,
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
      "email"
    );

    return groupByEmail[watch("email")];
  }, [listAdminUsers?.data?.data?.adminUsers, watch("email"), _]); //eslint-disable-line react-hooks/exhaustive-deps

  adminUserInfoRef.current = findStaff();

  const handleSubmitEmailLink = async (data) => {
    if (adminUserInfoRef.current) {
      const stampTime = `${new Date()}`;
      const resp = await devitrakApi.post("/nodemailer/reset-admin-password", {
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
      });
      if (resp.data.ok) {
        openNotificationWithIcon("success", "Email was sent to email address.");
        handleClose();
      }
    } else {
      openNotificationWithIcon("error", "Email was not found!");
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
  return (
    <>
      {contextHolder}
      <Modal
        title={renderTitle()}
        width={1000}
        open={true}
        onOk={() => handleClose()}
        onCancel={() => handleClose()}
        footer={[]}
        centered
        maskClosable={false}
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
          <Grid container>
            <form
              style={{
                width: "100%",
              }}
              onSubmit={handleSubmit(handleSubmitEmailLink)}
            >
              <Grid
                display={"flex"}
                flexDirection={"column"}
                alignItems={"center"}
                alignSelf={"stretch"}
                marginY={2}
                marginX={"auto"}
                paddingX={"9px"}
                item
                xs={10}
              >
                <FormControl fullWidth>
                  <FormLabel>
                    {" "}
                    <Typography
                      style={{
                        ...Subtitle,
                        textAlign: "left",
                        paddingBottom: "5px",
                      }}
                    >
                      Email
                    </Typography>
                  </FormLabel>
                  <OutlinedInput
                    {...register("email")}
                    required
                    type="email"
                    style={OutlinedInputStyle}
                    placeholder="Enter your email"
                  />
                </FormControl>
              </Grid>
              <Grid marginX={"auto"} paddingX={"9px"} marginY={3} item xs={10}>
                <Button
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid var(--blue-dark-600, #155EEF)",
                    background: "var(--blue-dark-600, #155EEF)",
                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                  }}
                  variant="contained"
                  type="submit"
                >
                  <Typography
                    style={{
                      color: "var(--base-white, #FFF)",
                      textAlign: "center",
                      fontFamily: "Inter",
                      fontSize: "16px",
                      fontWeight: "600",
                      lineHeight: "24px",
                    }}
                    id="transition-modal-title"
                  >
                    Reset password
                  </Typography>
                </Button>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Modal>
    </>
  );
};

export default ForgetPasswordLinkFromStaffPage;

ForgetPasswordLinkFromStaffPage.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.bool,
};
