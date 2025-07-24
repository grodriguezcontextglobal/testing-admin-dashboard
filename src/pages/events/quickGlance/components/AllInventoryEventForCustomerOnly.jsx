import { Grid } from "@mui/material";
import { DownNarrow } from "../../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../../components/icons/UpNarrowIcon";
import { Title } from "../../../../styles/global/Title";
import DisplayAllItemsSetInventoryEventForCustomers from "./DisplayAllItemsSetInventoryForCustomers";

const AlInventoryEventAssigned = ({
  displayElementsBasedOnRole,
  setShowInventoryTypes,
  showInventoryTypes,
  inventoryEventAssignedCount,
  database,
}) => {
  return (
    <>
      <Grid
        style={{
          display: `${displayElementsBasedOnRole() ? "flex" : "none"}`,
          justifyContent: "space-between",
          alignItems: "center",
          margin: "2rem auto 0.2rem",
        }}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <button
          style={{
            background: "transparent",
            outline: "none",
            border: "transparent",
            margin: 0,
            padding: 0,
          }}
          onClick={() => setShowInventoryTypes(!showInventoryTypes)}
        >
          <p
            style={{
              ...Title,
              fontSize: "25px",
              padding: 0,
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              cursor: "pointer",
              margin: showInventoryTypes ? "0px" : "0 0 5dvh 0",
            }}
          >
            {showInventoryTypes ? <UpNarrowIcon /> : <DownNarrow />}
            Inventory assigned to event for consumer uses:&nbsp;
            <div
              style={{
                borderRadius: "16px",
                background: "var(--blue-dark-50, #EFF4FF)",
                mixBlendMode: "multiply",
                width: "fit-content",
                height: "fit-content",
              }}
            >
              <p
                style={{
                  textTransform: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: "12px",
                  fontFamily: "Inter",
                  lineHeight: "28px",
                  color: "var(--blue-dark-700, #004EEB)",
                  padding: "0px 8px",
                }}
              >
                {inventoryEventAssignedCount()} total
              </p>
            </div>
          </p>
        </button>
      </Grid>
      <div style={{ display: showInventoryTypes ? "flex" : "none" }}>
        <DisplayAllItemsSetInventoryEventForCustomers database={database} />
      </div>
    </>
  );
};

export default AlInventoryEventAssigned;
