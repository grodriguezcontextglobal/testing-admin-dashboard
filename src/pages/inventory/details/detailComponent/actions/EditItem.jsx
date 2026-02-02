/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks";
import { useState } from "react";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import EditItemModal from "../components/EditItemModal";

const EditItem = ({ dataFound, refetchingFn }) => {
  const [{ x, y }, scrollTo] = useWindowScroll();
  const [openEditItemModal, setOpenEditItemModal] = useState(false);
  return (
    <>
    <LightBlueButtonComponent title={"Edit"} func={() => {
      scrollTo({ left: 0, top: "50dv", behavior: "smooth" });
      setOpenEditItemModal(true);
    }} styles={{ width: "100%" }} buttonType="button" />
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
