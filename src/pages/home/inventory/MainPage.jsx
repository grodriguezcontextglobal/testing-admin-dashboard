import { Spin } from "antd";
import { lazy, Suspense } from "react";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";

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
