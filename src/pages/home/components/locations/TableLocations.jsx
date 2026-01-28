import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import BaseTable from "../../../../components/UX/tables/BaseTable";
import { useStaffRoleAndLocations } from "../../../../utils/checkStaffRoleAndLocations";
import { RightNarrowInCircle } from "../../../../components/icons/RightNarrowInCircle";

const TableLocations = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const { isAdmin, role, employee } = useStaffRoleAndLocations();
  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          role: isAdmin ? "0" : role,
          preference: employee?.preference,
        }
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 2 * 60 * 1000,
  });

  if (itemsInInventoryQuery.data) {
    const column = [
      {
        title: "Location",
        dataIndex: "key",
      },
      {
        title: "Total units",
        dataIndex: "total",
      },
            {
        title: "",
        render: (text, record) => (
          <button className="transparentButton"
            type="primary"
            onClick={() => {
              navigate(`/inventory/location?${record.key}&search=`);
            }}
          >
            <RightNarrowInCircle />
          </button>
        ),
      },

    ];

    const renderingDataByLocation = () => {
      const locations = itemsInInventoryQuery?.data?.data?.data || {};
      const result = new Set();
      for (let [key] of Object.entries(locations)) {
        result.add({ key: key, total: locations[key]?.total });
      }
      return Array.from(result);
    };
    return (
      <BaseTable
        columns={column}
        dataSource={renderingDataByLocation()}
        enablePagination={false}
        // className="table-ant-customized"
        // onRow={(record) => {
        //   return {
        //     onClick: () => {
        //       navigate(`/inventory/location?${record.key}&search=`);
        //     },
        //   };
        // }}
        // style={{ cursor: "pointer" }}
      />
    );
  }
  return <Spin indicator={<Loading />} />;
};

export default TableLocations;
