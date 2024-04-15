import {
  Grid,
  Button,
  Typography,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { Divider, notification } from "antd";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import _ from "lodash"
import "./Body.css";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { compareSync } from "bcryptjs";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
const Body = () => {
  const { user } = useSelector((state) => state.admin);
  const reference = useRef("");
  const {
    register,
    handleSubmit,
  } = useForm();
  // const bcrypt = require("bcryptjs");
  const adminUsersStaffQuery = useQuery({
    queryKey: ["adminUser"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
  });
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };

  if (adminUsersStaffQuery.data) {
    const foundAdminInfo = () => {
      const groupingStaffByCompany = _.groupBy(
        adminUsersStaffQuery?.data?.data?.adminUsers,
        "company"
      );
      const groupingByEmail = _.groupBy(
        groupingStaffByCompany[user.company],
        "email"
      );
      reference.current = groupingByEmail[user.email][0];
      return groupingByEmail[user.email][0];
    };
    foundAdminInfo();
    const handleUpdatePersonalInfo = async (data) => {
      try {
        const isValid = compareSync(
          data.current_password,
          foundAdminInfo().password
        );
        if (!isValid) {
          return openNotificationWithIcon(
            "error",
            "Information does not match in our records."
          );
        }
        if (data.password1 !== data.password2) {
          return openNotificationWithIcon("error", "Passwords must match!");
        }
        if (data.password2.length > 12 || data.password2.length < 6) {
          return openNotificationWithIcon(
            "error",
            "Passwords length must be between 6 digits and 1 digits"
          );
        }
        if (data.password1.length > 12 || data.password1.length < 6) {
          return openNotificationWithIcon(
            "error",
            "Passwords length must be between 6 digits and 1 digits"
          );
        }
        const resp = devitrakApi.patch(`/admin/update-password`, {
          email: foundAdminInfo().email,
          password: data.password1,
        });
        if ((await resp).data) {
          openNotificationWithIcon("success", "Password updated!");
        }
      } catch (error) {
        console.log(
          "🚀 ~ file: Body.jsx:101 ~ handleUpdatePersonalInfo ~ error:",
          error
        );
        openNotificationWithIcon("error", error.message);
      }
    };
    return (
      <>
        {contextHolder}
        <form
          onSubmit={handleSubmit(handleUpdatePersonalInfo)}
          style={{
            width: "100%",
          }}
        >
          <Grid
            style={{
              padding: "5px",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
            container
          >
            {" "}
            <Grid
              display={"flex"}
              flexDirection={"column"}
              alignSelf={"stretch"}
              marginY={0}
              item
              xs={4}
              sm={4}
              md={4}
            >
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  style={{
                    color: "#344054",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "500",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                  }}
                >
                  Current password
                </Typography>
              </InputLabel>
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              marginY={0}
              gap={2}
              item
              xs={6}
              sm={6}
              md={6}
            >
              <OutlinedInput
                style={{ ...OutlinedInputStyle }}
                fullWidth
                {...register("current_password", {
                  required: true,
                  minLength: 6,
                  maxLength: 12,
                })}
                type="password"
                placeholder="Current password"
              />
            </Grid>
            <Divider />
            <Grid
              display={"flex"}
              flexDirection={"column"}
              alignSelf={"stretch"}
              marginY={0}
              item
              xs={4}
              sm={4}
              md={4}
            >
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  style={{
                    color: "#344054",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "500",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                  }}
                >
                  New password
                </Typography>
              </InputLabel>
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              marginY={0}
              gap={2}
              item
              xs={6}
              sm={6}
              md={6}
            >
              <OutlinedInput
                style={{ ...OutlinedInputStyle }}
                fullWidth
                {...register("password1", {
                  required: true,
                })}
                type="password"
                placeholder="Type your new password"
              />
            </Grid>
            <Divider />
            <Grid
              display={"flex"}
              flexDirection={"column"}
              alignSelf={"stretch"}
              marginY={0}
              item
              xs={4}
              sm={4}
              md={4}
            >
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  style={{
                    color: "#344054",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "500",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                  }}
                >
                  Confirm new password
                </Typography>
              </InputLabel>
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              marginY={0}
              gap={2}
              item
              xs={6}
              sm={6}
              md={6}
            >
              <OutlinedInput
                style={{ ...OutlinedInputStyle }}
                fullWidth
                {...register("password2", {
                  required: true,
                })}
                type="password"
                placeholder="Repeat the new password to confirm."
              />
            </Grid>
            <Divider />
          </Grid>{" "}
          <Divider />
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={12}
            sm={12}
            md={12}
          >
            <Button
              style={GrayButton}
            >
              <Typography
                textTransform={"none"}
                style={GrayButtonText}
              >
                Cancel
              </Typography>
            </Button>
            <Button
              type="submit"
              style={BlueButton}
            >
              <Typography
                textTransform={"none"}
                style={BlueButtonText}
              >
                Save
              </Typography>
            </Button>
          </Grid>
        </form>
      </>
    );
  }
};

export default Body;
