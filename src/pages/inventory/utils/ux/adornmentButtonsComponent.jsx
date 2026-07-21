import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";

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
      <GrayButtonComponent
        buttonType="button"
        onClick={() => {
          setValue("searchItem", "");
          setParams(null);
          setSearchedResult(null);
        }}
      >
        Clear
      </GrayButtonComponent>
      <BlueButtonComponent buttonType="submit">Search</BlueButtonComponent>
    </div>
  );
};

export default adornmentButtonsComponent;
