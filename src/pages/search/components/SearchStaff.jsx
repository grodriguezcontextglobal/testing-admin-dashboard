import { Grid, Typography } from "@mui/material";
import { notification } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import CardSearchStaffFound from "../utils/CardSearchStaffFound";
import NoDataFound from "../utils/NoDataFound";
const SearchStaff = ({ searchParams, setCountingResult, countingResults }) => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (title) => {
    api.open({
      message: title,
    });
  };
  const sortAndRenderFoundData = () => {
    const foundData = user.companyData.employees;
    if (
      foundData.some((element) =>
        JSON.stringify(element)
          .toLowerCase()
          .includes(`${searchParams}`.toLowerCase())
      )
    ) {
      const result = foundData?.filter((element) =>
        JSON.stringify(element)
          .toLowerCase()
          .includes(`${searchParams}`.toLowerCase())
      );
      return result;
    }
    return [];
  };

  const [staffSearchFound, setStaffSearchFound] = useState([]);
  const checkStaffInfo = async () => {
    const result = new Set();
    if (
      Array.isArray(sortAndRenderFoundData()) &&
      sortAndRenderFoundData()?.length > 0
    ) {
      const staffCompanyInfo = sortAndRenderFoundData();
      for (let member of staffCompanyInfo) {
        const searchFound = await devitrakApi.post("/staff/admin-users", {
          email: member.user,
        });
        if (searchFound.data) {
          const found = checkArray(searchFound.data.adminUsers);
          result.add(found);
        }
      }
      const finalResult = [...staffSearchFound, ...Array.from(result)];
      setStaffSearchFound(finalResult);
      return;
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    sortAndRenderFoundData();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    checkStaffInfo();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    Array.isArray(sortAndRenderFoundData()),
    sortAndRenderFoundData().length,
  ]);

  const trigger = setInterval(() => {
    return null;
  }, 1000);

  useMemo(() => {
    const counting = sortAndRenderFoundData()?.length;
    setCountingResult([
      ...countingResults,
      { title: "staff", count: counting },
    ]);
    return () => clearInterval(trigger);
  }, [trigger]);

  const handleDetailStaff = async (record) => {
    const template = {
      ...record.data,
      ...record.other,
      adminUserInfo: record.other,
      companyData: user.companyData.employees,
    };
    if (record.status === "Pending") {
      return openNotification("Staff member has not confirmed invitation yet.");
    }
    dispatch(onAddStaffProfile(template));
    return navigate(`/staff/${record.other.id ?? record.other.uid}/main`);
  };

  return (
    <Grid
      key={"searching-staff-container"}
      container
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      {contextHolder}
      <Grid
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          alignSelf: "flex-start",
        }}
        item
        xs={12}
        sm={12}
        md={4}
        lg={4}
      >
        <Typography
          style={{
            ...TextFontSize30LineHeight38,
            fontSize: "36px",
            lineHeight: "44px",
            fontWeight: 600,
            width: "100%",
            textAlign: "left",
          }}
        >
          Search staff{" "}
        </Typography>
        <br />
        <Typography
          style={{
            ...TextFontSize20LineHeight30,
            width: "100%",
            textAlign: "left",
          }}
        >
          All staff matching the search keywords.
        </Typography>
      </Grid>

      <Grid item xs={12} sm={12} md={8} lg={8}>
        <Grid key={"searching-staff-page"} container gap={1}>
          {Array.isArray(sortAndRenderFoundData()) &&
          sortAndRenderFoundData()?.length > 0 ? (
            sortAndRenderFoundData()?.map((item) => (
              <Grid key={item.id} item xs={12} sm={12} md={4} lg={4}>
                {" "}
                <CardSearchStaffFound
                  props={{
                    name: item.firstName,
                    lastName: item.lastName,
                    email: item.user,
                    phoneNumber: "",
                    data: item,
                    other: checkArray(
                      staffSearchFound.find(
                        (element) => element.email === item.user
                      )
                    ),
                    status: item.status,
                  }}
                  fn={handleDetailStaff}
                />
              </Grid>
            ))
          ) : (
            <NoDataFound />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
export default SearchStaff;
