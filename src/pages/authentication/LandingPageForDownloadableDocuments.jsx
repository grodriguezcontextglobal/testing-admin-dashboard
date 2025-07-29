import { FormLabel, Grid, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { Footer } from "antd/es/layout/layout";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import "./style/authStyle.css";

const LandingPageForDownloadableDocuments = () => {
  const location = useLocation();
  const [loadingStatus, setLoadingStatus] = useState(false);
  const {
    register,
    handleSubmit,
  } = useForm();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [url, setUrl] = useState(null);
  console.log(url);
  const openNotificationWithIcon = useCallback(
    (type, message, description) => {
      api.open({
        message: message,
        description: description,
      });
    },
    [api]
  );
  const downloadDocument = async (x) => {
    console.log(x);
    try {
      const response = await devitrakApi.post(
        `/document/download/documentUrl`,
        {
          documentUrl: x,
        }
      );
      console.log("downloadDocument", response.data);
      return setUrl(response.data.downloadUrl);
    } catch (error) {
      throw new Error(error);
    }
  };

  useEffect(() => {
    downloadDocument(location.search.split("?")[1]);
  }, []);

  const adminStaffQuery = useQuery({
    queryKey: ["staffMember"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
  });

  if (adminStaffQuery.isLoading) return <Typography>Loading...</Typography>;
  if (adminStaffQuery.data) {
    const submitNewPassword = async (data) => {
      console.log(data);
      setLoadingStatus(true);
      setLoadingStatus(true);
      openNotificationWithIcon(
        "success",
        "Password updated.",
        "Please log in with your new password. You will be redirected to login page in a moment."
      );
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    };
    return (
      <>
        {contextHolder}
        <Grid
          style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }}
          container
        >
          <Grid item xs={12} sm={12} md={6} lg={6}>
            <Grid
              container
              display={"flex"}
              flexDirection={"column"}
              justifyContent={"space-around"}
              alignItems={"center"}
            >
              <Grid marginX={0} className="register-container" container>
                <Grid
                  item
                  xs={12}
                  display={"flex"}
                  flexDirection={"column"}
                  justifyContent={"space-around"}
                  alignItems={"center"}
                >
                  <Typography
                    style={{
                      color: "var(--gray900, #101828)",
                      fontSize: "30px",
                      fontFamily: "Inter",
                      fontWeight: "600",
                      lineHeight: "38px",
                      marginBottom: "1rem",
                    }}
                    variant="h1"
                  >
                    Welcome to devitrak App
                  </Typography>
                  <Typography
                    style={{
                      color: "var(--gray-500, #667085)",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      lineHeight: "24px",
                    }}
                    variant="subtitle1"
                  >
                    Please enter your full name as signature and date.
                  </Typography>
                </Grid>
                <form
                  className="register-form-container"
                  onSubmit={handleSubmit(submitNewPassword)}
                >
                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    item
                    xs={12}
                    sm={12}
                    md
                  >
                    <iframe src={url} width="100%" height="400"></iframe>
                  </Grid>
                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    item
                    xs={12}
                  >
                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                      Full name
                    </FormLabel>
                    <OutlinedInput
                      {...register("fullName")}
                      style={OutlinedInputStyle}
                      placeholder="e.g. John Doe"
                      type="text"
                      fullWidth
                    />
                  </Grid>
                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    item
                    xs={12}
                  >
                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                      Date
                    </FormLabel>
                    <OutlinedInput
                      {...register("date")}
                      style={OutlinedInputStyle}
                      placeholder="e.g. John Doe"
                      type="text"
                      value={new Date().toISOString()}
                      fullWidth
                      readOnly
                    />
                  </Grid>

                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    display={"flex"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    item
                    xs={12}
                    style={{
                      position: "sticky",
                      bottom: "0px",
                      opacity: "1",
                    }}
                  >
                    <BlueButtonComponent
                      buttonType="submit"
                      title={"Submit"}
                      loadingState={loadingStatus}
                    />
                  </Grid>
                </form>
              </Grid>
            </Grid>
            <Footer
              style={{
                height: "5dvh",
                padding: "2rem",
                backgroundColor: "var(--basewhite)",
              }}
            >
              <Grid
                item
                xs={2}
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
              >
                <Typography
                  style={{
                    fontSize: "14px",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                  }}
                >
                  @ devitrak {new Date().getFullYear()}
                </Typography>
              </Grid>
            </Footer>
          </Grid>
          <Grid id="section-img-login-component" item md={6} lg={6}></Grid>
        </Grid>
      </>
    );
  }
};

export default LandingPageForDownloadableDocuments;
