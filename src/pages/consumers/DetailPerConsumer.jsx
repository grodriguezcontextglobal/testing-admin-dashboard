// import StripeTransactionHistoryByUser from '../Attendees/tables/StripeTransactionHistoryByUser';
import { Icon } from "@iconify/react";
import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import CardRendered from "../inventory/utils/CardRendered";
import CardActionsButton from "./components/CardActionsButton";
import ConsumerDetailInformation from "./components/ConsumerDetailInformation";
import ConsumerDetailInfoCntact from "./components/ConsumerDetailinfoContact";
// import TransactionTableRefactoring from "./tables/TransactionTableRefactoring";
import { groupBy } from "lodash";
import { useEffect, useRef, useState } from "react";
import Breadcrumb from "../../components/UX/breadcrumbs/Breadcrumb";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import { WhiteCirclePlusIcon } from "../../components/icons/WhiteCirclePlusIcon";
import AssigmentAction from "./components/AssigmentAction";
import NotesRendering from "./components/NotesCard";
import StripeTransactionPerConsumer from "./tables/StripeTransactionPerConsumer";
import { CreateNewConsumer } from "./utils/CreateNewUser";

const DetailPerConsumer = () => {
  const [createUserButton, setCreateUserButton] = useState(false);
  const { register, watch, setValue } = useForm();
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
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
        active: { $in: [true, false] },
      }),
    // refetchOnMount: false,
    enabled: !!user.companyData.id && !!customer.email,
  });
  // useEffect(() => {
  //   const controller = new AbortController();
  //   transactionsConsumerQuery.refetch();
  //   return () => {
  //     controller.abort();
  //   };
  // }, [customerInfoTemplate.id, user.companyData.id, user.id]);

  const refetchingAfterReturnDeviceAssignedInTransaction = () => {
    return transactionsConsumerQuery.refetch();
  };

  const [eventsAttendedForCustomer, setEventsAttendedForCustomer] = useState(0);
  const renderingNumberOfEventsConsumerAttended = async () => {
    const result = new Map();
    if (transactionsConsumerQuery.data) {
      const dataPerEvent = groupBy(
        transactionsConsumerQuery?.data?.data?.list,
        "eventSelected"
      );

      for (let [key, value] of Object.entries(dataPerEvent)) {
        if (!result.has(key)) {
          result.set(key, value);
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
  }, [
    user.id,
    user.companyData.id,
    transactionsConsumerQuery.data,
    customer.email,
  ]);

  if (transactionsConsumerQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (transactionsConsumerQuery.data) {
    const substractingNotesAddedForCompany = () => {
      const result = customer?.data?.notes?.filter(
        (ele) => ele.company === user.companyData.id
      );
      if (result?.length > 0) {
        let final = [];
        final = [...final, ...result.map((item) => item)];
        return final;
      }
      return [];
    };

    const renderingTransactions = () => {
      if (transactionsConsumerQuery.data) {
        let dataPerEvent = 0;
        dataPerEvent = dataPerEvent +=
          transactionsConsumerQuery.data.data.list.length;
        return dataPerEvent;
      }
      return 0;
    };

    const style = {
      titleNavigation: {
        textTransform: "none",
        textAlign: "left",
        fontWeight: 600,
        fontSize: "18px",
        fontFamily: "Inter",
        lineHeight: "28px",
        color: "var(--blue-dark-600, #155EEF)",
      },
    };

    const breadcrumbItems = [
      {
        title: (
          <Link to="/consumers">
            <p style={style.titleNavigation}>All consumers</p>
          </Link>
        ),
      },
      {
        title: (
          <p
            style={{
              ...TextFontsize18LineHeight28,
              textTransform: "capitalize",
            }}
          >
            {customer?.name} {customer?.lastName}
          </p>
        ),
      },
    ];

    return (
      <>
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
              md={8}
              lg={8}
            >
              <Typography
                textTransform={"none"}
                style={TextFontSize30LineHeight38}
              >
                Consumer
              </Typography>
            </Grid>
            {/* /event/new_subscription */}
            <Grid
              sx={{
                display: "flex",
                justifyContent: {
                  xs: "flex-start",
                  sm: "flex-start",
                  md: "flex-end",
                  lg: "flex-end",
                },
                alignItems: "center",
                margin: {
                  xs: "0.5rem 0",
                  sm: "0.5rem 0",
                  md: "0.5rem 0",
                  lg: "0.5rem 0",
                },
              }}
              item
              xs={12}
              sm={12}
              md={4}
              lg={4}
            >
              <BlueButtonComponent
                title={"Add new consumer"}
                icon={<WhiteCirclePlusIcon />}
                func={() => setCreateUserButton(true)}
              />
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
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Breadcrumb path={breadcrumbItems} />
            </Grid>
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
              md={10}
              lg={10}
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
              sm={12}
              md
              lg
            >
              <AssigmentAction
                refetching={refetchingAfterReturnDeviceAssignedInTransaction}
              />
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
              <StripeTransactionPerConsumer
                data={transactionsConsumerQuery?.data?.data?.list}
                searchValue={watch("searchEvent")}
              />
            </Grid>
          </Grid>
        </Grid>
        {createUserButton && (
          <CreateNewConsumer
            createUserButton={createUserButton}
            setCreateUserButton={setCreateUserButton}
          />
        )}
      </>
    );
  }
};

export default DetailPerConsumer;
