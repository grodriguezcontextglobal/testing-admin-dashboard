/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks";
import { useState } from "react";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import EditItemModal from "../components/EditItemModal";
import { Button } from "antd";

const EditItem = ({ dataFound, refetchingFn }) => {
  const [{ x, y }, scrollTo] = useWindowScroll();
  const [openEditItemModal, setOpenEditItemModal] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          scrollTo({ left: 0, top: "50dv", behavior: "smooth" });
          setOpenEditItemModal(true);
        }}
        style={{
          ...LightBlueButton,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0",
        }}
      >
        <p style={{ ...LightBlueButtonText, textAlign: "center" }}>Edit</p>
      </Button>
      {openEditItemModal && (
        <EditItemModal
          dataFound={dataFound}
          openEditItemModal={openEditItemModal}
          setOpenEditItemModal={setOpenEditItemModal}
          refetchingFn={refetchingFn}
        />
      )}
    </>
  );
};

export default EditItem;
