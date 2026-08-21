import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/UX/breadcrumbs/Breadcrumb";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import {
  ProfileErrorState,
  ProfileIdentityCard,
  ProfileShell,
  ProfileSkeleton,
  ProfileStatTiles,
  ProfileTabs,
  StatusChip,
} from "../../../../components/UX/profile";
import { onAddCustomerInfo } from "../../../../store/slices/customerSlice";
import {
  onAddCustomer,
  onAddDevicesAssignedInPaymentIntent,
  onAddNewPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../store/slices/stripeSlice";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import ConsumerActionRail from "./ConsumerDetail/ConsumerActionRail";
import useConsumerEventActivity from "./ConsumerDetail/hooks/useConsumerEventActivity";
import "./consumerDetail.css";

/**
 * A consumer, at one event.
 *
 * Rebuilt on the shared profile shell (components/UX/profile), so this page now
 * reads like pages/consumers/DetailPerConsumer.jsx, the device profile and the
 * member profile instead of being the last page in the app still speaking MUI
 * Grid with inline styles.
 *
 * What the shell replaced:
 *   - Three headings for one object: a 30px "Customer dashboard in <event>"
 *     title, the breadcrumb, and then a header card repeating the name again.
 *     The consumer's name is now the page's only <h1>.
 *   - Three near-identical stat cards (TotalRequestedDevice,
 *     TotalDeviceDistributed, TotalReturnedDevice — 220 lines of copy-pasted
 *     inline style for one number each), which never showed lost devices at all.
 *   - A `useForm`/`setValue`/`setTimeout(200)` dance on mount that wrote a
 *     value into a field named "searchEvent" that does not exist on this page.
 */

const breadcrumbLinkStyle = {
  ...TextFontsize18LineHeight28,
  color: "var(--blue-dark-600, #155EEF)",
  cursor: "pointer",
};

const breadcrumbCurrentStyle = {
  ...TextFontsize18LineHeight28,
  color: "var(--gray-900, #101828)",
};

const TABS = [
  { key: "transactions", label: "Transactions", to: "transactions-details" },
  { key: "documents", label: "Documents", to: "documents" },
];

const CustomerDetail = () => {
  const { choice, event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activity = useConsumerEventActivity();
  const consumer = activity.consumer;

  /**
   * Leaving the page clears the transaction context, so the next consumer does
   * not inherit this one's selected payment intent. It was two functions that
   * dispatched the same seven actions (one of them twice) and differed only in
   * where they navigated.
   */
  const leaveTo = (path) => {
    dispatch(onAddNewPaymentIntent([]));
    dispatch(onAddCustomerInfo(undefined));
    dispatch(onAddCustomer(null));
    dispatch(onAddPaymentIntentDetailSelected([]));
    dispatch(onAddPaymentIntentSelected(undefined));
    dispatch(onAddDevicesAssignedInPaymentIntent(undefined));
    navigate(path);
  };

  const fullName = `${consumer?.name ?? ""} ${consumer?.lastName ?? ""}`.trim();

  const breadcrumb = (
    <Breadcrumb
      path={[
        {
          title: <p style={breadcrumbLinkStyle}>All events</p>,
          onClick: () => leaveTo("/events"),
        },
        {
          title: <p style={breadcrumbLinkStyle}>{choice}</p>,
          onClick: () => leaveTo("/events/event-quickglance"),
        },
        {
          title: (
            <p style={breadcrumbCurrentStyle} data-testid="consumer-detail-title">
              {fullName || "Consumer"}
            </p>
          ),
        },
      ]}
    />
  );

  // A bookmarked URL or a hard reload arrives with no consumer in the store.
  // The old page rendered the shell around `undefined undefined` and left every
  // query disabled, so it looked like a consumer with no activity.
  if (!consumer?.email) {
    return (
      <div className="consumer-detail-page" style={{ padding: "16px 24px 24px" }}>
        <ProfileShell breadcrumb={breadcrumb}>
          <ProfileErrorState
            title="No consumer selected"
            description="Open a consumer from the event's attendee list to see their activity."
            action={
              <GrayButtonComponent
                title="Back to the event"
                func={() => leaveTo("/events/event-quickglance")}
              />
            }
          />
        </ProfileShell>
      </div>
    );
  }

  const factGroups = [
    {
      label: "Contact",
      items: [
        consumer.email
          ? { value: consumer.email, href: `mailto:${consumer.email}` }
          : { value: "No email on file", muted: true },
        { value: consumer.phoneNumber || "No phone on file", muted: !consumer.phoneNumber },
      ],
    },
    {
      label: "Event",
      items: [
        { value: event?.eventInfoDetail?.eventName },
        { value: event?.eventInfoDetail?.address, muted: true },
      ],
    },
    {
      label: "Account",
      items: [
        { value: consumer.id ? `ID ${consumer.id}` : null },
        {
          value: event?.active ? "Event open" : "Event closed",
          muted: true,
        },
      ],
    },
  ];

  return (
    <div className="consumer-detail-page" style={{ padding: "16px 24px 24px" }}>
      <ProfileShell
        testId="consumer-event-detail"
        breadcrumb={breadcrumb}
        identity={
          <ProfileIdentityCard
            name={fullName || consumer.email}
            imageUrl={consumer.profile_picture ?? consumer.data?.profile_picture}
            chips={activity.chips.map((chip) => (
              <StatusChip
                key={chip.key}
                tone={chip.tone}
                pip={chip.pip}
                label={chip.label}
              />
            ))}
            factGroups={factGroups}
            actions={<ConsumerActionRail />}
            testId="consumer-header"
          />
        }
        stats={
          // The strip is secondary: it degrades on its own instead of taking
          // the transactions below it down, which is what the old
          // `if (a && b && c)` guard did — one failed query and the whole
          // section rendered nothing at all, silently.
          activity.isError ? null : activity.isLoading ? (
            <ProfileSkeleton lines={2} />
          ) : (
            <ProfileStatTiles
              tiles={activity.statTiles}
              testId="consumer-event-stats"
            />
          )
        }
        tabs={<ProfileTabs items={TABS} ariaLabel="Consumer sections" />}
      >
        <Outlet />
      </ProfileShell>
    </div>
  );
};

export default CustomerDetail;
