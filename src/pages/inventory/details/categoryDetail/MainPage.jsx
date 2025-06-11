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
const MainPage = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const location = useLocation();
  const categoryName = location.search.split("&")[0];
  const { register, watch, setValue } = useForm({
    defaultValues: {
      searchDevice: location.search.split("&")[1].split("=")[1],
    },
  });

  useEffect(() => {
    if (watch("searchDevice") === "undefined") {
      setValue("searchDevice", "");
    }
  }, [categoryName]);

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
          title={decodeURI(categoryName.slice(1))}
          category={"Category"}
        />
        <CardInfo referenceData={referenceData} />
        <Divider />
        <BodyComponent
          watch={watch}
          register={register}
          setReferenceData={setReferenceData}
          isLoadingComponent={isLoadingComponent}
          trigger={"category"}
        />
      </Grid>
    </Suspense>
  );
};

export default MainPage;
