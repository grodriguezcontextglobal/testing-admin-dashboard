import { lazy, Suspense, useRef } from "react";
import { Routes, Route } from "react-router";
import Loading from "../../components/animation/Loading";
import { Grid } from "@mui/material";
import NavigationBarMain from "../../components/navbar/NavigationBarMain";
import UpperBanner from "../../components/general/UpperBanner";
import { default as FormEventDetail } from '../../pages/events/newEventProcess/eventDetails/Form'
import { default as FormStaffDetail } from '../../pages/events/newEventProcess/staff/Form'
import { default as FormDeviceDetail } from '../../pages/events/newEventProcess/inventory/Form'
import ReviewAndSubmitEvent from "../../pages/events/newEventProcess/review/ReviewAndSubmitPage";
import AddNewItem from "../../pages/inventory/actions/AddNewItem";
import AddNewBulkItems from "../../pages/inventory/actions/NewBulkItems";
import { default as InventoryInUsePage } from "../../pages/inventory/InventoryInUse/MainPage";
import MyDetailsMainPage from "../../pages/Profile/my_details/MyDetailsMainPage";
import PasswordMainPage from "../../pages/Profile/my_password/PasswordMainPage";
import NotificationsMainPage from "../../pages/Profile/notifications/NotificationsMainPage";
import StaffActivityMainPage from "../../pages/Profile/staff_activity/StaffActivityMainPage";
import FooterComponent from "../../components/general/FooterComponent";
import Confirmation from "../../pages/payment/Confirmation";
import TransactionsDetails from "../../pages/events/quickGlance/consumer/ConsumerDetail/details/TransactionsDetails";
import Cash from "../../pages/events/quickGlance/consumer/lostFee/actions/Cash";
import CreditCard from "../../pages/events/quickGlance/consumer/lostFee/actions/CreditCard";
import ParentRenderingChildrenPage from "../../pages/ParentRenderingChildrenPage";
import CenteringGrid from "../../styles/global/CenteringGrid";
import StaffDetail from "../../pages/staff/detail/StaffDetail";
// import BillingMainPage from "../../pages/Profile/billing/BillingMainPage";
const AuthRoutes = () => {
    const Home = lazy(() => import("../../pages/home/MainPage"))
    const SearchResultPage = lazy(() => import("../../pages/search/MainPage"))
    const EventMainPage = lazy(() => import("../../pages/events/MainPage"))
    const EventQuickGlanceMainPage = lazy(() => import("../../pages/events/quickGlance/MainPageQuickGlance"))
    const CustomerDetailInEvent = lazy(() => import("../../pages/events/quickGlance/consumer/CustomerDetail"))
    const NewEventSubscription = lazy(() => import("../../pages/events/newEventProcess/subscription/Main"))
    const DeviceDetail = lazy(() => import('../../pages/events/quickGlance/inventory/DeviceDetail'))
    const ConsumersMainPage = lazy(() => import('../../pages/consumers/MainPage'))
    const ConsumerDetail = lazy(() => import('../../pages/consumers/DetailPerConsumer'))
    const Inventory = lazy(() => import('../../pages/inventory/MainPage'))
    const InventoryDetail = lazy(() => import('../../pages/inventory/details/MainPage'))
    const InventoryEvent = lazy(() => import('../../pages/inventory/details/deep_details_event_selected/MainPage'))
    const Staff = lazy(() => import('../../pages/staff/MainPage'))
    const MainPageEventCreation = lazy(() => import('../../pages/events/newEventProcess/MainPage'))
    const MainProfileSetting = lazy(() => import('../../pages/Profile/MainProfileSettings'))
    const ErrorPage = lazy(() => import("../../pages/error/ErrorLandingPage"))
    const navbarRef = useRef()

    return (
        <>
            <header ref={navbarRef}>
                <UpperBanner />
                <NavigationBarMain />
            </header>
            <Suspense fallback={<div style={CenteringGrid}><Loading /></div>}>
                <Routes>
                    <Route path="/" element={<ParentRenderingChildrenPage />} >
                        <Route path="/" element={<Home />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/events" element={<EventMainPage />} />
                        <Route path="/events/event-quickglance" element={<EventQuickGlanceMainPage />} />
                        <Route path="/events/event-attendees/:id" element={<CustomerDetailInEvent />}>
                            <Route path="transactions-details" element={<TransactionsDetails />} />
                            <Route path="payment-confirmed" element={<Confirmation />} />
                            <Route
                                path="collect-lost-fee/cash-method"
                                element={<Cash />}
                            />
                            <Route
                                path="collect-lost-fee/credit-card-method"
                                element={<CreditCard />}
                            />
                        </Route>

                        <Route path="/event/new_subscription" element={<NewEventSubscription />} />
                        <Route path="create-event-page" element={<MainPageEventCreation />}>
                            <Route path="event-detail" element={<FormEventDetail />} />
                            <Route path="staff-detail" element={<FormStaffDetail />} />
                            <Route path="device-detail" element={<FormDeviceDetail />} />
                            <Route path="review-submit" element={<ReviewAndSubmitEvent />} />
                        </Route>
                        <Route path="/device-quick-glance" element={<DeviceDetail />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/inventory/:id" element={<InventoryDetail />} />
                        <Route path="/inventory/event-inventory" element={<InventoryEvent />} />
                        <Route path="/inventory/new-item" element={<AddNewItem />} />
                        <Route path="/inventory/new-bulk-items" element={<AddNewBulkItems />} />
                        <Route path="/inventory/inventory-in-use" element={<InventoryInUsePage />} />
                        <Route path="/consumers" element={<ConsumersMainPage />} />
                        <Route path="/consumers/:id" element={<ConsumerDetail />} />
                        <Route path="/staff" element={<Staff />} />
                        <Route path="/staff/:id" element={<StaffDetail />} />
                        <Route path="/profile" element={<MainProfileSetting />}>
                            <Route path="my_details" element={<MyDetailsMainPage />} />
                            <Route path="password" element={<PasswordMainPage />} />
                            <Route path="notifications" element={<NotificationsMainPage />} />
                            {/* <Route path="billing" element={<BillingMainPage />} /> */}
                            <Route path="staff-activity" element={<StaffActivityMainPage />} />
                        </Route>
                        <Route path="search-result-page" element={<SearchResultPage />} />
                        <Route path="/*" element={<ErrorPage />} />
                    </Route>

                </Routes>
            </Suspense>
            <Grid container>
                <Grid margin={'0 0 2.5rem'} item xs={11} sm={11} md={12} lg={12}>
                    <FooterComponent />
                </Grid>
            </Grid>
        </>
    )
}

export default AuthRoutes