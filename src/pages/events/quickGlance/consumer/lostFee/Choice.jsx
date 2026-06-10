import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../../components/UX/modal/ModalUX";

const Choice = ({ openModal, setOpenModal }) => {
  const { customer } = useSelector((state) => state.stripe);
  const handleClose = () => {
    setOpenModal(false);
  };
  
  const navigate = useNavigate();
  
  return (
    <ModalUX
      title="How will the lost device fee be paid?"
      openDialog={openModal}
      onClose={handleClose}
      footer={[<div key={"footer-buttons-selection"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <BlueButtonComponent 
        func={() => navigate(`/events/event-attendees/${customer?.uid}/collect-lost-fee/credit-card-method`)} 
        title={"Credit Card"} 
        styles={{ width: "60%" }}
        />
        <BlueButtonComponent 
        func={() => navigate(`/events/event-attendees/${customer?.uid}/collect-lost-fee/cash-method`)} 
        title={"Cash"} 
        styles={{ width: "60%" }}
        />
        <GrayButtonComponent
          title="Go back"
          func={handleClose}
        />
      </div>]}
    />
  );
};

export default Choice;
