/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks";
import { useState } from "react";
import DeleteItemModal from "../components/DeleteItemModal";
import { DangerButton } from "../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";

const DeleteItem = ({ dataFound }) => {
  const [{ x, y }, scrollTo] = useWindowScroll();
  const [openDeleteItemModal, setOpenDeleteItemModal] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          scrollTo({ left: 0, top: "50dv", behavior: "smooth" });
          setOpenDeleteItemModal(true);
        }}
        style={{
          ...DangerButton,
          width: "fit-content",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0",
        }}
      >
        <p style={{ ...DangerButtonText, textAlign: "center" }}>Delete</p>
      </button>

      {openDeleteItemModal && (
        <DeleteItemModal
          dataFound={dataFound}
          openDeleteItemModal={openDeleteItemModal}
          setOpenDeleteItemModal={setOpenDeleteItemModal}
        />
      )}
    </>
  );
};

export default DeleteItem;
