import { Button, Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Card } from "antd";
import _ from 'lodash';
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { EmailIcon, PrinterIcon } from "../../../../../components/icons/Icons";
import EmailNotification from "../../../../../components/notification/email/EmailNotification";

const ButtonSections = () => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [
    customizedEmailNotificationModal,
    setCustomizedEmailNotificationModal,
  ] = useState(false);
  const listOfInventoryQuery = useQuery({
    queryKey: ["listOfInventory"],
    queryFn: () => devitrakApi.get("/inventory/list-inventories"),
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

  const options = [{
    icon: <PrinterIcon />,
    text: 'Print All Serial Numbers',
    condition: true
  }, {
    icon: <EmailIcon />,
    text: 'Email Notifications to Attendees',
    condition: true
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
        bodyStyle={{
          display: "flex",
          justifyContent: "center",
          alignSelf: "stretch",
          padding:"0 0 0px 10px"
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
                  xs={12}
                >
                  <Button
                    disabled
                    onClick={() => item.text === "Download all serial numbers" ? navigate('/page-to-print') : setCustomizedEmailNotificationModal(true)}
                    style={{
                      width: "100%",
                      border: "1px solid var(--gray-300, #D0D5DD)",
                      borderRadius: "8px",
                      background: "var(--base-white, #FFF)",
                      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    }}
                  >
                    {" "}
                    <Typography
                      textTransform={"none"}
                      textAlign={"left"}
                      fontFamily={"Inter"}
                      fontSize={"18px"}
                      fontStyle={"normal"}
                      fontWeight={400}
                      lineHeight={"28px"}
                      color={"var(--gray-900, #101828)"}
                    >
                      {item.icon}
                      &nbsp;{item.text}
                    </Typography>
                  </Button>
                </Grid>
              )
            })
          }
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