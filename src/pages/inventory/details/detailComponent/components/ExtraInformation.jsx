import { Grid, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, message, Popconfirm, Space } from "antd";
import { useEffect, useState } from "react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { DangerButton } from "../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize14LineHeight20 } from "../../../../../styles/global/TextFontSize14LineHeight20";
import Chip from "../../../../../components/UX/Chip/Chip";
import ContainerContent from "./ContainerContent";
const ExtraInformation = ({ dataFound, containerInfo }) => {
  const [openModal, setOpenModal] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const [containerItemsContent, setContainerItemsContent] = useState([]);
  const queryClient = useQueryClient();
  const handleContainerItemsRemoval = async () => {
    try {
      const response = await devitrakApi.delete(
        `/db_inventory/container/${containerInfo.item_id}`,
      );
      if (response.data) message.success("Case was successfully emptied");
      queryClient.invalidateQueries({
        queryKey: ["infoItemSql"],
      });
      queryClient.invalidateQueries({
        queryKey: ["trackingItemActivity"],
      });
      fetchContainerItems();
      return setOpenModal(false);
    } catch (error) {
      return message.error("Something went wrong: " + error.message);
    }
  };

  const fetchContainerItems = async () => {
    try {
      const response = await devitrakApi.get(
        `/db_inventory/container-items/${dataFound[0]?.item_id}`,
      );
      if (response.data) {
        setTrigger(trigger + 1);
        return setContainerItemsContent(response.data.container.items);
      }
    } catch (error) {
      if (error.response.status === 404) return setContainerItemsContent([]);
      return message.error("Something went wrong: " + error.message);
    }
  };

  useEffect(() => {
    if (containerInfo.container > 0) {
      fetchContainerItems();
    }
  }, [containerInfo.item_id, trigger < 2]);

  return (
    <Grid
      display={dataFound[0]?.container > 0 ? "flex" : "none"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      container
    >
      <Grid item xs={12} sm={12} md={12}>
        <Card
          style={{
            borderRadius: "12px",
            border: "1px solid var(--gray-200, #EAECF0)",
            background: "var(--base-white, #FFF)",
            boxShadow:
              "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
          }}
        >
          <Grid container>
            <Grid
              id="container-items"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                margin: "0 0 10px 0",
              }}
              item
              xs={12}
              sm={12}
              md={6}
              lg={6}
            >
              <Typography style={TextFontSize14LineHeight20}>
                Items in container (serial number) |{" "}
                {containerItemsContent?.length ?? 0}/
                {dataFound[0]?.containerSpotLimit} cap
              </Typography>
            </Grid>
            <Grid
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: {
                  xs: "flex-start",
                  sm: "flex-start",
                  md: "flex-end",
                  lg: "flex-end",
                },
                gap: "5px",
              }}
              item
              xs={12}
              sm={12}
              md={6}
              lg={6}
            >
              <Popconfirm
                title="Are you sure you want to remove all items inside this container?"
                onConfirm={() => handleContainerItemsRemoval()}
              >
                <Button style={{ ...DangerButton, margin: 0 }}>
                  <Typography style={{ ...DangerButtonText }}>
                    Empty case
                  </Typography>
                </Button>
              </Popconfirm>
              <Button
                onClick={() => setOpenModal(true)}
                style={{ ...BlueButton, margin: 0 }}
              >
                <Typography style={{ ...BlueButtonText, ...CenteringGrid }}>
                  Add/Update
                </Typography>
              </Button>
            </Grid>
          </Grid>
          <Grid container>
            <Space size={[8, 16]} wrap style={{ margin: "10px 0" }}>
              {containerItemsContent?.map((item) => (
                <Chip
                  key={item.item_id}
                  label={item.serial_number}
                  style={Subtitle}
                  variant="filled"
                  color="default"
                />
              ))}
            </Space>
          </Grid>
        </Card>
      </Grid>
      {openModal && (
        <ContainerContent
          openModal={openModal}
          setOpenModal={setOpenModal}
          data={dataFound}
          containerInfo={containerInfo}
          containerItemsContent={containerItemsContent}
          refetch={fetchContainerItems}
        />
      )}
    </Grid>
  );
};

export default ExtraInformation;
