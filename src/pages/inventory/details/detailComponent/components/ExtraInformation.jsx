import { Chip, Grid, Typography } from "@mui/material";
import { Button, Card } from "antd";
import { useState } from "react";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { TextFontSize14LineHeight20 } from "../../../../../styles/global/TextFontSize14LineHeight20";
import ContainerContent from "./ContainerContent";
const ExtraInformation = ({ dataFound, containerInfo }) => {
  const [openModal, setOpenModal] = useState(false);
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
          <Grid
            display={"flex"}
            justifyContent={"space-around"}
            alignItems={"center"}
            container
          >
            <Grid
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography style={TextFontSize14LineHeight20}>
                Items in container
              </Typography>
              <Button
                onClick={() => setOpenModal(true)}
                style={{ ...BlueButton }}
              >
                <Typography style={{ ...BlueButtonText, ...CenteringGrid }}>
                  Add/Update
                </Typography>
              </Button>
            </Grid>
          </Grid>
          <Grid container>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              gap={1}
              item
              xs={122}
            >
              {/* <Typography style={TextFontSize30LineHeight38}> */}
              {dataFound?.container_items?.map((item) => (
                <Chip key={item.item_id} label={item.serial_number} />
              ))}
              {/* </Typography> */}
            </Grid>
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
