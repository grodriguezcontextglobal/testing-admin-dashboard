import { Grid } from "@mui/material";
import { Divider } from "antd";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import DevitrakLoading from "../../../../components/animation/DevitrakLoading";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import CardInfo from "../UX/CardInfo";
import Header from "../UX/header";
import BodyComponent from "../UX/BodyComponent";
import FilterBody from "../OwnershipDetail/components/suppliers/FilterBody";
import { readDetailSearchValue } from "../utils/detailSearchParams";

const MainPageGrouping = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const [resultedData, setResultedData] = useState(null);
  const location = useLocation();
  const groupName = location.search.split("&");
  const searchValue = readDetailSearchValue(location.search);
  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      searchDevice: searchValue,
    },
  });

  // Follows the URL: opening another item of the same kind keeps this page
  // mounted, and the box should show that link's search value.
  useEffect(() => {
    setValue("searchDevice", searchValue);
  }, [searchValue, setValue]);

  const [isLoadingComponent, setIsLoadingComponent] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setIsLoadingComponent(false);
    }, 1100);
  }, []);

  const [searchedValueItem, setSearchedValueItem] = useState(null);
  const handleSubmitForm = (data) => {
    return setSearchedValueItem(data.searchDevice);
  };

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <DevitrakLoading />
        </div>
      }
    >
      <Grid
        style={{
          padding: "5px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
        container
      >
        <Header title={decodeURI(groupName[0].slice(1))} category={"Group"} />
        <CardInfo referenceData={referenceData} />
        <Divider />
        <FilterBody
          setSearchedValueItem={setSearchedValueItem}
          setValue={setValue}
          register={register}
          resultedData={resultedData}
        />
        <Divider />
        <BodyComponent
          register={register}
          handleSubmitForm={handleSubmitForm}
          handleSubmit={handleSubmit}
          searchedValueItem={searchedValueItem}
          setSearchedValueItem={setSearchedValueItem}
          setReferenceData={setReferenceData}
          isLoadingComponent={isLoadingComponent}
          trigger={"group"}
          setValue={setValue}
          setResultedData={setResultedData}
          watch={watch}
        />
      </Grid>
    </Suspense>
  );
};

export default MainPageGrouping;
