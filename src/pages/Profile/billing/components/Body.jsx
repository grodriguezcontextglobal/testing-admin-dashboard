import { Icon } from "@iconify/react";
import {
  Grid,
  Button,
  Typography,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Input,
} from "@mui/material";
import { Divider } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import "./Body.css";
import InvoiceTables from "./component/InvoiceTables";
import PlanSubscriptionDetails from "./component/PlanSubscriptionDetails";
// import PaymentMethodDetails from "./component/PaymentMethodDetails";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { useNavigate } from "react-router-dom";

const Body = () => {
  const [billingEmailOption, setBillingEmailOption] = useState(null);
  const { user } = useSelector((state) => state.admin);
  const { register } = useForm({
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      billingEmail: user.email,
    },
  });
  const navigate = useNavigate();
  // const handleUpdatePersonalInfo = async (data) => {};

  const renderLabel = ({ bodyContent }) => {
    return (
      <Grid
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        item
        xs={12}
        sm={12}
        md={12}
      >
        <Typography
          textTransform={"none"}
          style={{
            color: "var(--gray-700, #484d47)",
            textAlign: "left",
            fontSize: "14px",
            fontWeight: "500",
            fontFamily: "Inter",
            lineHeight: "20px",
            width: "100%",
          }}
        >
          {bodyContent.title}
        </Typography>
        <Typography
          textTransform={"none"}
          style={{
            color: "var(--gray-600, #5d615a)",
            textAlign: "left",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "Inter",
            lineHeight: "20px",
          }}
        >
          {bodyContent.description}
        </Typography>
      </Grid>
    );
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
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
                color: "var(--gray-700, #484d47)",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "500",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              Contact email
            </Typography>
          </InputLabel>
          <InputLabel style={{ width: "100%" }}>
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--gray-600, #5d615a)",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              Where should invoices be sent?
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
          xs={8}
          sm={8}
          md={8}
        >
          <RadioGroup
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={billingEmailOption}
            onChange={(e) => setBillingEmailOption(e.target.value)}
          >
            <FormControlLabel
              style={{
                width: "100%",
                margin: "0.5dvh auto",
              }}
              value={`${user.email}`}
              control={<Radio />}
              label={renderLabel({
                bodyContent: {
                  title: "Send to my account email",
                  description: `${user.email}`,
                },
              })}
            />
            <FormControlLabel
              style={{
                width: "100%",
                margin: "0.5dvh auto",
              }}
              value="update-billing-update"
              control={<Radio />}
              label={renderLabel({
                bodyContent: {
                  title: "Send to an alternative email",
                  description: "",
                },
              })}
            />

            {billingEmailOption === "update-billing-update" && (
              <Grid item xs={12}>
                <Input
                  disableUnderline
                  fullWidth
                  style={OutlinedInputStyle}
                  {...register("billingEmail")}
                  startAdornment={
                    <InputAdornment position="start">
                      <Icon icon="ic:outline-email" />
                    </InputAdornment>
                  }
                />
              </Grid>
            )}
          </RadioGroup>
        </Grid>
        <Divider />
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          marginY={0}
          paddingLeft={0}
          id="container-planSubDetails"
          item
          xs={12}
          sm={12}
          md={6}
        >
          <PlanSubscriptionDetails />
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          marginY={0}
          paddingRight={0}
          item
          xs={12}
          sm={12}
          md={6}
        >
          {/* <PaymentMethodDetails /> */}
        </Grid>
        <Divider />
        <Grid
          display={"flex"}
          flexDirection={"column"}
          alignSelf={"stretch"}
          marginY={0}
          item
          xs={6}
          sm={6}
          md={6}
        >
          <InputLabel style={{ width: "100%" }}>
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--gray-700, #484d47)",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "500",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              Invoices
            </Typography>
          </InputLabel>
          <InputLabel style={{ width: "100%" }}>
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--gray-600, #5d615a)",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              View the full history of your invoices.
            </Typography>
          </InputLabel>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          marginY={0}
          gap={2}
          item
          xs={6}
          sm={6}
          md={6}
        >
          <Button
            style={{
              width: "fit-content",
              display: "flex",
              padding: "10px 16px",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              borderRadius: "8px",
              border: "1px solid var(--gray-300, #c6c7bb)",
              background: "var(--base-white, #FFF)",
              boxShadow: "var(--shadow-xs, 0 1px 2px 0 rgba(23, 29, 26, 0.05))",
            }}
          >
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--gray-700, #484d47)",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              {" "}
              <Icon
                icon="tabler:cloud-download"
                color="var(--gray-600, #5d615a)"
                width={20}
                height={20}
              />
              &nbsp;Download all
            </Typography>
          </Button>
        </Grid>
        <Grid
          display={"flex"}
          alignSelf={"stretch"}
          margin={"2vh auto 0"}
          item
          xs={12}
          sm={12}
          md={12}
        >
          <InvoiceTables />
        </Grid>
        {/* </Grid> */}
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
        onClick={()=> navigate('/')}
          style={{
            width: "fit-content",
            border: "1px solid var(--gray-300, #c6c7bb)",
            borderRadius: "8px",
            background: "var(--base-white, #FFF)",
            boxShadow: "var(--shadow-xs, 0 1px 2px 0 rgba(23, 29, 26, 0.05))",
          }}
        >
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--gray-700, #484d47)",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "Inter",
              lineHeight: "20px",
            }}
          >
            Cancel
          </Typography>
        </Button>
        <Button
          type="submit"
          style={{
            width: "fit-content",
            border: "1px solid var(--action-600, #155eef)",
            borderRadius: "8px",
            background: "var(--action-600, #155eef)",
            boxShadow: "var(--shadow-xs, 0 1px 2px 0 rgba(23, 29, 26, 0.05))",
          }}
        >
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--base-white, #fff)",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "Inter",
              lineHeight: "20px",
            }}
          >
            Save
          </Typography>
        </Button>
      </Grid>
    </form>
  );
};

export default Body;
