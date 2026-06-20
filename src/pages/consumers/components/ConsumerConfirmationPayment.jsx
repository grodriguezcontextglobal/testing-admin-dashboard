import { Grid } from "@mui/material";
import { Result } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import CustomerHeader from "./UI/header";

const ConsumerConfirmationPayment = () => {
  const { customer } = useSelector((state) => state.customer);
  const navigate = useNavigate();
  const payment_intent = new URLSearchParams(window.location.search).get(
    "payment_intent"
  );
  const handleBackAction = () => {
    navigate(`/consumers/${customer.id}`);
  };


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
                  <BlueButtonComponent
                    text="Return to consumer page"
                    func={() => handleBackAction()}
                    key="return_consumer"
                  />
                </div>,
              ]}
            />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ConsumerConfirmationPayment;
