import { Button, Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Card } from "antd";
import _ from 'lodash';
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { EmailIcon, PrinterIcon } from "../../../../../components/icons/Icons";
import EmailNotification from "../../../../../components/notification/email/EmailNotification";
import SpreadSheet from "../SpreadSheet";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import EndEventButton from "./EndEventButton";

const ButtonSections = () => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [
    customizedEmailNotificationModal,
    setCustomizedEmailNotificationModal,
  ] = useState(false);
  const listOfInventoryQuery = useQuery({
    queryKey: ["listOfInventory"],
    queryFn: () => devitrakApi.get("/inventory/list-inventories", {
      company: user.company
    }),
    enabled: false,
    refetchOnMount: false
  });
  const listOfItemsInInventoryQuery = useQuery({
    queryKey: ["listOfItemsInInventory"],
    queryFn: () => devitrakApi.get("/item/list-items", {
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company
    }),
  });
  const ItemsInPoolQuery = useQuery({
    queryKey: ["listOfItemsInInventory"],
    queryFn: () => devitrakApi.post("/item/list-items", {
      eventSelected: event.eventInfoDetail.eventName,
      provider: event.company
    }),
  });
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController()
    listOfInventoryQuery.refetch()
    listOfItemsInInventoryQuery.refetch()
    ItemsInPoolQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [])

  const options = [{
    icon: <PrinterIcon />,
    text: 'Print All Serial Numbers',
    disableStatus: true,
    fn: () => navigate('/page-to-print')
  }, {
    icon: <EmailIcon />,
    text: 'Email Notifications to Attendees',
    disableStatus: !event.active,
    fn: () => setCustomizedEmailNotificationModal(true)
  }];


  const groupingByCompany = _.groupBy(
    listOfInventoryQuery?.data?.data?.listOfItems,
    "company"
  );

  const findInventoryStored = () => {
    if (groupingByCompany[user.company]) {
      const groupingByEvent = _.groupBy(
        groupingByCompany[user.company],
        "event"
      );
      if (groupingByEvent[event.eventInfoDetail.eventName]) {
        return groupingByEvent[event.eventInfoDetail.eventName];
      }
    }
    return [];
  };
  findInventoryStored();

  const findItemsInPoolEvent = () => {
    const listOfItemsInPoolQuery = ItemsInPoolQuery?.data?.data?.receiversInventory
    if (listOfItemsInPoolQuery?.length > 0) {
      return listOfItemsInPoolQuery;
    }
    return [];
  };
  findItemsInPoolEvent();

  const groupingItemsByCompany = _.groupBy(
    listOfItemsInInventoryQuery?.data?.data?.listOfItems,
    "company"
  );

  const itemsPerCompany = () => {
    if (groupingItemsByCompany[user.company]) {
      const groupingByGroup = _.groupBy(
        groupingItemsByCompany[user.company],
        "group"
      );
      return groupingByGroup
    }
    return [];
  };
  itemsPerCompany();

  const checkItemsInUseToUpdateInventory = () => {
    const result = {}
    for (let data of findItemsInPoolEvent()) {
      if (`${data.activity}`.toLocaleLowerCase() === "yes" || `${data.status}`.toLowerCase() === "lost") {
        if (!result[data.type]) {
          result[data.type] = 1
        } else {
          result[data.type]++
        }
      }
    }
    return Object.entries(result)
  }
  checkItemsInUseToUpdateInventory()
  return (
    <>
      <Card
        style={{
          borderRadius: "12px",
          border: "none",
          background: "var(--main-background-color)",
          boxShadow: "none",
          textAlign: "left",
          width: "100%",
          padding: 0
        }}
        styles={{
          body: {
            display: "flex",
            justifyContent: "center",
            alignSelf: "stretch",
            padding: "0 0 0px 10px"
          }
        }}
      >
        <Grid
          display={"flex"}
          justifyContent={"space-around"}
          alignSelf={"stretch"}
          alignItems={"center"}
          container
        >
          {
            options.map(item => {
              return (
                <Grid
                  key={item.text}
                  display={"flex"}
                  justifyContent={"flex-start"}
                  textAlign={"left"}
                  alignItems={"center"}
                  margin={'0 0 6px 0'}
                  item
                  xs={12} sm={12} md={12} lg={12}
                >
                  <Button
                    disabled={item.disableStatus}
                    onClick={() => item.fn()}
                    style={{ ...GrayButton, width: "100%" }}
                  >
                    {" "}
                    <Typography
                      textTransform={"none"}
                      textAlign={"left"}
                      style={item.disableStatus ? {...GrayButtonText, color:""} : GrayButtonText}
                    >
                      {!item.disableStatus && item.icon}
                      &nbsp;{item.text}
                    </Typography>
                  </Button>
                </Grid>
              )
            })
          }
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <SpreadSheet />
          </Grid>
          {/* <Grid display={`${(!event.active && user.role !== 'Administrator') && "none"}`} item xs={12} sm={12} md={12} lg={12}> */}
          <Grid display={`${(!event.active && Number(user.role) > 1) && "none"}`} item xs={12} sm={12} md={12} lg={12}>
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
    </>
  );
};

export default ButtonSections;