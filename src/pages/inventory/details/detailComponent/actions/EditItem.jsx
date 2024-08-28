/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks";
import { useState } from "react";
import { EditIcon } from "../../../../../components/icons/Icons";
import EditItemModal from "../components/EditItemModal";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";

const EditItem = ({ dataFound }) => {
  const [{ x, y }, scrollTo] = useWindowScroll();
  const [openEditItemModal, setOpenEditItemModal] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          scrollTo({ left: 0, top: "50dv", behavior: "smooth" });
          setOpenEditItemModal(true);
        }}
        style={{
          ...LightBlueButton,
          width: "fit-content",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0",
        }}
      >
        <p style={{ ...LightBlueButtonText, textAlign: "center" }}>Edit</p>
      </button>
      {openEditItemModal && (
        <EditItemModal
          dataFound={dataFound}
          openEditItemModal={openEditItemModal}
          setOpenEditItemModal={setOpenEditItemModal}
        />
      )}
    </>
  );
};

export default EditItem;
