/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks";
import { useState } from "react";
import DeleteItemModal from "../components/DeleteItemModal";
import { DangerButton } from "../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";
import { Button } from "antd";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";

const DeleteItem = ({ dataFound }) => {
  const [{ x, y }, scrollTo] = useWindowScroll();
  const [openDeleteItemModal, setOpenDeleteItemModal] = useState(false);
  return (
    <>
      <DangerButtonComponent
        title={"Delete"}
        func={() => {
          scrollTo({ left: 0, top: "50dv", behavior: "smooth" });
          setOpenDeleteItemModal(true);
        }}
        buttonType="button"
        styles={{ width: "100%" }}
      />
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
