import { Button, Grid, Typography } from "@mui/material";
import { Divider } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { BluePlusIcon } from "../../components/icons/BluePlusIcon";
import { WhitePlusIcon } from "../../components/icons/WhitePlusIcon";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { Subtitle } from "../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
// import { default as InventoryMainPage } from "./inventory/MainPage";
// import { default as ActiveEventMainPage } from "./events/MainPage";
import { GrayButton } from "../../styles/global/GrayButton";
import GrayButtonText from "../../styles/global/GrayButtonText";
// import BannerNotificationTemplate from "../../components/notification/alerts/BannerNotificationTemplate";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { Title } from "../../styles/global/Title";
const BannerMsg = lazy(() => import("./utils/bannerMsg"));
const InventoryMainPage = lazy(() => import("./inventory/MainPage"));
const ActiveEventMainPage = lazy(() => import("./events/MainPage"));
const BannerNotificationTemplate = lazy(() =>
  import("../../components/notification/alerts/BannerNotificationTemplate")
);

const MainPage = () => {
  const [inventory, setInventory] = useState([]);
  const [notificationStatus, setNotificationStatus] = useState(false);
  const [
    leasedEquipmentNotificationStatus,
    setLeasedEquipmentNotificationStatus,
  ] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const companiesCheck = useQuery({
    queryKey: ["companiesList"],
    queryFn: () =>
      devitrakApi.post(`/company/search-company`, {
        _id: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  const inventoryQuery = useQuery({
    queryKey: ["itemsList"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });
  const totalConsumers = async () => {
    if (inventoryQuery.data) {
      setNotificationStatus(inventoryQuery.data.data.items.length < 1);
      return setInventory(inventoryQuery.data.data.items);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    inventoryQuery.refetch();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    totalConsumers();
    return () => {
      controller.abort();
    };
  }, [inventoryQuery.data]);

  const displayingLeasedInventory = () => {
    const checking = inventory.filter(
      (item) =>
        String(item.ownership).toLowerCase() === "rent" &&
        new Date(`${item.return_date}`).getTime() < new Date().getTime()
    );
    return setLeasedEquipmentNotificationStatus(checking.length > 0);
  };

  useEffect(() => {
    const controller = new AbortController();
    displayingLeasedInventory();
    return () => {
      controller.abort();
    };
  }, [inventory.length > 0]);

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

  const leasedEquipmentNotificationBody = () => {
    return (
      <p>
        Please be aware that there is&nbsp;
        <button
          onClick={() => navigate("/inventory/ownership?Rent&search=")}
          style={{
            outline: "none",
            backgroundColor: "transparent",
            margin: 0,
            padding: 0,
            textDecoration: "underline",
            color: Subtitle.color,
            fontWeight: 500,
          }}
        >
          leased equipment pending return.
        </button>{" "}
        Kindly visit the inventory section to view the list of leased items and
        their return dates to prevent any inconvenience.
      </p>
    );
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
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
        {leasedEquipmentNotificationStatus && (
          <Grid
            style={{ display: "flex" }}
            margin={"0.5rem 0 1rem"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <BannerNotificationTemplate
              category={1}
              setNotificationStatus={setLeasedEquipmentNotificationStatus}
              title={"Reminder from Devitrak!"}
              body={leasedEquipmentNotificationBody()}
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
          {/* /event/new_subscription */}
          <Link
            to="/create-event-page/event-detail"
            style={{
              width: "fit-content",
            }}
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
                  Select the event for which you want to view the metrics. To
                  view all past events, go to &quot;Events&quot; section.
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
                titleStyle: {
                  ...Title,
                  textAlign: "center",
                },
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
                titleStyle: {
                  ...Title,
                  textAlign: "center",
                },
                message:
                  "Creating an event will let you assign and manage devices, as well as staff to an event with a start and end date. You will also be able to assign devices to consumers, collect retain deposits, collect fees for damaged devices, and keep track of your full inventory.",
                link: "/create-event-page/event-detail",
                button: GrayButton,
                paragraphStyle: GrayButtonText,
                paragraphText: "Create new event",
              }}
            />
          </Grid>
        )}{" "}
      </Grid>
    </Suspense>
  );
};

export default MainPage;
