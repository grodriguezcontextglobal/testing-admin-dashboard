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
import FilterBody from "./components/suppliers/FilterBody";

const MainPageOwnership = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const location = useLocation();
  const ownership = location.search.split("&");
  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      searchDevice: decodeURI(ownership[1].split("=")[1]),
    },
  });

  useEffect(() => {
    if (watch("searchDevice") === "undefined") {
      setValue("searchDevice", "");
    }
  }, [ownership]);

  const [isLoadingComponent, setIsLoadingComponent] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setValue("searchDevice", "...");
    }, 500);
    setTimeout(() => {
      setValue("searchDevice", "..");
    }, 700);
    setTimeout(() => {
      setValue("searchDevice", ".");
    }, 900);
    setTimeout(() => {
      setValue("searchDevice", "");
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
        <Header
          title={decodeURI(ownership[0].slice(1))}
          category={"Ownership"}
        />
        <CardInfo referenceData={referenceData} />
        <Divider />
        {decodeURI(ownership[0].slice(1)) === "Rent" && <FilterBody setSearchedValueItem={setSearchedValueItem} setValue={setValue} />}
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
        />
      </Grid>
    </Suspense>
  );
};

export default MainPageOwnership;
