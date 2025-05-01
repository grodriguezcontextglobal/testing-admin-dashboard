/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks";
import { useState } from "react";
import DeleteItemModal from "../components/DeleteItemModal";
import { DangerButton } from "../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";
import { Button } from "antd";

const DeleteItem = ({ dataFound }) => {
  const [{ x, y }, scrollTo] = useWindowScroll();
  const [openDeleteItemModal, setOpenDeleteItemModal] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          scrollTo({ left: 0, top: "50dv", behavior: "smooth" });
          setOpenDeleteItemModal(true);
        }}
        style={{
          ...DangerButton,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0",
        }}
      >
        <p style={{ ...DangerButtonText, textAlign: "center" }}>Delete</p>
      </Button>

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
