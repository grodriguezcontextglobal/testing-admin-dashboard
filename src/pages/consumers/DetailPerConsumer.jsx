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
import { Link, Outlet, useNavigate } from "react-router-dom";
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
import TransactionTableRefactoring from "./tables/TransactionTableRefactoring";
import { useEffect } from "react";
import AssigmentAction from "./components/AssigmentAction";

const DetailPerConsumer = () => {
  const { register, watch, setValue } = useForm();
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const stripeTransactionsSavedQuery = useQuery({
    queryKey: ["stripeTransactionsList"],
    queryFn: () => devitrakApi.get("/admin/users"),
    refetchOnMount: false,
  });
  const transactionsConsumerQuery = useQuery({
    queryKey: ["transactionsPerCustomer"],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        company: user.companyData.id,
        "consumerInfo.uid": customer.uid,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    stripeTransactionsSavedQuery.refetch();
    transactionsConsumerQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  if (stripeTransactionsSavedQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (stripeTransactionsSavedQuery.data) {
    const handleBackAction = () => {
      navigate("/consumers");
    };
    const substractingNotesAddedForCompany = () => {
      const result = customer?.data?.notes.filter(
        (ele) => ele.company === user.companyData.id
      );
      let note = "";
      if (result) {
        result.map((item) => (note += item.notes));
        return note;
      }
      return []
    };

    return (
      <Grid
        style={{
          padding: "5px",
          display: "flex",
          justifyContent: "center",
          alignSelf: "stretch",
        }}
        container
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
            props={`${transactionsConsumerQuery?.data?.data?.list.length ?? 0}`}
            optional={null}
          />
        </Grid>{" "}
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={3} lg={3}>
          <CardRendered
            title={"Events"}
            props={`${customer?.data?.event_providers.length ?? 0}`}
            optional={null}
          />
        </Grid>
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={6} lg={6}>
          <CardRendered
            title={"Notes"}
            props={substractingNotesAddedForCompany()}
            optional={null}
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
            <TransactionTableRefactoring searchValue={watch("searchEvent")} />
          </Grid>
        </Grid>
        <Outlet />
      </Grid>
    );
  }
};

export default DetailPerConsumer;