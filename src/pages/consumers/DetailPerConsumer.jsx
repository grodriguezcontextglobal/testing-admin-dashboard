import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Breadcrumb from "../../components/UX/breadcrumbs/Breadcrumb";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import {
  ProfileErrorState,
  ProfileIdentityCard,
  ProfileSection,
  ProfileShell,
  ProfileSkeleton,
  ProfileStatTiles,
  ProfileTabs,
  StatusChip,
} from "../../components/UX/profile";
import TextFontsize18LineHeight28 from "../../styles/global/TextFontSize18LineHeight28";
import CardActionsButton from "./components/CardActionsButton";
import NotesRendering from "./components/NotesCard";
import useConsumerAssignedDevices from "./hooks/useConsumerAssignedDevices";
import ConsumerDevicesTable from "./tables/ConsumerDevicesTable";
import StripeTransactionPerConsumer from "./tables/StripeTransactionPerConsumer";

// Every tab is a real destination with real content. There is no "Overview"
// tab standing in for a summary — the stat tiles above the tabs are the
// summary, and they stay visible from every tab.
const TABS = [
  { key: "devices", label: "Devices" },
  { key: "transactions", label: "Transactions" },
  { key: "notes", label: "Notes" },
];

const currency = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const breadcrumbLinkStyle = {
  textTransform: "none",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "18px",
  fontFamily: "Inter",
  lineHeight: "28px",
  color: "var(--blue-dark-600, #155EEF)",
};

const DetailPerConsumer = () => {
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab lives in the URL, so a specific view of a consumer can be linked and
  // survives a refresh.
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.key === requestedTab)
    ? requestedTab
    : "devices";

  const consumerId = customer?.id ?? customer?.uid;

  const transactionsConsumerQuery = useQuery({
    queryKey: ["transactionsPerCustomer", String(consumerId ?? "")],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        company: user.companyData.id,
        "consumerInfo.email": customer.email,
        active: { $in: [true, false] },
      }),
    enabled: !!user.companyData.id && !!customer.email,
  });

  const transactionsList = transactionsConsumerQuery.data?.data?.list ?? [];
  const paymentIntents = Object.keys(groupBy(transactionsList, "paymentIntent"));

  const devicesQuery = useConsumerAssignedDevices({
    consumerId,
    companyId: user.companyData.id,
    paymentIntents,
  });
  const deviceSummary = devicesQuery.summary;

  const eventsAttended = Object.keys(
    groupBy(transactionsList, "eventSelected")
  ).length;

  const notesForCompany =
    customer?.data?.notes?.filter(
      (note) => note.company === user.companyData.id
    ) ?? [];

  const fullName = `${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim();

  const breadcrumbItems = [
    {
      title: (
        <Link to="/consumers">
          <p style={breadcrumbLinkStyle}>All consumers</p>
        </Link>
      ),
    },
    {
      title: (
        <p
          data-testid="consumer-detail-title"
          style={{ ...TextFontsize18LineHeight28, textTransform: "capitalize" }}
        >
          {fullName}
        </p>
      ),
    },
  ];

  const breadcrumb = <Breadcrumb path={breadcrumbItems} />;

  // Landing here without a selected consumer (a bookmarked URL, a hard reload)
  // used to leave the query disabled and the page spinning forever. Say what
  // happened instead.
  if (!customer?.email) {
    return (
      <div data-testid="consumer-detail-page" style={{ padding: "16px 24px 24px" }}>
        <ProfileShell breadcrumb={breadcrumb}>
          <ProfileErrorState
            title="No consumer selected"
            description="Open a consumer from the list to see their profile."
            action={
              <Link to="/consumers">
                <GrayButtonComponent title={"Back to all consumers"} />
              </Link>
            }
          />
        </ProfileShell>
      </div>
    );
  }

  // The old page had no error branch at all: a failed request fell through the
  // `if (data)` and rendered `undefined` — a blank white screen with nothing to
  // read and nothing to click.
  if (transactionsConsumerQuery.isError) {
    return (
      <div data-testid="consumer-detail-page" style={{ padding: "16px 24px 24px" }}>
        <ProfileShell breadcrumb={breadcrumb}>
          <ProfileErrorState
            title="Couldn't load this consumer"
            description="The transaction service didn't respond. Nothing was changed."
            action={
              <GrayButtonComponent
                title={"Try again"}
                func={() => transactionsConsumerQuery.refetch()}
              />
            }
          />
        </ProfileShell>
      </div>
    );
  }

  if (transactionsConsumerQuery.isLoading) {
    return (
      <div data-testid="consumer-detail-page" style={{ padding: "16px 24px 24px" }}>
        <ProfileShell breadcrumb={breadcrumb}>
          <div style={{ padding: "8px 0" }}>
            <ProfileSkeleton lines={5} />
          </div>
        </ProfileShell>
      </div>
    );
  }

  const chips = [
    deviceSummary.lost > 0 && (
      <StatusChip
        key="lost"
        tone="critical"
        pip
        label={`${deviceSummary.lost} lost`}
      />
    ),
    <StatusChip
      key="out"
      tone={deviceSummary.out > 0 ? "success" : "neutral"}
      pip={deviceSummary.out > 0}
      // States a fact rather than a mood. The old chip read "Active devices" /
      // "No active devices", which never said how many.
      label={
        deviceSummary.out > 0
          ? `${deviceSummary.out} device${deviceSummary.out === 1 ? "" : "s"} out`
          : "No devices out"
      }
    />,
  ].filter(Boolean);

  const factGroups = [
    {
      label: "Contact",
      items: [
        customer?.email
          ? { value: customer.email, href: `mailto:${customer.email}` }
          : { value: "No email on file", muted: true },
        { value: customer?.phoneNumber || "—" },
      ],
    },
    {
      label: "Account",
      items: [
        { value: consumerId ? `ID ${consumerId}` : null },
        {
          value: `${notesForCompany.length} note${
            notesForCompany.length === 1 ? "" : "s"
          } on file`,
          muted: true,
        },
      ],
    },
  ];

  const statTiles = [
    {
      label: "Lost",
      value: deviceSummary.lost,
      tone: deviceSummary.lost > 0 ? "critical" : "neutral",
      sub: deviceSummary.lost > 0 ? "Chargeable" : "None reported",
      testId: "stat-lost",
    },
    {
      label: "Devices out",
      value: deviceSummary.out,
      sub: deviceSummary.out === 0 ? "Nothing assigned" : null,
      testId: "stat-devices-out",
    },
    {
      label: "Value on loan",
      value: currency(deviceSummary.valueOnLoan),
      sub: "Replacement cost",
      testId: "stat-value-on-loan",
    },
    {
      label: "Events attended",
      value: eventsAttended,
      sub: `${transactionsList.length} transaction${
        transactionsList.length === 1 ? "" : "s"
      }`,
      testId: "stat-events",
    },
  ];

  const renderTab = () => {
    if (activeTab === "transactions") {
      return (
        <ProfileSection
          title="Transactions"
          count={transactionsList.length}
          testId="consumer-transactions-section"
        >
          <div style={{ padding: "0 20px 20px" }}>
            <StripeTransactionPerConsumer
              data={transactionsList}
              refetching={transactionsConsumerQuery.refetch}
            />
          </div>
        </ProfileSection>
      );
    }

    if (activeTab === "notes") {
      return (
        <ProfileSection
          title="Notes"
          count={notesForCompany.length}
          testId="consumer-notes-section"
        >
          <div style={{ padding: "0 20px 20px" }}>
            <NotesRendering title={"Notes"} props={notesForCompany} />
          </div>
        </ProfileSection>
      );
    }

    return (
      <ProfileSection
        title="Assigned devices"
        count={devicesQuery.isLoading ? undefined : devicesQuery.rows.length}
        description={
          devicesQuery.rows.length > 0 ? "Lost first, then still out" : null
        }
        testId="consumer-devices-section"
      >
        <ConsumerDevicesTable
          rows={devicesQuery.rows}
          isLoading={devicesQuery.isLoading}
          isError={devicesQuery.isError}
          onRetry={() => devicesQuery.refetch()}
        />
      </ProfileSection>
    );
  };

  return (
    <div data-testid="consumer-detail-page" style={{ padding: "16px 24px 24px" }}>
      <ProfileShell
        breadcrumb={breadcrumb}
        identity={
          <ProfileIdentityCard
            name={fullName}
            imageUrl={customer?.data?.profile_picture}
            chips={chips}
            factGroups={factGroups}
            actions={
              <CardActionsButton refetching={transactionsConsumerQuery.refetch} />
            }
            testId="consumer-header"
          />
        }
        stats={<ProfileStatTiles tiles={statTiles} testId="consumer-stats" />}
        tabs={
          <ProfileTabs
            items={TABS}
            activeKey={activeTab}
            onSelect={(key) => {
              // Merge rather than replace, so switching tabs doesn't drop any
              // other query params the page was opened with.
              const next = new URLSearchParams(searchParams);
              next.set("tab", key);
              setSearchParams(next, { replace: true });
            }}
          />
        }
      >
        {renderTab()}
      </ProfileShell>
    </div>
  );
};

export default DetailPerConsumer;
