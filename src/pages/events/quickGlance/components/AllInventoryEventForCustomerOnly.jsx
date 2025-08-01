import { Grid } from "@mui/material";
import { DownNarrow } from "../../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../../components/icons/UpNarrowIcon";
import { Title } from "../../../../styles/global/Title";
import DisplayAllItemsSetInventoryEventForCustomers from "./DisplayAllItemsSetInventoryForCustomers";
import HighlightedPill from "./ux/HighlightedPill";

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
            <HighlightedPill props={`${inventoryEventAssignedCount() ?? 0} total`} />
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
