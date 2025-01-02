import { Chip, Grid, Typography } from "@mui/material";
import { Button, Card, message, Popconfirm, Space } from "antd";
import { useState } from "react";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { TextFontSize14LineHeight20 } from "../../../../../styles/global/TextFontSize14LineHeight20";
import ContainerContent from "./ContainerContent";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { DangerButton } from "../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useQueryClient } from "@tanstack/react-query";
const ExtraInformation = ({ dataFound, containerInfo }) => {
  const [openModal, setOpenModal] = useState(false);
  const queryClient = useQueryClient();
  const handleContainerItemsRemoval = async () => {
    try {
      const response = await devitrakApi.post(
        `/db_company/update-content-in-container`,
        {
          item_id: dataFound.item_id,
          container_items: JSON.stringify([]),
          ref: JSON.stringify(containerInfo?.container_items),
        }
      );
      if (response.data) message.success("Case was successfully emptied");
      queryClient.invalidateQueries({
        queryKey: ["infoItemSql"],
      });
      queryClient.invalidateQueries({
        queryKey: ["trackingItemActivity"],
      });
      return setOpenModal(false);
    } catch (error) {
      message.error("Something went wrong");
    }
  };

  return (
    <>
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
            <div
              id="container-items"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography style={TextFontSize14LineHeight20}>
                Items in container
              </Typography>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "5px",
                }}
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
              </div>
            </div>
          </Grid>
          <Grid container>
            <Space size={[8, 16]} wrap style={{ margin: "10px 0" }}>
              {dataFound?.container_items?.map((item) => (
                <Chip
                  key={item.item_id}
                  label={item.serial_number}
                  style={Subtitle}
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
        />
      )}
    </>
  );
};

export default ExtraInformation;
