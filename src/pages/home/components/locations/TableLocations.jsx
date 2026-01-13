import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import "../../../../styles/global/ant-table.css";

const TableLocations = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          role: Number(
            user.companyData.employees.find(
              (element) => element.user === user.email
            )?.role
          ),
          preference:
            user.companyData.employees.find(
              (element) => element.user === user.email
            )?.preference || [],
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
    const locations = itemsInInventoryQuery?.data?.data?.data;
    const result = new Set();
    for (let [key] of Object.entries(locations)) {
      result.add({ key: key, total: locations[key]?.total });
    }
    return Array.from(result);
  };
  renderingDataByLocation();

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
};

export default TableLocations;
