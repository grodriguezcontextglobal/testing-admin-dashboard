import {
  Chip,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Button, Divider, Modal, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import StripeElementServicesTransaction from "../../../../../../../components/stripe/elements/StripeElementServicesTransaction";
import { BlueButton } from "../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import { onAddDevicesSelectionPaidTransactions } from "../../../../../../../store/slices/devicesHandleSlice";

const ServicesTransaction = ({ setExtraServiceNeeded, extraServiceNeeded }) => {
  const { event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.customer);
  const [serviceList, setServiceList] = useState([]);
  const [servicesAddedForCustomer, setServicesAddedForCustomer] = useState([]);
  const [serviceSelected, setServiceSelected] = useState({});
  const [clientSecret, setClientSecret] = useState(null);
  const dispatch = useDispatch();
  const closeModal = () => {
    setExtraServiceNeeded(false);
  };
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    const controller = new AbortController();
    if (event.extraServicesNeeded) {
      setServiceList(event.extraServices);
    }
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setValue("price", serviceSelected.deposit);
  }, [serviceSelected]);
  const renderServiceList = () => {
    const result = new Set();
    for (let data of serviceList) {
      result.add({ label: data.service, value: JSON.stringify(data) });
    }
    return Array.from(result);
  };

  const renderTitle = () => {
    return (
      <Typography
        textTransform={"none"}
        marginY={2}
        style={{ ...TextFontSize30LineHeight38, textWrap: "balance" }}
      >
        Services
      </Typography>
    );
  };

  const handleChange = (value) => {
    const parsed = JSON.parse(value);
    return setServiceSelected(parsed);
  };

  const addingServiceToCharge = async (data) => {
    const result = [
      ...servicesAddedForCustomer,
      {
        service: serviceSelected.service,
        price: data.price,
        quantity: data.quantity,
      },
    ];
    return setServicesAddedForCustomer(result);
  };

  const totalToBeCharged = () => {
    let total = 0;
    for (let data of servicesAddedForCustomer) {
      const amount = data.price * data.quantity;
      total += amount;
    }
    return total;
  };

  const removeServiceFromCharge = (props) => {
    const filter = servicesAddedForCustomer.filter(
      (_, index) => index !== props
    );
    return setServicesAddedForCustomer(filter);
  };
  const refData = useRef(null);
  const submitServicesAddedForCustomerPaymentIntent = async () => {
    refData.current = { amount: Number(totalToBeCharged() * 100) };
    console.log(Number(totalToBeCharged() * 100));
    try {
      const response = await devitrakApi.post(
        "/stripe/create-payment-intent-subscription",
        {
          customerEmail: customer?.email,
          total: Number(totalToBeCharged() * 100),
        }
      );

      if (response) {
        setClientSecret(response.data.paymentSubscription.client_secret);
        const servicesName = new Set();
        for (let data of servicesAddedForCustomer) {
          servicesName.add(data.service);
        }
        dispatch(
          onAddDevicesSelectionPaidTransactions({
            deviceType: {
              group: Array.from(servicesName).toString().replaceAll(",", " | "),
              value: Number(totalToBeCharged()),
            },
          }) //pass data serial number from handleSubmit
        );
      }
    } catch (error) {
      console.log(error); //error
    }
  };
  return (
    <Modal
      title={renderTitle()}
      open={extraServiceNeeded}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      centered
      footer={[]}
      width={1000}
      maskClosable={false}
      style={{
        top: "10dvh",
        zIndex:30
      }}
    >
      <div
        style={{
          minWidth: "fit-content",
          backgroundColor: "#ffffff",
          padding: "20px",
        }}
      >
        <Typography
          marginY={2}
          style={{
            ...TextFontsize18LineHeight28,
            width: "80%",
          }}
        >
          Please select service to be charged:
        </Typography>
        <Divider
          style={{
            display: clientSecret !== "" ? "none" : "block",
          }}
        />
        <form
          style={{
            width: "100%",
            display: clientSecret !== null && "none",
          }}
          onSubmit={handleSubmit(addingServiceToCharge)}
        >
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            gap={2}
            container
          >
            <Grid item xs={6} sm={6} md={6} lg={6}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  Service
                </Typography>
              </InputLabel>
              <Select
                defaultValue=""
                style={{
                  width: "100%",
                }}
                onChange={handleChange}
                options={renderServiceList()}
              />{" "}
            </Grid>
            <Grid item xs={6} sm={6} md={2} lg={2}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  Price
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled={clientSecret !== null}
                {...register("price")}
                style={{
                  ...OutlinedInputStyle,
                  width: "100%",
                }}
                placeholder="Price."
                startAdornment={
                  <InputAdornment position="start">$</InputAdornment>
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={6} md={2} lg={2}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  Quantity
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled={clientSecret !== null}
                {...register("quantity")}
                style={{
                  ...OutlinedInputStyle,
                  width: "100%",
                }}
                placeholder="Enter quantity."
                fullWidth
              />
            </Grid>
          </Grid>
          <Button htmlType="submit" style={LightBlueButton}>
            <p style={LightBlueButtonText}>Adding service</p>
          </Button>
        </form>
        <Divider />
        {servicesAddedForCustomer?.length > 0 &&
          servicesAddedForCustomer.map((item, index) => {
            return (
              <Chip
                key={`${item.service}-${item.price}-${item.quantity}`}
                label={`${item.service} - ($${item.price} p/u) - Qty:${item.quantity}`}
                style={{ margin: "0.5rem" }}
                onDelete={() => removeServiceFromCharge(index)}
              />
            );
          })}
        <Divider
          style={{
            display: servicesAddedForCustomer?.length > 0 ? "block" : "none",
          }}
        />
        {
          totalToBeCharged() > 0 &&
          clientSecret == null && (
            <Button
              onClick={() => submitServicesAddedForCustomerPaymentIntent()}
              style={{
                ...BlueButton,
                ...CenteringGrid,
                display: clientSecret !== null ? "none" : "flex",
                width: "100%",
              }}
            >
              <p style={{ ...BlueButtonText, textAlign: "left" }}>
                Total to be charged: ${totalToBeCharged()} | Click to submit CC
                information
              </p>
            </Button>
          )
        }
        {clientSecret !== "" && (
          <StripeElementServicesTransaction
            clientSecret={clientSecret}
            total={refData.current?.amount}
          />
        )}
      </div>
    </Modal>
  );
};

export default ServicesTransaction;
