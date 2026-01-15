import { useQuery } from "@tanstack/react-query";
import { Spin, Table } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import "../../../../styles/global/ant-table.css";
import { useStaffRoleAndLocations } from "../../../../utils/checkStaffRoleAndLocations";

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

  // useEffect(() => {
  //   const controller = new AbortController();
  //   itemsInInventoryQuery.refetch();
  //   return () => {
  //     controller.abort();
  //   };
  // }, [user.company]);

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
      <Table
        columns={column}
        dataSource={renderingDataByLocation()}
        className="table-ant-customized"
        onRow={(record) => {
          return {
            onClick: () => {
              navigate(`/inventory/location?${record.key}&search=`);
            },
          };
        }}
        style={{ cursor: "pointer" }}
      />
    );
  }
  return <Spin indicator={<Loading />} />;
};

export default TableLocations;
