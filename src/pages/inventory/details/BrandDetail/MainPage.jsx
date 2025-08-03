import { Grid } from "@mui/material";
import { Divider } from "antd";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import Loading from "../../../../components/animation/Loading";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import CardInfo from "../UX/CardInfo";
import Header from "../UX/header";
import { BodyComponent } from "../utils/dataStructuringFormat";
const MainPageBrand = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const location = useLocation();
  const brandName = location.search.split("&");
  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      searchDevice: decodeURI(brandName[1].split("=")[1]),
    },
  });
  useEffect(() => {
    if (watch("searchDevice") === "undefined") {
      setValue("searchDevice", "");
    }
  }, [brandName]);

  const [searchedValueItem, setSearchedValueItem] = useState(null)
  const [isLoadingComponent, setIsLoadingComponent] = useState(true);
  useEffect(() => {
    for (let i = 3; i > 0; i--) {
      let j = ".".repeat(i);
      setTimeout(() => {
        setValue("searchDevice", j);
      }, 200 * i);
      setTimeout(() => {
        setValue("searchDevice", "");
        setIsLoadingComponent(false);
      }, 800);
    }
  }, []);

  const handleSubmitForm = (data) => {
    return setSearchedValueItem(data.searchDevice)
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
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
        <Header title={decodeURI(brandName[0].slice(1))} category={"Brands"} />
        <CardInfo referenceData={referenceData} />
        <Divider />
        <BodyComponent
          register={register}
          handleSubmitForm={handleSubmitForm}
          handleSubmit={handleSubmit}
          searchedValueItem={searchedValueItem}
          setSearchedValueItem={setSearchedValueItem}setReferenceData={setReferenceData}
          isLoadingComponent={isLoadingComponent}
          trigger={"brand"}
        />
      </Grid>
    </Suspense>
  );
};

export default MainPageBrand;
