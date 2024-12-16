import { Button, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Card } from "antd";
import { groupBy } from "lodash";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import { EmailIcon } from "../../../../../components/icons/EmailIcon";
import LinkIcon from "../../../../../components/icons/LinkIcon";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { CreateNewConsumer } from "../../../../consumers/utils/CreateNewUser";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
const EmailNotification = lazy(() =>
  import("../../../../../components/notification/email/EmailNotification")
);
const SpreadSheet = lazy(() => import("../SpreadSheet"));
const EndEventButton = lazy(() => import("./EndEventButton"));
const SendEventLinkModal = lazy(() =>
  import("../../../../../components/notification/email/EventLinkNotification")
);
const ButtonSections = () => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [sendEventLink, setSendEventLink] = useState(false);
  const [createUserButton, setCreateUserButton] = useState(false);
  const [
    customizedEmailNotificationModal,
    setCustomizedEmailNotificationModal,
  ] = useState(false);
  const listOfInventoryQuery = useQuery({
    queryKey: ["listOfInventory"],
    queryFn: () =>
      devitrakApi.get("/inventory/list-inventories", {
        company: user.companyData.company_name,
      }),
    refetchOnMount: false,
  });
  const listOfItemsInInventoryQuery = useQuery({
    queryKey: ["listOfItemsInInventory"],
    queryFn: () =>
      devitrakApi.get("/item/list-items", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }),
  });
  const ItemsInPoolQuery = useQuery({
    queryKey: ["listOfItemsInInventory"],
    queryFn: () =>
      devitrakApi.post("/item/list-items", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }),
  });

  useEffect(() => {
    const controller = new AbortController();
    listOfInventoryQuery.refetch();
    listOfItemsInInventoryQuery.refetch();
    ItemsInPoolQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const options = [
    {
      icon: <WhiteCirclePlusIcon/>,
      text: "Add new consumer",
      disableStatus: !event.active,
      fn: () => setCreateUserButton(true),
    },
    {
      icon: <EmailIcon />,
      text: "Email Notifications to Attendees",
      disableStatus: !event.active,
      fn: () => setCustomizedEmailNotificationModal(true),
    },
    {
      icon: <LinkIcon />,
      text: "Send event link.",
      disableStatus: !event.active,
      fn: () => setSendEventLink(true),
    },
  ];

  const groupingByCompany = groupBy(
    listOfInventoryQuery?.data?.data?.listOfItems,
    "company"
  );

  const findInventoryStored = () => {
    if (groupingByCompany[user.company]) {
      const groupingByEvent = groupBy(groupingByCompany[user.company], "event");
      if (groupingByEvent[event.eventInfoDetail.eventName]) {
        return groupingByEvent[event.eventInfoDetail.eventName];
      }
    }
    return [];
  };
  findInventoryStored();

  const findItemsInPoolEvent = () => {
    const listOfItemsInPoolQuery =
      ItemsInPoolQuery?.data?.data?.receiversInventory;
    if (listOfItemsInPoolQuery?.length > 0) {
      return listOfItemsInPoolQuery;
    }
    return [];
  };
  findItemsInPoolEvent();

  const groupingItemsByCompany = groupBy(
    listOfItemsInInventoryQuery?.data?.data?.listOfItems,
    "company"
  );

  const itemsPerCompany = () => {
    if (groupingItemsByCompany[user.company]) {
      const groupingByGroup = groupBy(
        groupingItemsByCompany[user.company],
        "group"
      );
      return groupingByGroup;
    }
    return [];
  };
  itemsPerCompany();

  const checkItemsInUseToUpdateInventory = () => {
    const result = {};
    for (let data of findItemsInPoolEvent()) {
      if (data.activity || `${data.status}`.toLowerCase() === "lost") {
        if (!result[data.type]) {
          result[data.type] = 1;
        } else {
          result[data.type]++;
        }
      }
    }
    return Object.entries(result);
  };
  checkItemsInUseToUpdateInventory();
  const checkUserIsAssignedAsAdminInEvent = () => {
    const staffList = [...event.staff.adminUser];
    if (!staffList.some((element) => element.email === user.email)) {
      const companyEmployees = [...user.companyData.employees];
      const checkRoleInCompany = companyEmployees.findIndex(
        (element) => element.user === user.email
      );
      return companyEmployees[checkRoleInCompany].role < 2;
    }
    const check = staffList.findIndex(
      (element) => element.email === user.email
    );
    return check > -1;
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Card
        style={{
          borderRadius: "12px",
          border: "none",
          background: "var(--main-background-color)",
          boxShadow: "none",
          textAlign: "left",
          width: "100%",
          padding: 0,
        }}
        styles={{
          body: {
            display: "flex",
            justifyContent: "center",
            alignSelf: "stretch",
            padding: "0 0 0px 10px",
          },
        }}
      >
        <Grid
          display={"flex"}
          justifyContent={"space-around"}
          alignSelf={"stretch"}
          alignItems={"center"}
          container
        >
          {options.map((item) => {
            return (
              <Grid
                key={item.text}
                display={"flex"}
                justifyContent={"flex-start"}
                textAlign={"left"}
                alignItems={"center"}
                margin={"0 0 6px 0"}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <Button
                  disabled={item.disableStatus}
                  onClick={() => item.fn()}
                  style={
                    item.disableStatus
                      ? {
                          ...BlueButton,
                          width: "100%",
                          backgroundColor: "var(--disabled-blue-button)",
                          border: "transparent",
                        }
                      : { ...BlueButton, width: "100%" }
                  }
                >
                  {" "}
                  <p
                    style={
                      item.disableStatus
                        ? {
                            ...BlueButtonText,
                            color: "",
                            textTransform: "none",
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                          }
                        : {
                            ...BlueButtonText,
                            textTransform: "none",
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                          }
                    }
                  >
                    {!item.disableStatus && item.icon}
                    &nbsp;{item.text}
                  </p>
                </Button>
              </Grid>
            );
          })}
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <SpreadSheet />
          </Grid>
          {/* <Grid display={`${(!event.active && user.role !== 'Administrator') && "none"}`} item xs={12} sm={12} md={12} lg={12}> */}
          <Grid
            display={`${
              (!event.active ||
                (event.active && !checkUserIsAssignedAsAdminInEvent())) &&
              "none"
            }`}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <EndEventButton />
          </Grid>
        </Grid>
      </Card>
      {customizedEmailNotificationModal && (
        <EmailNotification
          customizedEmailNotificationModal={customizedEmailNotificationModal}
          setCustomizedEmailNotificationModal={
            setCustomizedEmailNotificationModal
          }
        />
      )}
      {sendEventLink && (
        <SendEventLinkModal
          sendEventLink={sendEventLink}
          setSendEventLink={setSendEventLink}
        />
      )}
      {createUserButton && (
        <CreateNewConsumer
          createUserButton={createUserButton}
          setCreateUserButton={setCreateUserButton}
        />
      )}
    </Suspense>
  );
};

export default ButtonSections;
