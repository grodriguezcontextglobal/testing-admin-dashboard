import { Segmented } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";
import renderingTitle from "../../../../components/general/renderingTitle";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import "../../../../styles/global/actionForm.css";
import MultipleFromXLSX from "./addNewMember/MultipleFromXLSX";
import Single from "./addNewMember/Single";

const MODES = [
  { value: "single", label: "One at a time" },
  { value: "import", label: "Import a spreadsheet" },
];

/**
 * Adding members, either one by one or from a spreadsheet.
 *
 * The two ways in used to be a blue button next to a grey one, which reads as
 * "do this" versus "do that" rather than as a pair of tabs — people pressed
 * "Add new member" expecting it to submit the form they had just filled in.
 * They are a segmented control now.
 *
 * The template guide also used to live here as a Tour rendered *instead of*
 * this modal (`{!openTour && <ModalUX …>}`), so opening it unmounted the
 * import pane and threw away the file you had already picked, its parsed rows
 * and its warnings. The column reference now sits inside the import pane
 * itself, where it describes the file you are about to upload and nothing has
 * to be destroyed to read it.
 */
const AddNewMember = ({ openModal, setOpenModal }) => {
  const [mode, setMode] = useState("single");
  const close = () => setOpenModal(false);

  return (
    <ModalUX
      title={renderingTitle("Add members")}
      openDialog={openModal}
      closeModal={close}
      width={1000}
      footer={null}
      body={
        <div className="action-form">
          <div className="action-form__toolbar">
            <Segmented options={MODES} value={mode} onChange={setMode} block />
          </div>

          {mode === "single" ? (
            <Single onClose={close} />
          ) : (
            <MultipleFromXLSX onClose={close} />
          )}
        </div>
      }
    />
  );
};

AddNewMember.propTypes = {
  openModal: PropTypes.bool,
  setOpenModal: PropTypes.func.isRequired,
};

export default AddNewMember;
