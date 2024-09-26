import { lazy, Suspense, useRef } from "react";
import { Route, Routes } from "react-router";
import Loading from "../../components/animation/Loading";
// import FooterComponent from "../../components/general/FooterComponent";
// import UpperBanner from "../../components/general/UpperBanner";
// import NavigationBarMain from "../../components/navbar/NavigationBarMain";
import CenteringGrid from "../../styles/global/CenteringGrid";

const FooterComponent = lazy(() =>
  import("../../components/general/FooterComponent")
);
const UpperBanner = lazy(() => import("../../components/general/UpperBanner"));
const NavigationBarMain = lazy(() =>
  import("../../components/navbar/NavigationBarMain")
);
const FormEventDetail = lazy(() =>
  import("../../pages/events/newEventProcess/eventDetails/Form")
);
const FormDeviceDetail = lazy(() =>
  import("../../pages/events/newEventProcess/inventory/Form")
);
const ReviewAndSubmitEvent = lazy(() =>
  import("../../pages/events/newEventProcess/review/ReviewAndSubmitPage")
);
const FormStaffDetail = lazy(() =>
  import("../../pages/events/newEventProcess/staff/Form")
);
const TransactionsDetails = lazy(() =>
  import(
    "../../pages/events/quickGlance/consumer/ConsumerDetail/details/TransactionsDetails"
  )
);
const Cash = lazy(() =>
  import("../../pages/events/quickGlance/consumer/lostFee/actions/Cash")
);
const CreditCard = lazy(() =>
  import("../../pages/events/quickGlance/consumer/lostFee/actions/CreditCard")
);
const AddNewItem = lazy(() =>
  import("../../pages/inventory/actions/AddNewItem")
);
const EditGroup = lazy(() => import("../../pages/inventory/actions/EditGroup"));
const AddNewBulkItems = lazy(() =>
  import("../../pages/inventory/actions/NewBulkItems")
);
const MainPageGrouping = lazy(() =>
  import("../../pages/inventory/details/GroupDetail/MainPage")
);
const MainPageBrand = lazy(() =>
  import("../../pages/inventory/details/BrandDetail/MainPage")
);
const MainPageCategory = lazy(() =>
  import("../../pages/inventory/details/categoryDetail/MainPage")
);
const MainPage = lazy(() =>
  import("../../pages/inventory/details/LocationDetail/MainPage")
);
const InventoryInUsePage = lazy(() =>
  import("../../pages/inventory/InventoryInUse/MainPage")
);
const ParentRenderingChildrenPage = lazy(() =>
  import("../../pages/ParentRenderingChildrenPage")
);
const Confirmation = lazy(() => import("../../pages/payment/Confirmation"));
const BillingMainPage = lazy(() =>
  import("../../pages/Profile/billing/BillingMainPage")
);
const MyDetailsMainPage = lazy(() =>
  import("../../pages/Profile/my_details/MyDetailsMainPage")
);
const PasswordMainPage = lazy(() =>
  import("../../pages/Profile/my_password/PasswordMainPage")
);
const NotificationsMainPage = lazy(() =>
  import("../../pages/Profile/notifications/NotificationsMainPage")
);
const StaffActivityMainPage = lazy(() =>
  import("../../pages/Profile/staff_activity/StaffActivityMainPage")
);
const Assignment = lazy(() =>
  import("../../pages/staff/detail/components/equipment_components/Assignment")
);
const UpdateContactInfo = lazy(() =>
  import(
    "../../pages/staff/detail/components/equipment_components/UpdateContactInfo"
  )
);
const TableStaffDetail = lazy(() =>
  import("../../pages/staff/detail/components/TableStaffDetail")
);
const StaffDetail = lazy(() => import("../../pages/staff/detail/StaffDetail"));
const ForgetPasswordLinkFromStaffPage = lazy(() =>
  import(
    "../../pages/staff/detail/components/equipment_components/ResetPasswordLink"
  )
);
const UpdateRoleInCompany = lazy(() =>
  import(
    "../../pages/staff/detail/components/equipment_components/UpdateRoleInCompany"
  )
);
const AssignStaffMemberToEvent = lazy(() =>
  import("../../pages/staff/detail/components/AssignStaffMemberToEvent")
);
const ConsumerDeviceLostFeeCash = lazy(() =>
  import("../../pages/consumers/components/markedLostOption/Cash")
);
const RedirectionPage = lazy(() =>
  import("../../components/utils/RedirectionPage")
);
const ConsumerDeviceLostFeeCreditCard = lazy(() =>
  import("../../pages/consumers/components/markedLostOption/CreditCard")
);
const CompanyInfo = lazy(() =>
  import("../../pages/Profile/company_info/MainPage")
);
const SubscriptionMainPage = lazy(() =>
  import("../../pages/subscription/MainPage")
);
const ConfirmSubscription = lazy(() =>
  import("../../components/stripe/payment/ConfirmSubscription")
);
const MainPageOwnership = lazy(() =>
  import("../../pages/inventory/details/OwnershipDetail/MainPage")
);

const Home = lazy(() => import("../../pages/home/MainPage"));
const SearchResultPage = lazy(() => import("../../pages/search/MainPage"));
const EventMainPage = lazy(() => import("../../pages/events/MainPage"));
const EventQuickGlanceMainPage = lazy(() =>
  import("../../pages/events/quickGlance/MainPageQuickGlance")
);
const CustomerDetailInEvent = lazy(() =>
  import("../../pages/events/quickGlance/consumer/CustomerDetail")
);
const NewEventSubscription = lazy(() =>
  import("../../pages/events/newEventProcess/subscription/Main")
);
const DeviceDetail = lazy(() =>
  import("../../pages/events/quickGlance/inventory/DeviceDetail")
);
const ConsumersMainPage = lazy(() => import("../../pages/consumers/MainPage"));
const ConsumerDetail = lazy(() =>
  import("../../pages/consumers/DetailPerConsumer")
);
const Inventory = lazy(() => import("../../pages/inventory/MainPage"));
const InventoryDetail = lazy(() =>
  import("../../pages/inventory/details/MainPage")
);
const InventoryEvent = lazy(() =>
  import("../../pages/inventory/details/deep_details_event_selected/MainPage")
);
const Staff = lazy(() => import("../../pages/staff/MainPage"));
const MainPageEventCreation = lazy(() =>
  import("../../pages/events/newEventProcess/MainPage")
);
const MainProfileSetting = lazy(() =>
  import("../../pages/Profile/MainProfileSettings")
);
const ErrorPage = lazy(() => import("../../pages/error/ErrorLandingPage"));
const AuthRoutes = () => {
  const navbarRef = useRef();
  return (
    <div style={{ width: "100%", margin: "auto" }}>
      <header ref={navbarRef} style={{ width: "100%", margin: "0 auto" }}>
        <UpperBanner />
        <NavigationBarMain />
      </header>
      <Suspense
        fallback={
          <div style={CenteringGrid}>
            <Loading />
          </div>
        }
      >
        <div
          style={{ minWidth: "768px", maxWidth: "1228px", margin: "0 auto" }}
        >
          <Routes>
            <Route path="/" element={<ParentRenderingChildrenPage />}>
              <Route path="/" element={<Home />} />
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<EventMainPage />} />
              <Route
                path="/events/event-quickglance"
                element={<EventQuickGlanceMainPage />}
              />
              <Route
                path="/events/event-attendees/:id"
                element={<CustomerDetailInEvent />}
              >
                <Route
                  path="transactions-details"
                  element={<TransactionsDetails />}
                />
                <Route path="payment-confirmed" element={<Confirmation />} />
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
                <Route path="device-detail" element={<FormDeviceDetail />} />
                <Route
                  path="review-submit"
                  element={<ReviewAndSubmitEvent />}
                />
              </Route>
              <Route path="/device-quick-glance" element={<DeviceDetail />} />
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
                path="/inventory/event-inventory"
                element={<InventoryEvent />}
              />
              <Route path="/inventory/new-item" element={<AddNewItem />} />
              <Route path="/inventory/edit-group" element={<EditGroup />} />
              <Route
                path="/inventory/new-bulk-items"
                element={<AddNewBulkItems />}
              />
              <Route
                path="/inventory/inventory-in-use"
                element={<InventoryInUsePage />}
              />
              <Route path="/consumers" element={<ConsumersMainPage />} />
              <Route path="/consumers/:id" element={<ConsumerDetail />} />
              <Route
                path="/consumers/:id/lost-device-fee/cash"
                element={<ConsumerDeviceLostFeeCash />}
              />
              <Route
                path="/consumers/:id/lost-device-fee/credit_card"
                element={<ConsumerDeviceLostFeeCreditCard />}
              />

              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/:id" element={<StaffDetail />}>
                <Route
                  key={"/staff/:id/main"}
                  path="main"
                  element={<TableStaffDetail />}
                />
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
                <Route
                  key={"/staff/:id/assignment"}
                  path="assignment"
                  element={<Assignment />}
                />
                <Route
                  key={"/staff/:id/update-role-company"}
                  path="update-role-company"
                  element={<UpdateRoleInCompany />}
                />
                <Route
                  key={"/staff/:id/assign-staff-events"}
                  path="assign-staff-events"
                  element={<AssignStaffMemberToEvent />}
                />
              </Route>
              <Route path="/profile" element={<MainProfileSetting />}>
                <Route path="my_details" element={<MyDetailsMainPage />} />
                <Route path="password" element={<PasswordMainPage />} />
                <Route
                  path="notifications"
                  element={<NotificationsMainPage />}
                />
                <Route path="billing" element={<BillingMainPage />} />
                <Route
                  path="staff-activity"
                  element={<StaffActivityMainPage />}
                />
                <Route path="company-info" element={<CompanyInfo />} />
              </Route>
              <Route path="search-result-page" element={<SearchResultPage />} />
              <Route
                path="subscription-company"
                element={<SubscriptionMainPage />}
              />
              <Route
                path="confirm-subscription"
                element={<ConfirmSubscription />}
              />

              <Route path="login" element={<RedirectionPage />} />
              <Route
                path="register/company-setup"
                element={<RedirectionPage />}
              />
              <Route path="/*" element={<ErrorPage />} />
            </Route>
          </Routes>
        </div>
      </Suspense>
      <div
        style={{ minWidth: "768px", maxWidth: "1228px", margin: "0 auto 15px" }}
      >
        <FooterComponent />
      </div>
    </div>
  );
};

export default AuthRoutes;
