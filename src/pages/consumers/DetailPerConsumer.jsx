import { Icon } from "@iconify/react";
import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Card } from "antd";
import { groupBy } from "lodash";
import { useRef } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Breadcrumb from "../../components/UX/breadcrumbs/Breadcrumb";
import Chip from "../../components/UX/Chip/Chip";
import PageSpinner from "../../components/utils/PageSpinner";
import { Subtitle } from "../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../styles/global/TextFontSize18LineHeight28";
import CardActionsButton from "./components/CardActionsButton";
import NotesRendering from "./components/NotesCard";
import StripeTransactionPerConsumer from "./tables/StripeTransactionPerConsumer";

const cardTokens = {
  borderRadius: "12px",
  border: "1px solid var(--gray-200, #ddded6)",
  background: "var(--base-white, #FFF)",
  boxShadow: "var(--shadow-xs)",
};

const contactRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
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
        color: accentColor ?? "var(--gray-900, #171d1a)",
      }}
    >
      {value ?? 0}
    </span>
    <span
      style={{
        ...Subtitle,
        display: "block",
        fontSize: "13px",
        lineHeight: "18px",
        color: "var(--gray-500, #777b73)",
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

  if (transactionsConsumerQuery.isLoading) return <PageSpinner />;

  if (transactionsConsumerQuery.data) {
    const transactionsList =
      transactionsConsumerQuery.data?.data?.list ?? [];

    const eventsAttendedForCustomer = Object.keys(
      groupBy(transactionsList, "eventSelected"),
    ).length;

    const activeTransactionsCount = transactionsList.filter(
      (item) => item.active === true,
    ).length;

    const substractingNotesAddedForCompany = () => {
      const result = customer?.data?.notes?.filter(
        (ele) => ele.company === user.companyData.id,
      );
      if (result?.length > 0) return [...result];
      return [];
    };

    const fullName = `${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim();
    const initials =
      `${customer?.name?.at(0) ?? ""}${customer?.lastName?.at(0) ?? ""}`.toUpperCase();

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
            {fullName}
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

        {/* Identity header — avatar, name, status, contact + actions */}
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Card style={cardTokens} styles={{ body: { padding: "24px" } }}>
            <div
              data-testid="consumer-header"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "24px",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  minWidth: 0,
                  flex: "1 1 320px",
                }}
              >
                <Avatar
                  size={80}
                  src={customer?.data?.profile_picture}
                  shape="circle"
                >
                  {customer?.data?.profile_picture ? "" : initials}
                </Avatar>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <h1
                      data-testid="consumer-name"
                      style={{
                        ...TextFontsize18LineHeight28,
                        color: "var(--gray-900, #171d1a)",
                        textTransform: "capitalize",
                        margin: 0,
                      }}
                    >
                      {fullName}
                    </h1>
                    <Chip
                      size="small"
                      color={activeTransactionsCount > 0 ? "success" : "default"}
                      label={
                        activeTransactionsCount > 0
                          ? "Active devices"
                          : "No active devices"
                      }
                    />
                  </div>
                  <p style={{ ...Subtitle, margin: 0 }}>Consumer</p>
                  <div style={contactRowStyle}>
                    <Icon
                      icon="tabler:mail"
                      width={16}
                      color="var(--gray-500, #777b73)"
                    />
                    <span style={{ ...Subtitle, color: "var(--gray-700, #484d47)" }}>
                      {customer?.email ?? "—"}
                    </span>
                  </div>
                  <div style={contactRowStyle}>
                    <Icon
                      icon="tabler:phone"
                      width={16}
                      color="var(--gray-500, #777b73)"
                    />
                    <span style={{ ...Subtitle, color: "var(--gray-700, #484d47)" }}>
                      {customer?.phoneNumber || "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ flex: "0 1 320px", minWidth: "240px" }}>
                <CardActionsButton refetching={refetchTransactions} />
              </div>
            </div>
          </Card>
        </Grid>

        {/* Stat tiles + Notes */}
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} sm={6} md={3}>
              <StatTile
                value={transactionsList.length}
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
          <Card style={cardTokens} styles={{ body: { padding: "24px" } }}>
            <StripeTransactionPerConsumer
              data={transactionsList}
              refetching={refetchTransactions}
            />
          </Card>
        </Grid>
      </Grid>
    );
  }
};

export default DetailPerConsumer;
