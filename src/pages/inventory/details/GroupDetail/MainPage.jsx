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
import FilterBody from "../OwnershipDetail/components/suppliers/FilterBody";

const MainPageGrouping = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const [resultedData, setResultedData] = useState(null);
  const location = useLocation();
  const groupName = location.search.split("&");
  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      searchDevice: decodeURI(groupName[1].split("=")[1]),
    },
  });

  useEffect(() => {
    if (watch("searchDevice") === "undefined" || watch("searchDevice") === null) {
      setValue("searchDevice", "");
    }
  }, [groupName]);

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
          setResultedData={setResultedData}
        />
      </Grid>
    </Suspense>
  );
};

export default MainPageGrouping;
