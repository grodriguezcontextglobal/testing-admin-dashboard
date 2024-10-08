import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import { devitrakApi } from "../api/devitrakApi";
import SelectCompanyToView from "./home/components/selectCompany/SelectCompanyToView";
// import OnlineUserBanner from "../components/general/OnlineUserBanner"

const ParentRenderingChildrenPage = () => {
  const { user } = useSelector((state) => state.admin);
  const { switchingCompanyInfo } = useSelector((state) => state.helper);
  const companiesCheck = useQuery({
    queryKey: ["companiesList"],
    queryFn: () => devitrakApi.post("/company/companies"),
    // enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    companiesCheck.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const checkUserAssignedCompanies = () => {
    const result = new Set();
    if (companiesCheck.data) {
      const grouping = companiesCheck.data.data.company;
      for (let company of grouping) {
        for (let data of company.employees) {
          if (data.user === user.email) {
            result.add({ user: data, companyInfo: company });
          }
        }
      }
    }
    return Array.from(result);
  };
  checkUserAssignedCompanies();
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      // width={'100%'}
      maxWidth={'1228px'}
      minWidth={'768px'}
      container
    >
      <Grid
        alignSelf={"flex-start"}
        style={{ minHeight: "80dvh" }}
        margin={"14dvh auto 1dvh"}
        // margin={"2.5dvh 20px 1dvh"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Outlet />
        {switchingCompanyInfo && (
          <SelectCompanyToView data={checkUserAssignedCompanies()} />
        )}
      </Grid>
    </Grid>
  );
};

export default ParentRenderingChildrenPage;
