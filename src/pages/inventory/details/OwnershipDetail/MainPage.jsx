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
import FilterBody from "./components/suppliers/FilterBody";
import { readDetailSearchValue } from "../utils/detailSearchParams";

const MainPageOwnership = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const location = useLocation();
  const ownership = location.search.split("&");
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
        <Header
          title={decodeURI(ownership[0].slice(1))}
          category={"Ownership"}
        />
        <CardInfo referenceData={referenceData} />
        <Divider />
        {decodeURI(ownership[0].slice(1)) === "Rent" && (
          <FilterBody
            setSearchedValueItem={setSearchedValueItem}
            setValue={setValue}
          />
        )}
        <Divider />
        <BodyComponent
          register={register}
          handleSubmitForm={handleSubmitForm}
          handleSubmit={handleSubmit}
          searchedValueItem={searchedValueItem}
          setSearchedValueItem={setSearchedValueItem}
          setReferenceData={setReferenceData}
          isLoadingComponent={isLoadingComponent}
          trigger={"ownership"}
          setValue={setValue}
          watch={watch}
        />
      </Grid>
    </Suspense>
  );
};

export default MainPageOwnership;
