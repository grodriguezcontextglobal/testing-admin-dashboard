import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";

const adornmentButtonsComponent = ({
  setValue,
  setParams,
  setSearchedResult,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "5px",
      }}
    >
      <button
        style={{
          backgroundColor: "transparent",
          margin: 0,
          padding: 0,
          border: "none",
          boxShadow: "-moz-initial",
        }}
        type="button"
        onClick={() => {
          setValue("searchItem", "");
          setParams(null);
          setSearchedResult(null);
        }}
      >
        <p
          style={{
            ...GrayButtonText,
            ...GrayButton,
            width: GrayButton.width,
            padding: "0 12px",
          }}
        >
          Clear
        </p>
      </button>
      <button
        type="submit"
        style={{
          backgroundColor: "transparent",
          margin: 0,
          padding: 0,
          border: "none",
          boxShadow: "-moz-initial",
        }}
      >
        <p
          style={{
            ...GrayButtonText,
            ...GrayButton,
            width: GrayButton.width,
            padding: "0 12px",
          }}
        >
          Search
        </p>
      </button>
    </div>
  );
};

export default adornmentButtonsComponent;
