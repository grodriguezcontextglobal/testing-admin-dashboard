/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks";
import { useState } from "react";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import EditItemModal from "../components/EditItemModal";

/**
 * No refetch callback: the update runs as a background job, so refetching at
 * submit time would read the pre-update state. EditItemModal registers the
 * queries to invalidate with the job instead, and the tracker refreshes them
 * when it actually completes. The prop that used to be threaded through here
 * was never destructured by the modal, so nothing refreshed at all.
 */
const EditItem = ({ dataFound }) => {
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
        />
      )}
    </>
  );
};

export default EditItem;
