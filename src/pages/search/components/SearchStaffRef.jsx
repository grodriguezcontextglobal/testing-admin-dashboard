import { Grid, Typography } from "@mui/material";
import { notification } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import CardSearchStaffFound from "../utils/CardSearchStaffFound";
import NoDataFound from "../utils/NoDataFound";
import { checkArray } from "../../../components/utils/checkArray";
const SearchStaffRef = ({ data }) => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (title) => {
    api.open({
      message: title,
    });
  };

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
    dispatch(onAddStaffProfile({ ...template, firstName: template.name }));
    return navigate(`/staff/${record.other.id ?? record.other.uid}/main`);
  };

  const checkStaffStatusInCompany = (props) => {
    const staffStatusInCompany = user.companyData.employees.filter(
      (item) => item?.user === props.email
    );
    return {
      ...props,
      status: checkArray(staffStatusInCompany).status,
    };
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
        <Grid
          style={{ display: "flex", justifyContent: "flex-end" }}
          key={"searching-staff-page"}
          container
          gap={1}
        >
          {data?.length > 0 ? (
            data?.map((item) => (
              <Grid key={item?.id} item xs={12} sm={12} md={4} lg={4}>
                {" "}
                <CardSearchStaffFound
                  props={{
                    name: item?.firstName ?? item?.name,
                    lastName: item?.lastName,
                    email: item?.user ?? item?.email,
                    phoneNumber: item?.phoneNumber ?? item?.phone,
                    data: item,
                    other: checkStaffStatusInCompany(item),
                    status: checkStaffStatusInCompany(item).status ?? null,
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
export default SearchStaffRef;
