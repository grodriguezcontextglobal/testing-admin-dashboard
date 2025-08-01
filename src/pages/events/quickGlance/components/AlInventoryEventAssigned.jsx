import { Grid } from "@mui/material";
import { useState } from "react";
import { DownNarrow } from "../../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../../components/icons/UpNarrowIcon";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import { Title } from "../../../../styles/global/Title";
import DisplayAllItemsSetInventoryEvent from "./DisplayAllItemsSetInventoryEvent";
import DisplayDocumentsContainer from "./DisplayDocumentsContainer";
import HighlightedPill from "./ux/HighlightedPill";
import gettingInventoryTotalCount from "./gettingInventoryTotalCount";
import { useSelector } from "react-redux";

const AllInventoryEventForCustomerOnly = ({
  displayElementsBasedOnRole,
  setShowInventoryTypes,
  showInventoryTypes,
  // inventoryEventAssignedCount,
  setEditingInventory,
  user,
  setEditingServiceInEvent,
  database,
}) => {
  const [displayingDocumentListContainer, setDisplayingDocumentListContainer] =
    useState(false);
  const { event } = useSelector((state) => state.event);
  const inventoryEventData =
    typeof database?.receiversInventory === "string"
      ? JSON.parse(database.receiversInventory) : database.receiversInventory;

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
            <HighlightedPill
              props={`${gettingInventoryTotalCount({
                inventoryEventData,
                event,
              })} total`}
            />
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
          <GrayButtonComponent
            title={"Documents (legal contracts)"}
            func={() => setDisplayingDocumentListContainer(true)}
            styles={{
              width: "fit-content",
              justifyContent: "space-between",
              alignItems: "center",
              display: user.role === "4" ? "none" : "flex",
              margin: showInventoryTypes ? "0px" : 0, //"0 0 5dvh 0"
            }}
            titleStyles={{
              textTransform: "none",
            }}
          />
          <BlueButtonComponent
            func={() => setEditingServiceInEvent(true)}
            styles={{
              width: "fit-content",
              justifyContent: "space-between",
              alignItems: "center",
              display: user.role === "4" ? "none" : "flex",
              margin: showInventoryTypes ? "auto" : 0, //"0 0 5dvh 0"
            }}
            title={"Update services"}
          />
          <BlueButtonComponent
            func={() => setEditingInventory(true)}
            styles={{
              width: "fit-content",
              justifyContent: "space-between",
              alignItems: "center",
              display: user.role === "4" ? "none" : "flex",
              margin: showInventoryTypes ? "auto" : 0, //"0 0 5dvh 0"
            }}
            title={"Update inventory"}
          />
        </div>
      </Grid>
      <div style={{ display: showInventoryTypes ? "flex" : "none" }}>
        <DisplayAllItemsSetInventoryEvent database={database} />
      </div>
      {displayingDocumentListContainer && (
        <DisplayDocumentsContainer
          openDisplayDocumentsContainer={displayingDocumentListContainer}
          setOpenDisplayDocumentsContainer={setDisplayingDocumentListContainer}
        />
      )}
    </>
  );
};

export default AllInventoryEventForCustomerOnly;
