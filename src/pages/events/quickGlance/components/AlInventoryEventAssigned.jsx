import { Grid } from "@mui/material";
import { Title } from "../../../../styles/global/Title";
import { UpNarrowIcon } from "../../../../components/icons/UpNarrowIcon";
import { DownNarrow } from "../../../../components/icons/DownNarrow";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import DisplayAllItemsSetInventoryEvent from "./DisplayAllItemsSetInventoryEvent";

const AllInventoryEventForCustomerOnly = ({
  displayElementsBasedOnRole,
  setShowInventoryTypes,
  showInventoryTypes,
  inventoryEventAssignedCount,
  setEditingInventory,
  user,
}) => {
  return (
    <>
      <Grid
        style={{
          display: `${displayElementsBasedOnRole() ? "flex" : "none"}`,
          justifyContent: "space-between",
          alignItems: "center",
          margin: "2rem auto 0.1rem",
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
              margin: showInventoryTypes ? "0px" : 0, //"0 0 5dvh 0"
            }}
          >
            {showInventoryTypes ? <UpNarrowIcon /> : <DownNarrow />}
            Inventory assigned to event:&nbsp;
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
        <div
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            display: user.role === "4" ? "none" : "flex",
            margin: showInventoryTypes ? "0px" : 0, //"0 0 5dvh 0"
          }}
        >
          <button
            style={{
              ...BlueButton,
              width: "fit-content",
              justifyContent: "space-between",
              alignItems: "center",
              display: user.role === "4" ? "none" : "flex",
              margin: showInventoryTypes ? "0px" : 0, //"0 0 5dvh 0"
            }}
          >
            <p style={{ ...BlueButtonText }}>Update services</p>
          </button>

          <button
            onClick={() => setEditingInventory(true)}
            style={{
              ...BlueButton,
              width: "fit-content",
              justifyContent: "space-between",
              alignItems: "center",
              display: user.role === "4" ? "none" : "flex",
              margin: showInventoryTypes ? "0px" : 0, //"0 0 5dvh 0"
            }}
          >
            <p style={{ ...BlueButtonText }}>Update inventory</p>
          </button>
        </div>
      </Grid>
      <div style={{ display: showInventoryTypes ? "flex" : "none" }}>
        <DisplayAllItemsSetInventoryEvent />
      </div>
    </>
  );
};

export default AllInventoryEventForCustomerOnly;
