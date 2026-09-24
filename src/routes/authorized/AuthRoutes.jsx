import { Suspense, useRef } from "react";
import { lazyWithRetry } from "../lazyWithRetry";
import { Navigate, Route, Routes, useLocation } from "react-router";
import PermissionGuard from "./PermissionGuard";
import SuperUserGuard from "./SuperUserGuard";
import IndustryTabGuard from "./IndustryTabGuard";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import CenteringGrid from "../../styles/global/CenteringGrid";
import ErrorBoundary from "../../components/utils/ErrorBoundary";
import AuthorizedDeposit from "../../pages/consumers/action/transaction/AuthorizedDeposit";
import AdvanceSearchResultPage from "../../pages/inventory/table/extras/AdvanceSearchResultPage";
import ChargeAllListDeviceCash from "../../pages/consumers/action/chargeAllDevicesFolder/ChargeAllListDeviceCash";
import ChargeAllListDeviceCreditCard from "../../pages/consumers/action/chargeAllDevicesFolder/ChargeAllListDeviceCreditCard";
import NewPost from "../../pages/posts/action/NewPost";
import EditPost from "../../pages/posts/action/EditPost";
import DisplayArticle from "../../pages/posts/components/DisplayArticle";
import HeaderComponent from "../../components/general/HeaderComponent";
import HelpLauncher from "../../pages/help/HelpLauncher";
import ViewDocument from "../../pages/Profile/Documents/ViewDocument";
import EditDocument from "../../pages/Profile/Documents/EditDocument";
import LandingPageForDownloadableDocuments from "../../pages/authentication/LandingPageForDownloadableDocuments";
import PlatformPolicies from "../../pages/Profile/platform_policies/PlatformPolicies";
import SignedContractViewHigherPermissionLevel from "../../pages/staff/detail/components/equipment_components/SignedContractViewHigherLevelPermissions";
import MfaSetup from "../../pages/Profile/mfa/MfaSetup";
import MyDevicesPortal from "../../pages/authentication/MyDevicesPortal";
import AttendanceConfirmationLanding from "../../pages/authentication/AttendanceConfirmationLanding";

const FooterComponent = lazyWithRetry(() =>
  import("../../components/general/FooterComponent")
);
// const UpperBanner = lazyWithRetry(() => import("../../components/general/UpperBanner"));
// const NavigationBarMain = lazyWithRetry(() =>
//   import("../../components/navbar/NavigationBarMain")
// );
const FormEventDetail = lazyWithRetry(() =>
  import("../../pages/events/newEventProcess/eventDetails/Form")
);
const FormDeviceDetail = lazyWithRetry(() =>
  import("../../pages/events/newEventProcess/inventory/Form")
);
const ReviewAndSubmitEvent = lazyWithRetry(() =>
  import("../../pages/events/newEventProcess/review/ReviewAndSubmitPage")
);
const FormStaffDetail = lazyWithRetry(() =>
  import("../../pages/events/newEventProcess/staff/Form")
);
const FormDocumentDetail = lazyWithRetry(() =>
  import("../../pages/events/newEventProcess/documents/Form")
);
const TransactionsDetails = lazyWithRetry(() =>
  import(
    "../../pages/events/quickGlance/consumer/ConsumerDetail/details/TransactionsDetails"
  )
);
const ConsumerDocumentsDetails = lazyWithRetry(() =>
  import(
    "../../pages/events/quickGlance/consumer/ConsumerDetail/details/DocumentsDetails"
  )
);
const Cash = lazyWithRetry(() =>
  import("../../pages/events/quickGlance/consumer/lostFee/actions/Cash")
);
const CreditCard = lazyWithRetry(() =>
  import("../../pages/events/quickGlance/consumer/lostFee/actions/CreditCard")
);
const AddNewItem = lazyWithRetry(() =>
  import("../../pages/inventory/actions/AddNewItem")
);
const EditGroup = lazyWithRetry(() => import("../../pages/inventory/actions/EditGroup"));
const AddNewBulkItems = lazyWithRetry(() =>
  import("../../pages/inventory/actions/NewBulkItems")
);
const MainPageGrouping = lazyWithRetry(() =>
  import("../../pages/inventory/details/GroupDetail/MainPage")
);
const MainPageBrand = lazyWithRetry(() =>
  import("../../pages/inventory/details/BrandDetail/MainPage")
);
const MainPageCategory = lazyWithRetry(() =>
  import("../../pages/inventory/details/categoryDetail/MainPage")
);
const MainPage = lazyWithRetry(() =>
  import("../../pages/inventory/details/LocationDetail/MainPage")
);
const InventoryInUsePage = lazyWithRetry(() =>
  import("../../pages/inventory/InventoryInUse/MainPage")
);
const ParentRenderingChildrenPage = lazyWithRetry(() =>
  import("../../pages/ParentRenderingChildrenPage")
);
const Confirmation = lazyWithRetry(() => import("../../pages/payment/Confirmation"));
const BillingMainPage = lazyWithRetry(() =>
  import("../../pages/Profile/billing/BillingMainPage")
);
const MyDetailsMainPage = lazyWithRetry(() =>
  import("../../pages/Profile/my_details/MyDetailsMainPage")
);
const PasswordMainPage = lazyWithRetry(() =>
  import("../../pages/Profile/my_password/PasswordMainPage")
);
const NotificationsMainPage = lazyWithRetry(() =>
  import("../../pages/Profile/notifications/NotificationsMainPage")
);
const StaffActivityMainPage = lazyWithRetry(() =>
  import("../../pages/Profile/staff_activity/StaffActivityMainPage")
);
const Assignment = lazyWithRetry(() =>
  import("../../pages/staff/detail/components/equipment_components/Assignment")
);
const UpdateContactInfo = lazyWithRetry(() =>
  import(
    "../../pages/staff/detail/components/equipment_components/UpdateContactInfo"
  )
);
const StaffDetail = lazyWithRetry(() => import("../../pages/staff/detail/StaffDetail"));
const ForgetPasswordLinkFromStaffPage = lazyWithRetry(() =>
  import(
    "../../pages/staff/detail/components/equipment_components/ResetPasswordLink"
  )
);
const UpdateRoleInCompany = lazyWithRetry(() =>
  import(
    "../../pages/staff/detail/components/equipment_components/UpdateRoleInCompany"
  )
);
const AssignStaffMemberToEvent = lazyWithRetry(() =>
  import("../../pages/staff/detail/components/AssignStaffMemberToEvent")
);
const AssignLocationManager = lazyWithRetry(() =>
  import(
    "../../pages/staff/detail/components/equipment_components/assingmentComponents/AssignLocationManager"
  )
);
const ConsumerDeviceLostFeeCash = lazyWithRetry(() =>
  import("../../pages/consumers/components/markedLostOption/Cash")
);
const RedirectionPage = lazyWithRetry(() =>
  import("../../components/utils/RedirectionPage")
);
const ConsumerDeviceLostFeeCreditCard = lazyWithRetry(() =>
  import("../../pages/consumers/components/markedLostOption/CreditCard")
);
// Target of the receipt QR. Also registered in NoAuthRoutes — whoever scans may
// or may not have a session, and this tree's catch-all is the error page.
const ReceiptPage = lazyWithRetry(() => import("../../pages/payment/ReceiptPage"));
// Public page, registered here too: a customer who is already signed in
// should reach /status without being bounced, same as ReceiptPage.
const ServiceStatusPage = lazyWithRetry(() => import("../../pages/status/ServiceStatusPage"));
const CompanyInfo = lazyWithRetry(() =>
  import("../../pages/Profile/company_info/MainPage")
);
const EmailBrandingSettings = lazyWithRetry(() =>
  import("../../pages/Profile/email_branding/EmailBrandingSettings")
);
const SchoolComplianceSettings = lazyWithRetry(() =>
  import("../../pages/Profile/school_compliance/SchoolComplianceSettings")
);
const RolesManagementMainPage = lazyWithRetry(() =>
  import("../../pages/Profile/roles_management/RolesManagementMainPage")
);
const ConfirmSubscription = lazyWithRetry(() =>
  import("../../components/stripe/payment/ConfirmSubscription")
);
const MainPageOwnership = lazyWithRetry(() =>
  import("../../pages/inventory/details/OwnershipDetail/MainPage")
);
const SystemJobsMainPage = lazyWithRetry(() =>
  import("../../pages/Profile/system_jobs/SystemJobsMainPage")
);

const Home = lazyWithRetry(() => import("../../pages/home/MainPage"));
const SearchResultPage = lazyWithRetry(() => import("../../pages/search/MainPage"));
const EventMainPage = lazyWithRetry(() => import("../../pages/events/MainPage"));
const EventQuickGlanceMainPage = lazyWithRetry(() =>
  import("../../pages/events/quickGlance/MainPageQuickGlance")
);
const CustomerDetailInEvent = lazyWithRetry(() =>
  import("../../pages/events/quickGlance/consumer/CustomerDetail")
);
const NewEventSubscription = lazyWithRetry(() =>
  import("../../pages/events/newEventProcess/subscription/Main")
);
const DeviceDetail = lazyWithRetry(() =>
  import("../../pages/events/quickGlance/inventory/DeviceDetail")
);
const ConsumersMainPage = lazyWithRetry(() => import("../../pages/consumers/MainPage"));
// The user manual is deliberately ungated: every role can read how the app
// works, and articles about elevated actions say so instead of being hidden.
const HelpMainPage = lazyWithRetry(() => import("../../pages/help/MainPage"));
const ConsumerDetail = lazyWithRetry(() =>
  import("../../pages/consumers/DetailPerConsumer")
);
const Inventory = lazyWithRetry(() => import("../../pages/inventory/MainPage"));
const InventoryDetail = lazyWithRetry(() =>
  import("../../pages/inventory/details/MainPage")
);
const InventoryEvent = lazyWithRetry(() =>
  import("../../pages/inventory/details/deep_details_event_selected/MainPage")
);
const Staff = lazyWithRetry(() => import("../../pages/staff/MainPage"));
const MainPageEventCreation = lazyWithRetry(() =>
  import("../../pages/events/newEventProcess/MainPage")
);
const MainProfileSetting = lazyWithRetry(() =>
  import("../../pages/Profile/MainProfileSettings")
);
const ServicePaymentConfirmation = lazyWithRetry(() =>
  import("../../pages/payment/ServicePaymentConfirmation")
);
const ErrorPage = lazyWithRetry(() => import("../../pages/error/ErrorLandingPage"));
const Dashboard = lazyWithRetry(() =>
  import("../../pages/Profile/stripe_connected_account/Dashboard")
);
const UpdatingCompanyInfoAfterStripeConnectedAccountCreated = lazyWithRetry(() =>
  import(
    "../../pages/Profile/stripe_connected_account/UpdatingCompanyInfoAfterStripeConnectedAccountCreated"
  )
);
const Providers = lazyWithRetry(() => import("../../pages/Profile/providers/Main"));
const MainPagePosts = lazyWithRetry(() => import("../../pages/posts/MainPage"));
const DesignLab = lazyWithRetry(() => import("../../pages/designLab/DesignLab"));
import GlobalCommandMenu from "../../components/UX/commandMenu/GlobalCommandMenu";
import InstallAppBanner from "../../components/installPrompt/InstallAppBanner";
const Documents = lazyWithRetry(() => import("../../pages/Profile/Documents/Documents"));
const ConditionalMainPage = lazyWithRetry(() =>
  import("../../pages/conditionalPage/MainPage")
);

const MemberDetailsMainPage = lazyWithRetry(() =>
  import(
    "../../pages/conditionalPage/components/memberDetailsDashboard/MainPage"
  )
);
const DetailMemberInfo = lazyWithRetry(() =>
  import("../../pages/conditionalPage/tables/DetailMemberInfo")
);

const UpdateMemberInformation = lazyWithRetry(() =>
  import(
    "../../pages/conditionalPage/components/memberDetailsDashboard/innerComponents/UpdateMemberInformation"
  )
);

const Reminders = lazyWithRetry(() =>
  import(
    "../../pages/conditionalPage/components/memberDetailsDashboard/innerComponents/Reminders"
  )
);

const AssignmentDeviceMembers = lazyWithRetry(() =>
  import(
    "../../pages/conditionalPage/components/memberDetailsDashboard/innerComponents/assignmentComponents/assignment/AssignmentDevicesToMember"
  )
);
const AuthRoutes = () => {
  const navbarRef = useRef(null);
  const location = useLocation();
  return (
    <div
      style={{
        width: "100%",
        margin: "auto",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <InstallAppBanner />
      <HeaderComponent ref={navbarRef} />
      <GlobalCommandMenu />
      {/* Keyed on the path so a navigation gets the spinner back.
          react-router 7 wraps navigation in startTransition, and a transition
          deliberately keeps the CURRENT screen on display while the next one
          loads rather than falling back to this boundary. On a fast chunk that
          is an improvement — no flash. On a slow one it reads as a click that
          did nothing: the URL moves and the page sits there. Cold route
          modules on this dev setup take seconds, so that is most of them.
          A changing key makes it a new boundary, which suspends and shows the
          fallback. An already-loaded route renders straight through and never
          flashes it. */}
      <Suspense
        key={location.pathname}
        fallback={
          <div style={{ ...CenteringGrid, minHeight: "60dvh" }}>
            <DevitrakLoading />
          </div>
        }
      >
        <div
          style={{
            // minWidth: "768px",
            // width:100% so this flex-column child stretches to maxWidth
            // instead of shrinking to content (footer flex change regressed it)
            width: "100%",
            maxWidth: "1400px",
            margin: "auto auto 0",
            minHeight: "100dvh",
          }}
        >
          {/* A chunk that will not load has to say so. With
              v7_startTransition the old screen stays up while the next one
              loads, so without a boundary here a rejected import is a click
              that silently did nothing — the URL moves and the page does
              not. lazyWithRetry absorbs a blip; this is for the ones that
              are real. */}
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<ParentRenderingChildrenPage />}>
              <Route path="/" element={<Home />} />
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<EventMainPage />} />
              <Route path="/design-lab" element={<DesignLab />} />
              <Route path="/help" element={<HelpMainPage />} />
              <Route path="/help/:articleId" element={<HelpMainPage />} />
              <Route
                path="/events/event-quickglance"
                element={
                  <ErrorBoundary>
                    <EventQuickGlanceMainPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/events/event-attendees/:id"
                element={<CustomerDetailInEvent />}
              >
                {/* The tab strip is the page's navigation, so the bare consumer
                    URL has to land on a tab instead of rendering an empty
                    <Outlet/> under the stat tiles. */}
                <Route
                  index
                  element={<Navigate to="transactions-details" replace />}
                />
                <Route
                  path="transactions-details"
                  element={<TransactionsDetails />}
                />
                <Route path="documents" element={<ConsumerDocumentsDetails />} />
                <Route path="payment-confirmed" element={<Confirmation />} />
                <Route
                  path="payment-service-confirmation"
                  element={<ServicePaymentConfirmation />}
                />
                <Route path="collect-lost-fee/cash-method" element={<Cash />} />
                <Route
                  path="collect-lost-fee/credit-card-method"
                  element={<CreditCard />}
                />
              </Route>

              <Route
                path="/event/new_subscription"
                element={<NewEventSubscription />}
              />
              <Route
                path="create-event-page"
                element={<MainPageEventCreation />}
              >
                <Route path="event-detail" element={<FormEventDetail />} />
                <Route path="staff-detail" element={<FormStaffDetail />} />
                <Route
                  path="document-detail"
                  element={<FormDocumentDetail />}
                />
                <Route path="device-detail" element={<FormDeviceDetail />} />
                <Route
                  path="review-submit"
                  element={<ReviewAndSubmitEvent />}
                />
              </Route>
              <Route path="/device-quick-glance" element={<DeviceDetail />} />
              {/* Global inventory views — restricted to inventory:read roles
                  (root_admin, admin, sale_manager, inventory_manager).
                  event_manager / assistant are blocked here; they only see
                  location-scoped inventory inside the assignment flows
                  (events / consumers / member) to know what to assign. */}
              <Route element={<PermissionGuard action="inventory:read" />}>
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/location" element={<MainPage />} />
                <Route path="/inventory/group" element={<MainPageGrouping />} />
                <Route
                  path="/inventory/category_name"
                  element={<MainPageCategory />}
                />
                <Route path="/inventory/brand" element={<MainPageBrand />} />
                <Route
                  path="/inventory/ownership"
                  element={<MainPageOwnership />}
                />
                {/* <Route path="/inventory/warehouse" element={<MainPageWarehouse />} /> */}
                <Route path="/inventory/:id" element={<InventoryDetail />} />
                <Route
                  path="/inventory/inventory-in-use"
                  element={<InventoryInUsePage />}
                />
                <Route
                  path="/inventory/advance_search_result"
                  element={<AdvanceSearchResultPage />}
                />
              </Route>
              {/* Event-creation inventory selection — part of the events flow. */}
              <Route
                path="/inventory/event-inventory"
                element={<InventoryEvent />}
              />
              <Route element={<PermissionGuard action="inventory:create" />}>
                <Route path="/inventory/new-item" element={<AddNewItem />} />
                <Route path="/inventory/edit-group" element={<EditGroup />} />
                <Route
                  path="/inventory/new-bulk-items"
                  element={<AddNewBulkItems />}
                />
              </Route>
              <Route element={<IndustryTabGuard tab="consumers" />}>
              <Route element={<PermissionGuard action="nav:consumers" />}>
                <Route path="/consumers" element={<ConsumersMainPage />} />
                <Route path="/consumers/:id" element={<ConsumerDetail />} />
                <Route
                  path="/consumers/:id/payment-confirmation"
                  element={<AuthorizedDeposit />}
                />
                <Route
                  path="/consumers/:id/lost-device-fee/cash"
                  element={<ConsumerDeviceLostFeeCash />}
                />
                <Route
                  path="/consumers/:id/lost-device-fee/credit_card"
                  element={<ConsumerDeviceLostFeeCreditCard />}
                />
                <Route
                  path="/consumers/:id/charge-all-lost-devices/cash"
                  element={<ChargeAllListDeviceCash />}
                />
                <Route
                  path="/consumers/:id/charge-all-lost-devices/credit_card"
                  element={<ChargeAllListDeviceCreditCard />}
                />
              </Route>
              </Route>
              {/* Staff directory + detail — admin-level only (nav:staff), same
                  gate the navbar/footer/command palette use. PermissionGuard
                  redirects unauthorized deep links to home. */}
              <Route element={<PermissionGuard action="nav:staff" />}>
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/:id" element={<StaffDetail />}>
                {/* The profile's own content (devices, events) is part of
                    StaffDetail now, so /main renders nothing extra — it stays
                    registered because every action route navigates back to it. */}
                <Route key={"/staff/:id/main"} path="main" element={null} />
                <Route
                  key={"/staff/:id/update-contact-info"}
                  path="update-contact-info"
                  element={<UpdateContactInfo />}
                />
                <Route
                  key={"/staff/:id/reset-password-link"}
                  path="reset-password-link"
                  element={<ForgetPasswordLinkFromStaffPage />}
                />
                <Route element={<PermissionGuard action="staff:assign_devices" />}>
                  <Route
                    key={"/staff/:id/assignment"}
                    path="assignment"
                    element={<Assignment />}
                  />
                  <Route
                    key={"/staff/:id/assign-staff-events"}
                    path="assign-staff-events"
                    element={<AssignStaffMemberToEvent />}
                  />
                  <Route
                    key={"/staff/:id/assign-location-manager"}
                    path="assign-location-manager"
                    element={<AssignLocationManager />}
                  />
                </Route>
                <Route element={<PermissionGuard action="staff:change_role" />}>
                  <Route
                    key={"/staff/:id/update-role-company"}
                    path="update-role-company"
                    element={<UpdateRoleInCompany />}
                  />
                </Route>
                <Route
                  key={"/staff/:id/view_actions_staff_taken"}
                  path="view_actions_staff_taken"
                  element={<SignedContractViewHigherPermissionLevel />}
                />
              </Route>
              </Route>
              <Route path="/profile" element={<MainProfileSetting />}>
                <Route path="my_details" element={<MyDetailsMainPage />} />
                <Route path="password" element={<PasswordMainPage />} />
                <Route path="mfa-setup" element={<MfaSetup />} />
                <Route
                  path="notifications"
                  element={<NotificationsMainPage />}
                />
                <Route path="billing" element={<BillingMainPage />} />
                <Route element={<PermissionGuard action="staff:read" />}>
                  <Route
                    path="staff-activity"
                    element={<StaffActivityMainPage />}
                  />
                </Route>
                <Route path="company-info" element={<CompanyInfo />} />
                <Route element={<PermissionGuard action="profile:company_settings" />}>
                  <Route path="email-branding" element={<EmailBrandingSettings />} />
                </Route>
                <Route element={<PermissionGuard action="member:update" />}>
                  <Route path="school-compliance" element={<SchoolComplianceSettings />} />
                </Route>
                <Route element={<PermissionGuard action="staff:assign_role" />}>
                  <Route path="roles" element={<RolesManagementMainPage />} />
                </Route>
                <Route
                  path="stripe_connected_account"
                  element={<Dashboard />}
                />
                <Route path="documents" element={<Documents />} />
                <Route path="documents/view/:id" element={<ViewDocument />} />
                <Route path="providers" element={<Providers />} />
                <Route
                  path="/profile/documents/edit/:id"
                  element={<EditDocument />}
                />
                <Route
                  path="platform_policies"
                  element={<PlatformPolicies />}
                />
                {/* Platform observability (job queue stats/lookup) — gated on
                    the employee-level super_user flag, not a roleType, so it
                    can't use PermissionGuard's action matrix. See
                    FRONTEND_task_queue_changes.md §8.2. */}
                <Route element={<SuperUserGuard />}>
                  <Route
                    path="system-jobs"
                    element={<SystemJobsMainPage />}
                  />
                </Route>
              </Route>
              <Route
                path="search-result-page"
                element={
                  <ErrorBoundary>
                    <SearchResultPage />
                  </ErrorBoundary>
                }
              />
              {/* subscription-company (PricingTable) route intentionally
                  removed — the pricing UI is a non-functional shell
                  (placeholder copy, dead buttons); no in-app link points to
                  it. Restore once a real subscription flow ships. */}
              <Route
                path="confirm-subscription"
                element={<ConfirmSubscription />}
              />

              <Route path="posts" element={<MainPagePosts />} />
              <Route path="posts/new-post" element={<NewPost />} />
              <Route path="posts/post-edit/:id" element={<EditPost />} />
              <Route path="posts/post/:id" element={<DisplayArticle />} />
              <Route path="login" element={<RedirectionPage />} />
              <Route path="/my-devices" element={<MyDevicesPortal />} />
              <Route path="/attendance-confirmation" element={<AttendanceConfirmationLanding />} />
              <Route element={<PermissionGuard action="nav:members" />}>
                <Route path="members" element={<ConditionalMainPage />} />
                <Route path="/member/:id" element={<MemberDetailsMainPage />}>
                  <Route
                    key={"/member/:id/main"}
                    path="main"
                    element={<DetailMemberInfo />}
                  />
                  <Route
                    key={"/member/:id/update-member-information"}
                    path="update-member-information"
                    element={<UpdateMemberInformation />}
                  />
                  <Route
                    key={"/member/:id/reminders"}
                    path="reminders"
                    element={<Reminders />}
                  />
                  <Route
                    key={"/member/:id/assignment"}
                    path="assignment"
                    element={<AssignmentDeviceMembers />}
                  />
                </Route>
              </Route>
              <Route
                path="register/company-setup"
                element={<RedirectionPage />}
              />
              <Route
                path="/refresh"
                element={
                  <UpdatingCompanyInfoAfterStripeConnectedAccountCreated />
                }
              />
              <Route
                path="/reauth"
                element={
                  <UpdatingCompanyInfoAfterStripeConnectedAccountCreated />
                }
              />
              <Route
                path="/return"
                element={
                  <UpdatingCompanyInfoAfterStripeConnectedAccountCreated />
                }
              />
              <Route
                path="/display-contracts"
                element={<LandingPageForDownloadableDocuments />}
              />
              {/* Not permission-guarded: this is the same receipt the payer was
                  already handed, reached by scanning it. Guarding it would break
                  the scan for the staff who print receipts. */}
              <Route path="/receipt" element={<ReceiptPage />} />
              <Route path="/status" element={<ServiceStatusPage />} />
              <Route path="/*" element={<ErrorPage />} />
            </Route>
            </Routes>
          </ErrorBoundary>
        </div>
      </Suspense>
      {/* Pinned to the right edge at half height, on every page but the manual
          itself. Not lazy: chrome that appears a chunk-fetch later reads as a
          layout glitch. */}
      <HelpLauncher />
      {/* full-bleed footer, pinned to the viewport bottom (flex column + auto margin) */}
      <div style={{ width: "100%", marginTop: "auto" }}>
        <FooterComponent full ref={navbarRef} />
      </div>
    </div>
  );
};

export default AuthRoutes;
