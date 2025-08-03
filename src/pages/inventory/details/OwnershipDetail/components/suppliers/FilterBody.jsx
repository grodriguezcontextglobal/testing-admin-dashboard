import { Select } from "antd";
import BlueButtonComponent from "../../../../../../components/UX/buttons/bluebutton";
import "../../../../../../styles/global/ant-select.css";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import useSuppliersCompanyFetch from "./hook/useSuppliersCompanyFetch";
import useSuppliersFetch from "./SuppliersInfoFiltersComponent";

const FilterBody = ({ setSearchedValueItem, setValue }) => {
  const handleChange = (value) => {
    searchingFunction(value);
  };
  const suppliers = useSuppliersFetch();
  const suppliersInfoList = useSuppliersCompanyFetch();
  const options = suppliers?.map((item) => ({
    value: item,
    label: suppliersInfoList[item]?.at(-1)?.companyName,
  }));
  options;

  const searchingFunction = (props) => {
    setSearchedValueItem(props);
    return setValue("searchDevice", props);

  };
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        gap: "10px",
      }}
    >
      <Select
        className="custom-autocomplete"
        style={{
          ...AntSelectorStyle,
          width: "50%",
          margin: "0 0 0.3rem",
        }}
        onChange={handleChange}
        options={options}
        allowClear
        placeholder="Select a supplier to display related data"
      />
      {/* <BlueButtonComponent
        title={"Display data"}
        func={searchingFunction}
      /> */}
      <BlueButtonComponent title={"Delete data"} />
    </div>
  );
};

export default FilterBody;
