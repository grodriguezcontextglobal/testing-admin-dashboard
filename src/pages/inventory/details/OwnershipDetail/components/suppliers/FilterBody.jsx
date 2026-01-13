import { Select } from "antd";
import "../../../../../../styles/global/ant-select.css";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import useSuppliersCompanyFetch from "./hook/useSuppliersCompanyFetch";
import useSuppliersFetch from "./SuppliersInfoFiltersComponent";
import { useState } from "react";
import ReturnRentedItemModal from "./ReturnRentedItemModal";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import { useSelector } from "react-redux";

const FilterBody = ({ setSearchedValueItem, setValue, resultedData }) => {
  const { user } = useSelector((state) => state.admin);
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
    return (
      user?.companyData?.employees?.find((item) => item.user === user.email)
        ?.role === "0"
    );
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
