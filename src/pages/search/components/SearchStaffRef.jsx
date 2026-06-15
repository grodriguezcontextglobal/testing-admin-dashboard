import { Grid } from "@mui/material";
import { notification, Pagination } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import CardSearchStaffFound from "../utils/CardSearchStaffFound";
import NoDataFound from "../utils/NoDataFound";
import { checkArray } from "../../../components/utils/checkArray";
const SearchStaffRef = ({ data }) => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const pageStaff = (data ?? []).slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
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
        style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignSelf: "flex-start", gap: "4px" }}
        item
        xs={12}
        sm={12}
        md={4}
        lg={4}
      >
        <p style={{ fontFamily: "Inter", fontSize: "18px", fontWeight: 600, lineHeight: "28px", color: "var(--gray-900, #101828)", margin: 0 }}>
          Staff
        </p>
        <p style={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 400, lineHeight: "20px", color: "var(--gray-600, #475467)", margin: 0 }}>
          All staff matching your search.
        </p>
      </Grid>

      <Grid item xs={12} sm={12} md={8} lg={8}>
        <Grid
          style={{ display: "flex", justifyContent: "flex-end" }}
          key={"searching-staff-page"}
          container
          gap={1}
        >
          {pageStaff.length > 0 ? (
            pageStaff.map((item) => (
              <Grid key={item?.id} item xs={12} sm={12} md={3} lg={3}>
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
        {(data ?? []).length > PAGE_SIZE && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={(data ?? []).length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
            />
          </div>
        )}
      </Grid>
    </Grid>
  );
};
export default SearchStaffRef;
