import { Pagination } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import CardSearchStaffFound from "../utils/CardSearchStaffFound";
import NoDataFound from "../utils/NoDataFound";
import { checkArray } from "../../../components/utils/checkArray";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import SearchSection from "./SearchSection";
import {
  cardGrid,
  sectionFooter,
} from "../utils/sectionLayout";
const SearchStaffRef = ({ data }) => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notify, contextHolder } = useStatusNotification();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const pageStaff = (data ?? []).slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const openNotification = (title) => {
    notify("warning", title);
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
    <SearchSection title="Staff" subtitle="All staff matching your search.">
      {contextHolder}
      {pageStaff.length > 0 ? (
        <div style={cardGrid(280)} key={"searching-staff-page"}>
          {pageStaff.map((item) => (
            <CardSearchStaffFound
              key={item?.id}
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
          ))}
        </div>
      ) : (
        <NoDataFound />
      )}
      {(data ?? []).length > PAGE_SIZE && (
        <div style={sectionFooter}>
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
    </SearchSection>
  );
};
export default SearchStaffRef;
