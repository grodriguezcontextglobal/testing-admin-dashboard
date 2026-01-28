import { Grid, Typography } from "@mui/material";
import { lazy, Suspense, useState } from "react";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Drawer, Spin } from "antd";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { useStaffRoleAndLocations } from "../../../utils/checkStaffRoleAndLocations";
const CategoryInventory = lazy(
  () => import("../components/CategoriesInventory"),
);
const Graphic = lazy(() => import("../components/Graphic"));
const TotalConsumer = lazy(() => import("../components/TotalConsumer"));
const TotalDevice = lazy(() => import("../components/TotalDeviceValue"));
const TableLocations = lazy(
  () => import("../components/locations/TableLocations"),
);
const MainPage = () => {
  const { isAdmin, locationsViewPermission } = useStaffRoleAndLocations();
  const [openDrawer, setOpenDrawer] = useState(
    isAdmin ? false : locationsViewPermission.length === 0,
  );
  return (
    <Grid container spacing={1}>
      <Suspense
        fallback={
          <div style={CenteringGrid}>
            <Spin indicator={<Loading />} fullscreen />
          </div>
        }
      >
        {!isAdmin && locationsViewPermission.length === 0 && (
          <Drawer
            title="Staff Permission"
            placement="top"
            onClose={() => setOpenDrawer(false)}
            open={openDrawer}
            closable
            key={"message-triggered"}
            maskClosable={false}
            styles={{
              height: "25vh !important",
            }}
          >
            <Typography
              style={{
                ...TextFontSize20LineHeight30,
                fontWeight: 600,
                color: "var(--gray600)",
              }}
            >
              You do not have permission to assign inventory to events.
            </Typography>
          </Drawer>
        )}
        <Grid container gap={2}>
          <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={3} lg={3}>
            <Graphic />
          </Grid>
          <Grid
            alignSelf={"flex-start"}
            style={{ margin: "-10px 0 0 0", padding: 0 }}
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
          >
            <Grid
              alignSelf={"flex-start"}
              style={{ padding: 0 }}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              {" "}
              <TotalConsumer />
            </Grid>
            <Grid
              alignSelf={"flex-start"}
              style={{ padding: 0 }}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              {" "}
              <TotalDevice />
            </Grid>
            <Grid
              alignSelf={"flex-start"}
              style={{ padding: 0 }}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              {" "}
              <TableLocations />
            </Grid>
          </Grid>
          <Grid
            alignSelf={"flex-start"}
            style={{ margin: "-10px 0 0 0", padding: 0 }}
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
          >
            <CategoryInventory />
          </Grid>
        </Grid>
      </Suspense>{" "}
    </Grid>
  );
};

export default MainPage;
