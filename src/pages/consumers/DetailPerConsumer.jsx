// import StripeTransactionHistoryByUser from '../Attendees/tables/StripeTransactionHistoryByUser';
import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import CardRendered from "../inventory/utils/CardRendered";
import CardActionsButton from "./components/CardActionsButton";
import ConsumerDetailInformation from "./components/ConsumerDetailInformation";
import ConsumerDetailInfoCntact from "./components/ConsumerDetailinfoContact";
// import TransactionTableRefactoring from "./tables/TransactionTableRefactoring";
import { useEffect, useRef, useState } from "react";
import AssigmentAction from "./components/AssigmentAction";
import NotesRendering from "./components/NotesCard";
import StripeTransactionPerConsumer from "./tables/StripeTransactionPerConsumer";

const DetailPerConsumer = () => {
  const { register, watch, setValue } = useForm();
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const rowRef = useRef();
  const customerInfoTemplate = {
    ...customer,
    id: customer.id ?? customer.uid,
  };

  const transactionsConsumerQuery = useQuery({
    queryKey: ["transactionsPerCustomer", customerInfoTemplate.id],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        company: user.companyData.id,
        "consumerInfo.email": customer.email,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    transactionsConsumerQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [customerInfoTemplate.id, user.companyData.id, user.id]);

  const [eventsAttendedForCustomer, setEventsAttendedForCustomer] = useState(0);
  const renderingNumberOfEventsConsumerAttended = async () => {
    const result = new Map();
    if (transactionsConsumerQuery.data) {
      const dataPerEvent = transactionsConsumerQuery?.data?.data?.list;
      for (let data of dataPerEvent) {
        if (!result.has(data.eventSelected)) {
          result.set(data.eventSelected, data);
        }
      }
    }
    return setEventsAttendedForCustomer(result.size);
  };

  useEffect(() => {
    const controller = new AbortController();
    renderingNumberOfEventsConsumerAttended();
    return () => {
      controller.abort();
    };
  }, [user.id, user.companyData.id, transactionsConsumerQuery.data, customer.email]);

  if (transactionsConsumerQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (transactionsConsumerQuery.data) {
    const handleBackAction = () => {
      navigate("/consumers");
    };
    const substractingNotesAddedForCompany = () => {
      const result = customer?.data?.notes.filter(
        (ele) => ele.company === user.companyData.id
      );
      if (result.length > 0) {
        let final = [];
        final = [...final, ...result.map((item) => item)];
        // (note += item.notes)
        return final;
      }
      return [];
    };
    const renderingTransactions = () => {
      if (transactionsConsumerQuery.data) {
        const dataPerEvent = transactionsConsumerQuery.data.data.list;
        return dataPerEvent.length;
      }
      return 0;
    };
    return (
      <Grid
        key={customer.id}
        style={{
          padding: "5px",
          display: "flex",
          justifyContent: "center",
          alignSelf: "stretch",
        }}
        container
        ref={rowRef}
      >
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "0 0 1.5dvh",
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Typography
              textTransform={"none"}
              style={TextFontSize30LineHeight38}
            >
              Consumer
            </Typography>
            {/* /event/new_subscription */}
            <Link to="/create-event-page/event-detail">
              <Button
                style={{
                  ...BlueButton,
                  ...CenteringGrid,
                }}
              >
                <Icon
                  icon="ic:baseline-plus"
                  color="var(--base-white, #FFF"
                  width={20}
                  height={20}
                />
                &nbsp;
                <Typography
                  textTransform={"none"}
                  style={{
                    ...BlueButtonText,
                  }}
                >
                  Add new event
                </Typography>
              </Button>
            </Link>
          </Grid>
        </Grid>
        <Grid
          style={{
            paddingTop: "0px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid marginY={0} item xs={8}>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography
                style={{
                  ...TextFontsize18LineHeight28,
                  textTransform: "capitalize",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--blue-dark-600, #155EEF)",
                  cursor: "pointer",
                }}
                onClick={() => handleBackAction()}
              >
                All consumers
              </Typography>
              <Typography
                style={{
                  ...TextFontsize18LineHeight28,
                  textTransform: "capitalize",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--gray-900, #101828)",
                }}
              >
                <Icon icon="mingcute:right-line" />
                {customer?.name} {customer?.lastName}
              </Typography>{" "}
            </Grid>
          </Grid>
          <Grid textAlign={"right"} item xs={4}></Grid>
        </Grid>
        <Divider />
        <Grid
          gap={"5px"}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          alignSelf={"flex-start"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={3}
            lg={3}
          >
            <ConsumerDetailInformation />
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            alignSelf={"flex-start"}
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
          >
            <ConsumerDetailInfoCntact />
          </Grid>
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            alignSelf={"flex-start"}
            item
            xs={12}
            sm={12}
            md={3}
            lg={3}
          >
            <CardActionsButton />
          </Grid>
        </Grid>
        <Divider />{" "}
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={3} lg={3}>
          <CardRendered
            title={"Transactions"}
            props={renderingTransactions()}
            optional={null}
          />
        </Grid>{" "}
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={3} lg={3}>
          <CardRendered
            title={"Events"}
            props={`${eventsAttendedForCustomer}`}
            optional={null}
          />
        </Grid>
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={6} lg={6}>
          <NotesRendering
            title={"Notes"}
            props={substractingNotesAddedForCompany()}
          />
        </Grid>
        <Divider />{" "}
        <p
          style={{
            ...TextFontsize18LineHeight28,
            width: "100%",
            textAlign: "left",
            margin: "0 0 1.5dvh",
          }}
        >
          Transactions
        </p>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            alignSelf={"flex-start"}
            item
            xs={12}
            md={4}
            lg={4}
          >
            <OutlinedInput
              {...register("searchEvent")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search a transaction here"
              startAdornment={
                <InputAdornment position="start">
                  <Icon
                    icon="radix-icons:magnifying-glass"
                    color="#344054"
                    width={20}
                    height={19}
                  />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <Icon
                    cursor={"pointer"}
                    icon="ic:baseline-delete-forever"
                    color="#1e73be"
                    width="25"
                    height="25"
                    opacity={`${watch("searchEvent")?.length > 0 ? 1 : 0}`}
                    onClick={() => {
                      setValue("searchEvent", "");
                    }}
                  />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            alignSelf={"flex-start"}
            item
            xs={12}
            md={5}
            lg={5}
          >
            <AssigmentAction />
          </Grid>
        </Grid>
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <StripeTransactionPerConsumer searchValue={watch("searchEvent")} />
          </Grid>
        </Grid>
      </Grid>
    );
  }
};

export default DetailPerConsumer;
