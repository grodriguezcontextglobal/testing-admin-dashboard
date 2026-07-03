import { Grid } from "@mui/material";
import { Card } from "antd";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import Breadcrumb from "../../components/UX/breadcrumbs/Breadcrumb";
import RefactoredHeaderUntitledUiReact from "../../components/UX/header/DynamicHeaderCompnent";
import CenteringGrid from "../../styles/global/CenteringGrid";
import TextFontsize18LineHeight28 from "../../styles/global/TextFontSize18LineHeight28";
import CardActionsButton from "./components/CardActionsButton";
import NotesRendering from "./components/NotesCard";
import StripeTransactionPerConsumer from "./tables/StripeTransactionPerConsumer";

const cardTokens = {
  borderRadius: "12px",
  border: "1px solid var(--gray-200, #EAECF0)",
  background: "var(--base-white, #FFF)",
  boxShadow:
    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
};

const StatTile = ({ value, label, accentColor, testId }) => (
  <Card
    data-testid={testId}
    style={{ ...cardTokens, height: "100%" }}
    styles={{ body: { padding: "20px 24px" } }}
  >
    <span
      style={{
        display: "block",
        fontFamily: "Inter",
        fontSize: "28px",
        fontWeight: 600,
        lineHeight: "38px",
        color: accentColor ?? "var(--gray-900, #101828)",
      }}
    >
      {value ?? 0}
    </span>
    <span
      style={{
        display: "block",
        fontFamily: "Inter",
        fontSize: "13px",
        lineHeight: "18px",
        color: "var(--gray-500, #667085)",
        marginTop: "4px",
      }}
    >
      {label}
    </span>
  </Card>
);

const DetailPerConsumer = () => {
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
    enabled: !!user.companyData.id && !!customer.email,
  });

  const refetchTransactions = () => transactionsConsumerQuery.refetch();

  const [eventsAttendedForCustomer, setEventsAttendedForCustomer] = useState(0);

  const renderingNumberOfEventsConsumerAttended = async () => {
    const result = new Map();
    if (transactionsConsumerQuery.data) {
      const dataPerEvent = groupBy(
        transactionsConsumerQuery?.data?.data?.list,
        "eventSelected"
      );
      for (let [key, value] of Object.entries(dataPerEvent)) {
        if (!result.has(key)) result.set(key, value);
      }
    }
    return setEventsAttendedForCustomer(result.size);
  };

  useEffect(() => {
    const controller = new AbortController();
    renderingNumberOfEventsConsumerAttended();
    return () => controller.abort();
  }, [user.id, user.companyData.id, transactionsConsumerQuery.data, customer.email]);

  if (transactionsConsumerQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <DevitrakLoading />
      </div>
    );

  if (transactionsConsumerQuery.data) {
    const substractingNotesAddedForCompany = () => {
      const result = customer?.data?.notes?.filter(
        (ele) => ele.company === user.companyData.id
      );
      if (result?.length > 0) return [...result];
      return [];
    };

    const renderingTransactions = () =>
      transactionsConsumerQuery.data?.data?.list?.length ?? 0;

    const breadcrumbItems = [
      {
        title: (
          <Link to="/consumers">
            <p
              style={{
                textTransform: "none",
                textAlign: "left",
                fontWeight: 600,
                fontSize: "18px",
                fontFamily: "Inter",
                lineHeight: "28px",
                color: "var(--blue-dark-600, #155EEF)",
              }}
            >
              All consumers
            </p>
          </Link>
        ),
      },
      {
        title: (
          <p
            data-testid="consumer-detail-title"
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
      <Grid
        key={customer.id}
        data-testid="consumer-detail-page"
        container
        sx={{ padding: "16px 24px 24px" }}
        ref={rowRef}
      >
        {/* Breadcrumb */}
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Breadcrumb path={breadcrumbItems} />
        </Grid>

        {/* Consumer profile header — avatar + info + actions unificados */}
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Card style={cardTokens} styles={{ body: { padding: "20px 24px" } }}>
            <RefactoredHeaderUntitledUiReact
              image={customer?.data?.profile_picture}
              title={`${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim()}
              subtitle="Consumer"
              email={customer?.email}
              phone={customer?.phoneNumber || "—"}
              actions={<CardActionsButton refetching={refetchTransactions} />}
            />
          </Card>
        </Grid>

        {/* Stat tiles + Notes */}
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} sm={6} md={3}>
              <StatTile
                value={renderingTransactions()}
                label="Transactions"
                testId="stat-transactions"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatTile
                value={eventsAttendedForCustomer}
                label="Events attended"
                testId="stat-events"
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <NotesRendering
                title={"Notes"}
                props={substractingNotesAddedForCompany()}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Transactions table */}
        <Grid item xs={12}>
          <StripeTransactionPerConsumer
            data={transactionsConsumerQuery?.data?.data?.list}
            refetching={refetchTransactions}
          />
        </Grid>
      </Grid>
    );
  }
};

export default DetailPerConsumer;
