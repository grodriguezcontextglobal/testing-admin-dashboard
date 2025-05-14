import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
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
const TableDeviceCategory = lazy(() => import("./components/Table"));
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
            <TableDeviceCategory
              searchItem={watch("searchDevice")}
              referenceData={setReferenceData}
            />
          </Grid>
        </Grid>
      </Grid>
    </Suspense>
  );
};

export default MainPage;
