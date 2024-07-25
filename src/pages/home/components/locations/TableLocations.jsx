import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { groupBy } from "lodash";
import "../../../../styles/global/ant-table.css";
import { useNavigate } from "react-router-dom";

const TableLocations = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company: user.company,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    itemsInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [user.company]);

  const column = [
    {
      title: "Location",
      dataIndex: "key",
    },
    {
      title: "Total untis",
      dataIndex: "total",
    },
  ];

  const renderingDataByLocation = () => {
    const locations = groupBy(
      itemsInInventoryQuery?.data?.data?.items,
      "location"
    );
    const result = new Set();
    for (let [key, value] of Object.entries(locations)) {
      result.add({ key: key, total: value.length });
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
            navigate(`/inventory/location?${record.key}`);
          },
        };
      }}
      style={{ cursor: "pointer" }}
    />
  );
};

export default TableLocations;
