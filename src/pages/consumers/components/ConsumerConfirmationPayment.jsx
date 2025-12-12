import { Grid, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, notification, Result } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Loading from "../../../components/animation/Loading";
import { BlueButton } from "../../../styles/global/BlueButton";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { useEffect, useState } from "react";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CustomerHeader from "./UI/header";

const ConsumerConfirmationPayment = () => {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { customer } = useSelector((state) => state.customer);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const payment_intent = new URLSearchParams(window.location.search).get(
    "payment_intent"
  );
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (mess, descript) => {
    api.open({
      message: mess,
      description: descript,
      duration: 0,
    });
  };

  const handleBackAction = () => {
    navigate(`/consumers/${customer.id}`);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoadingStatus(false);
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
      {contextHolder}
      <Grid
        marginY={3}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <CustomerHeader />
        <Grid
          border={"1px solid var(--gray-200, #eaecf0)"}
          borderRadius={"12px 12px 0 0"}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          marginBottom={-2}
          paddingBottom={-2}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          {loadingStatus ? (
            <div style={CenteringGrid}>
              {" "}
              <Loading />{" "}
            </div>
          ) : (
            <Result
              status="success"
              title="Successfully transaction!"
              subTitle={`Order number: ${payment_intent} Now you can click in return button to return to consumer page.`}
              extra={[
                <div
                  key={"payment_confirmed_buttons"}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <Button
                    style={{ ...BlueButton, width: "100%" }}
                    onClick={() => handleBackAction()}
                    key="consumer"
                  >
                    <Typography textTransform={"none"} style={BlueButtonText}>
                      Return to consumer page
                    </Typography>
                  </Button>
                </div>,
              ]}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ConsumerConfirmationPayment;
