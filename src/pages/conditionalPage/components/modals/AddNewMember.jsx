import { useMemo, useState } from "react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import MultipleFromXLSX from "./addNewMember/MultipleFromXLSX";
import Single from "./addNewMember/Single";
import { Divider } from "antd";

const AddNewMember = ({ openModal, setOpenModal }) => {
  const [choose, setChoose] = useState(0);
  const bodyUX = useMemo(() => {
    return (
      <div>
        {choose === 0 ? (
          <Single closingModal={setOpenModal} />
        ) : (
          <MultipleFromXLSX closingModal={setOpenModal} />
        )}
      </div>
    );
  }, [choose]);
  const renderingTitleWithOptions = () => {
    return (
      <>
        <h2 style={{ marginBottom: 24 }}>Choose option to add new member(s)</h2>
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <BlueButtonComponent
            key="add"
            buttonType="submit"
            title={"Add new member"}
            styles={{ width: "50%" }}
            func={() => setChoose(0)}
          />
          <BlueButtonComponent
            key="import"
            title={"Import (.xlsx)"}
            styles={{ width: "50%" }}
            func={() => setChoose(1)}
          />
        </div>
        <Divider />
      </>
    );
  };
  return (
    <ModalUX
      title={renderingTitleWithOptions()}
      openDialog={openModal}
      closeModal={setOpenModal}
      width={1000}
      footer={null}
      modalStyles={{}}
      body={bodyUX}
    />
  );
};

export default AddNewMember;
