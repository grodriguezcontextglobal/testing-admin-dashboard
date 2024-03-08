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
import PaymentMethodDetails from "./component/PaymentMethodDetails";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";

const Body = () => {
  const [billingEmailOption, setBillingEmailOption] = useState(null);
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      billingEmail: user.email,
    },
  });

  const handleUpdatePersonalInfo = async (data) => {};

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
            color: "#344054",
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
            color: "var(--gray-600, #475467)",
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
                Contact email
              </Typography>
            </InputLabel>
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--gray-600, #475467)",
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="ic:outline-email" />
                        </InputAdornment>
                      ),
                    }}
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
            <PaymentMethodDetails />
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
                  color: "#344054",
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
                  color: "var(--gray-600, #475467)",
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
                border: "1px solid var(--gray-300, #D0D5DD)",
                background: "var(--base-white, #FFF)",

                /* Shadow/xs */
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
              }}
            >
              <Typography
                textTransform={"none"}
                style={{
                  color: "#344054",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                {" "}
                <Icon
                  icon="tabler:cloud-upload"
                  color="#475467"
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
            style={{
              width: "fit-content",
              border: "1px solid var(--gray-300, #D0D5DD)",
              borderRadius: "8px",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
          >
            <Typography
              textTransform={"none"}
              style={{
                color: "#344054",
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
              border: "1px solid var(--blue-dark-600, #155EEF)",
              borderRadius: "8px",
              background: "var(--blue-dark-600, #155EEF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05",
            }}
          >
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--base-white, #FFF",
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
