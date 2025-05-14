import {
  Grid,
  InputAdornment,
  OutlinedInput
} from "@mui/material";
import { Divider } from "antd";
import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import Loading from "../../../../components/animation/Loading";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import CardInfo from "../UX/CardInfo";
import Header from "../UX/header";
const TableDeviceLocation = lazy(() => import("./components/Table"));
const MainPageBrand = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const location = useLocation();
  const brandName = location.search.split("&");
  const { register, watch, setValue } = useForm({
    defaultValues: {
      searchDevice: decodeURI(brandName[1].split("=")[1]),
    },
  });

  useEffect(() => {
    if (watch("searchDevice") === "undefined") {
      setValue("searchDevice", "");
    }
  }, [brandName]);

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
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <OutlinedInput
            {...register("searchDevice")}
            fullWidth
            placeholder="Search devices here"
            style={OutlinedInputStyle}
            startAdornment={
              <InputAdornment position="start">
                <MagnifyIcon />
              </InputAdornment>
            }
          />
        </Grid>
        <Grid container>
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            item
            xs={12}
          >
            <TableDeviceLocation
              searchItem={watch("searchDevice")}
              referenceData={setReferenceData}
              // searchParameter={searchParameter}
            />
          </Grid>
        </Grid>
      </Grid>
    </Suspense>
  );
};

export default MainPageBrand;
