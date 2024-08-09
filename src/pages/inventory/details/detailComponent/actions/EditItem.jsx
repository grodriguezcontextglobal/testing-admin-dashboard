/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks";
import { useState } from "react";
import { EditIcon } from "../../../../../components/icons/Icons";
import EditItemModal from "../components/EditItemModal";

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
          outline: "none",
          display: "flex",
          padding: "10px 16px",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          borderRadius: "8px",
          border: "1px solid var(--Blue-dark-50, #EFF4FF)",
          background: "var(--Blue-dark-50, #EFF4FF)",
        }}
      >
        <EditIcon />
        <p
          style={{
            color: "var(--Blue-dark-700, #004EEB)",
            fontFamily: "Inter",
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: 600,
            lineHeight: "20px",
          }}
        >
          Edit
        </p>
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
