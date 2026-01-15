import { Select } from "antd";
import { useState } from "react";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import "../../../../../../styles/global/ant-select.css";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { useStaffRoleAndLocations } from "../../../../../../utils/checkStaffRoleAndLocations";
import useSuppliersCompanyFetch from "./hook/useSuppliersCompanyFetch";
import ReturnRentedItemModal from "./ReturnRentedItemModal";
import useSuppliersFetch from "./SuppliersInfoFiltersComponent";

const FilterBody = ({ setSearchedValueItem, setValue, resultedData }) => {
  const { role } = useStaffRoleAndLocations();
  const [returnRentedItemsToRenter, setReturnRentedItemsToRenter] =
    useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
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
    setSelectedSupplierId(props);
    return setValue("searchDevice", props);
  };

  const checkingStaffRole = () => {
    return role === "0";
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
      {checkingStaffRole() && (
        <BlueButtonComponent
          title={"Return item to Renter"}
          func={() => setReturnRentedItemsToRenter(true)}
        />
      )}
      {returnRentedItemsToRenter && (
        <ReturnRentedItemModal
          open={returnRentedItemsToRenter}
          handleClose={() => setReturnRentedItemsToRenter(false)}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "5px 5px 5px 0px",
          }}
          supplier_id={selectedSupplierId}
          data={resultedData}
        />
      )}
    </div>
  );
};

export default FilterBody;
