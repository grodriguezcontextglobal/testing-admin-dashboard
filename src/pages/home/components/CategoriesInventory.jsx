import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
// import TableCategories from "./category_components/TableCategories";
const TableCategories = lazy(() =>
  import("./category_components/TableCategories")
);
const CategoryInventory = () => {
  const { user } = useSelector((state) => state.admin);
  const [totalCategories, setTotalCategories] = useState(0);

  const totalConsumers = useQuery({
    queryKey: ["consultingCategoriesPerCompany"],
    queryFn: () =>
      devitrakApi.post("db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  const totalFetchedRef = useRef();
  useEffect(() => {
    const controller = new AbortController();
    totalConsumers.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const sortingDataFetched = () => {
    if (totalConsumers.data) {
      totalFetchedRef.current = totalConsumers.data.data.items;
      const result = {};
      for (let data of totalFetchedRef.current) {
        if (!result[data.category_name]) {
          result[data.category_name] = 1;
        } else {
          result[data.category_name]++;
        }
      }
      const final = new Set();
      for (let [key] of Object.entries(result)) {
        final.add(key);
      }
      return setTotalCategories(Array.from(final).length);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    sortingDataFetched();
    return () => {
      controller.abort();
    };
  }, [totalConsumers.data]);

  return (
    <Suspense fallback={<div style={CenteringGrid}><Loading /></div>}>
      <Grid
        marginY={0}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          border={"1px solid var(--gray-200, #eaecf0)"}
          borderRadius={"12px 12px 0 0"}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          marginBottom={-2}
          paddingBottom={-2}
          item
          xs={12}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontWeight={600}
              fontSize={"18px"}
              fontFamily={"Inter"}
              lineHeight={"28px"}
              color={"var(--gray-900, #101828)"}
              padding={"24px"}
            >
              Categories
            </Typography>
            <div
              style={{
                borderRadius: "16px",
                background: "var(--blue-dark-50, #EFF4FF)",
                mixBlendMode: "multiply",
                width: "fit-content",
                height: "fit-content",
              }}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={500}
                fontSize={"12px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--blue-dark-700, #004EEB)"}
                padding={"0px 8px"}
              >
                {totalCategories}{" "}
                {totalCategories > 1 ? "categories" : "category"}
              </Typography>
            </div>
          </div>
        </Grid>
        <Grid item xs={12}>
          <TableCategories />
        </Grid>
      </Grid>{" "}
    </Suspense>
  );
};

export default CategoryInventory;
