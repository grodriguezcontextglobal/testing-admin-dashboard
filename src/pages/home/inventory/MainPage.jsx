import { Typography } from "@mui/material";
import { Drawer, Spin } from "antd";
import { lazy, Suspense, useState } from "react";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
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

  // const containerStyle = {
  //   display: "grid",
  //   gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  //   gap: "16px",
  //   width: "100%",
  // };

  // Inline media query for 3 columns on desktop
  const gridLayoutStyle = `
    .main-inventory-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      width: 100%;
    }
    @media (min-width: 768px) {
      .main-inventory-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `;

  return (
    <div style={{ width: "100%" }}>
      <style>{gridLayoutStyle}</style>
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

        <div className="main-inventory-grid">
          {/* Column 1: Graphic */}
          <div style={{ width: "100%" }}>
            <Graphic />
          </div>

          {/* Column 2: Stats & Locations */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              width: "100%",
            }}
          >
            <TotalConsumer />
            <TotalDevice />
            <TableLocations />
          </div>

          {/* Column 3: Category Inventory */}
          <div style={{ width: "100%" }}>
            <CategoryInventory />
          </div>
        </div>
      </Suspense>
    </div>
  );
};

export default MainPage;
