import { Grid } from "@mui/material";
import { lazy, Suspense } from "react";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Spin } from "antd";
const CategoryInventory = lazy(() =>
  import("../components/CategoriesInventory")
);
const Graphic = lazy(() => import("../components/Graphic"));
const TotalConsumer = lazy(() => import("../components/TotalConsumer"));
const TotalDevice = lazy(() => import("../components/TotalDeviceValue"));
const TableLocations = lazy(() =>
  import("../components/locations/TableLocations")
);
const MainPage = () => {
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Spin indicator={<Loading />} fullscreen />
        </div>
      }
    >
      <Grid
        textAlign={"right"}
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
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={4} lg={4}>
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
          <TotalConsumer />
          <TotalDevice />
          <TableLocations />
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
    </Suspense>
  );
};

export default MainPage;
