import { Button, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { BluePlusIcon, WhitePlusIcon } from "../../components/icons/Icons";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { BlueButton } from "../../styles/global/BlueButton";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { Subtitle } from "../../styles/global/Subtitle";
import { Divider } from "antd";
import { default as InventoryMainPage } from "./inventory/MainPage";
import { default as ActiveEventMainPage } from "./events/MainPage";
import { GrayButton } from "../../styles/global/GrayButton";
import GrayButtonText from "../../styles/global/GrayButtonText";
import BannerNotificationTemplate from "../../components/notification/alerts/BannerNotificationTemplate";
import { useCallback, useEffect, useState } from "react";
import { devitrakApi } from "../../api/devitrakApi";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { onAddSubscriptionRecord } from "../../store/slices/subscriptionSlice";
import BannerMsg from "./utils/bannerMsg";
// import SelectCompanyToView from "./components/selectCompany/SelectCompanyToView"
const MainPage = () => {
  const [inventory, setInventory] = useState([]);
  const [notificationStatus, setNotificationStatus] = useState(
    inventory.length === 0
  );
  const { user } = useSelector((state) => state.admin);
  const companiesCheck = useQuery({
    queryKey: ["companiesList"],
    queryFn: () => devitrakApi.post("/company/companies"),
    refetchOnMount: false,
  });
  const dispatch = useDispatch();
  const inventoryQuery = useQuery({
    queryKey: ["itemsList"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });
  const totalConsumers = useCallback(async () => {
    if (inventoryQuery.data) {
      return setInventory(inventoryQuery.data.data.items);
    }
  }, []);

  const subscriptionPerCompanyQuery = useQuery({
    queryKey: ["checkingSubscriptionPerCompanyQuery"],
    queryFn: () =>
      devitrakApi.post("/subscription/search_subscription", {
        company: user.company,
      }),
    refetchOnMount: false,
  });

  const checkForActiveSubscriptionPerCompany = useCallback(() => {
    const checkSubscriptionQuery = subscriptionPerCompanyQuery?.data?.data;
    if (checkSubscriptionQuery?.ok) {
      return dispatch(
        onAddSubscriptionRecord(checkSubscriptionQuery.subscription)
      );
    }
    return dispatch(onAddSubscriptionRecord([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionPerCompanyQuery.data]);
  checkForActiveSubscriptionPerCompany();
  useEffect(() => {
    const controller = new AbortController();
    inventoryQuery.refetch();
    companiesCheck.refetch();
    subscriptionPerCompanyQuery.refetch();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    notificationStatus,
    // inventoryQuery.data,
    // inventoryQuery.isLoading,
    // inventory.length,
    user.company,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    totalConsumers();
    return () => {
      controller.abort();
    };
  }, [inventoryQuery.data, inventoryQuery.isLoading]);

  const checkUserAssignedCompanies = () => {
    const result = new Set();
    if (companiesCheck.data) {
      const grouping = companiesCheck.data.data.company;
      for (let company of grouping) {
        for (let data of company.employees) {
          if (data.user === user.email) {
            result.add({ user: data, companyInfo: company });
          }
        }
      }
    }
    return Array.from(result);
  };
  checkUserAssignedCompanies();
  return (
    <Grid
      alignSelf={"flex-start"}
      style={{
        padding: "5px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
      {notificationStatus && (
        <Grid
          style={{ display: `${inventory.length > 0 && "none"}` }}
          margin={"0.5rem 0 1rem"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <BannerNotificationTemplate
            setNotificationStatus={setNotificationStatus}
            title={"Welcome to Devitrak!"}
            body={
              "Explore the sections in the top navigation menu to get acquainted with the app and how it can best meet your needs. The search bar will is the easiest way to find any records, including user profiles, transactions, devices, etc. You can also update your settings by clicking the cogwheel button on the right of the search bar."
            }
          />
        </Grid>
      )}
      <Grid
        sx={{ display: { xs: "flex", sm: "flex", md: "flex", lg: "flex" } }}
        textAlign={"center"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        item
        xs={12}
        sm={12}
        md={7}
        lg={7}
      >
        <Typography
          style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}
        >
          Home
        </Typography>
      </Grid>
      <Grid
        sx={{ display: { xs: "flex", sm: "flex", md: "flex", lg: "flex" } }}
        textAlign={"center"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        gap={1}
        item
        xs={12}
        sm={12}
        md={5}
        lg={5}
      >
        <Link
          style={{
            width: "fit-content",
          }}
          to="/inventory/new-item"
        >
          <Button style={BlueButton}>
            <WhitePlusIcon />
            <Typography textTransform={"none"} style={BlueButtonText}>
              Add to inventory
            </Typography>
          </Button>
        </Link>
        <Link
          style={{
            width: "fit-content",
          }}
          to="/event/new_subscription"
        >
          <Button style={GrayButton}>
            <BluePlusIcon />
            <Typography textTransform={"none"} style={GrayButtonText}>
              Create new event
            </Typography>
          </Button>
        </Link>
      </Grid>
      <Grid
        textAlign={"right"}
        flexDirection={"column"}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Typography
          style={{
            ...TextFontSize20LineHeight30,
            textAlign: "left",
            width: "100%",
          }}
        >
          Quick glance
        </Typography>
        <Typography style={{ ...Subtitle, textAlign: "left", width: "100%" }}>
          Some general stats of your devices.
        </Typography>
      </Grid>
      <Divider />
      {inventoryQuery?.data?.data?.items.length > 0 ? (
        <>
          <Grid
            textAlign={"right"}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            gap={1}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <InventoryMainPage />
          </Grid>
          <Grid
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            marginTop={5}
            container
          >
            <Grid
              textAlign={"right"}
              flexDirection={"column"}
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              gap={1}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <Typography
                style={{
                  ...TextFontSize20LineHeight30,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                Upcoming and active events
              </Typography>
              <Typography
                style={{ ...Subtitle, textAlign: "left", width: "100%" }}
              >
                Select the event for which you want to view the metrics. To view
                all past events, go to &quot;Events&quot; section.
              </Typography>
              <Divider style={{ color: "transparent" }} />
            </Grid>
            <Grid
              textAlign={"right"}
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              gap={1}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <ActiveEventMainPage />
            </Grid>
          </Grid>
        </>
      ) : (
        <Grid
          textAlign={"right"}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={1}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <BannerMsg
            props={{
              title: "Add to your inventory",
              message:
                "Creating an event will let you assign and manage devices, as well as staff to an event with a start and end date. You will also be able to assign devices to consumers, collect retain deposits, collect fees for damaged devices, and keep track of your full inventory.",
              link: "/inventory/new-item",
              button: BlueButton,
              paragraphStyle: BlueButtonText,
              paragraphText: "Add to inventory",
            }}
          />
          <BannerMsg
            props={{
              title: "Create your first event",
              message:
                "Creating an event will let you assign and manage devices, as well as staff to an event with a start and end date. You will also be able to assign devices to consumers, collect retain deposits, collect fees for damaged devices, and keep track of your full inventory.",
              link: "/event/new_subscription",
              button: GrayButton,
              paragraphStyle: GrayButtonText,
              paragraphText: "Create new event",
            }}
          />
        </Grid>
      )}{" "}
    </Grid>
  );
};

export default MainPage;
