import { Grid } from "@mui/material";
// import CategoryInventory from "../components/CategoriesInventory";
// import Graphic from "../components/Graphic";
// import TotalConsumer from "../components/TotalConsumer";
// import TotalDevice from "../components/TotalDeviceValue";
// import TableLocations from "../components/locations/TableLocations";
import { lazy, Suspense } from "react";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
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
          <Loading />
        </div>
      }
    >
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
