import { Divider, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Card } from "antd";
import { groupBy } from "lodash";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { hasPermission, resolveRoleType } from "../../../../../config/roles";
import { devitrakApi } from "../../../../../api/devitrakApi";
import DevitrakLoading from "../../../../../components/animation/DevitrakLoading";
import { BellIcon } from "../../../../../components/icons/BellIcon";
import { EmailIcon } from "../../../../../components/icons/EmailIcon";
import LinkIcon from "../../../../../components/icons/LinkIcon";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { CreateNewConsumer } from "../../../../consumers/utils/CreateNewUser";
import FeedbackModal from "../FeedbackModal";
const EmailNotification = lazy(() =>
  import("../../../../../components/notification/email/EmailNotification")
);
const PushNotificationModal = lazy(() =>
  import("../notification/PushNotificationModal")
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
  const [sendPushNotificationModal, setSendPushNotificationModal] =
    useState(false);
  const [feedbackEventModal, setFeedbackEventModal] = useState(false);

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
      icon: (
        <WhiteCirclePlusIcon
          stroke="#344054"
          hoverStroke="var(--basewhite)"
          width={21}
          height={18}
        />
      ),
      text: "Add new consumer",
      disableStatus: !event.active,
      fn: () => setCreateUserButton(true),
    },
    {
      icon: (
        <EmailIcon
          fill="#344054"
          hoverFill="var(--basewhite)"
          width={21}
          height={18}
        />
      ),
      text: "Email Notifications to Attendees",
      disableStatus: !event.active,
      fn: () => setCustomizedEmailNotificationModal(true),
    },
    {
      icon: (
        <LinkIcon
          fill="#344054"
          stroke="#344054"
          hoverFill="var(--basewhite)"
          hoverStroke={"var(--basewhite)"}
          width={25}
          // height={20}
        />
      ),
      text: "Send event link.",
      disableStatus: !event.active,
      fn: () => setSendEventLink(true),
    },
    // Push notifications are an additional channel alongside email above —
    // not a replacement. Only shown to roles allowed to notify this event.
    ...(hasPermission("event:notify_push", resolveRoleType(user))
      ? [
          {
            icon: (
              <BellIcon
                fill="#344054"
                hoverFill="var(--basewhite)"
                width={21}
                height={18}
              />
            ),
            text: "Push Notifications to Attendees",
            disableStatus: !event.active,
            fn: () => setSendPushNotificationModal(true),
          },
        ]
      : []),
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
      return ["root_admin", "admin"].includes(resolveRoleType(user));
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
          <DevitrakLoading />
        </div>
      }
    >
      <Card
        style={{
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #EAECF0)",
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
            padding: "16px",
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
                <GrayButtonComponent
                  icon={item.icon}
                  disabled={item.disableStatus}
                  func={() => item.fn()}
                  title={item.text}
                  styles={{ width: "100%" }}
                  titleStyles={{
                    textTransform: "none",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                />
              </Grid>
            );
          })}
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <SpreadSheet />
          </Grid>
          {event.active && checkUserIsAssignedAsAdminInEvent() && (
            <>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Divider style={{ margin: "8px 0" }} />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <EndEventButton />
              </Grid>
            </>
          )}
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
      {sendPushNotificationModal && (
        <PushNotificationModal
          sendPushNotificationModal={sendPushNotificationModal}
          setSendPushNotificationModal={setSendPushNotificationModal}
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
      {feedbackEventModal && (
        <FeedbackModal
          feedbackEventModal={feedbackEventModal}
          setFeedbackEventModal={setFeedbackEventModal}
        />
      )}
    </Suspense>
  );
};

export default ButtonSections;
