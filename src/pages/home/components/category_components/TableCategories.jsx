import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import "../../../../styles/global/ant-table.css";
import { useNavigate } from "react-router-dom";
const TableCategories = () => {
  const { user } = useSelector((state) => state.admin);
  const [device, setDevice] = useState([]);
  const navigate = useNavigate();
  const consumersQuery = useQuery({
    queryKey: ["consumersPerCompanyQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id
      }),
    refetchOnMount: false,
  });

  const dataFetched = consumersQuery?.data?.data?.items;
  const sortingDataFetched = () => {
    const result = {};
    if (dataFetched) {
      for (let data of dataFetched) {
        if (!result[data.category_name]) {
          result[data.category_name] = 1;
        } else {
          result[data.category_name]++;
        }
      }
      return setDevice(result);
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    consumersQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    sortingDataFetched();
    return () => {
      controller.abort();
    };
  }, [consumersQuery.data]);

  if (consumersQuery.data) {
    const formattingData = () => {
      const result = new Set();
      for (let [key, value] of Object.entries(device)) {
        result.add({ key: key, category: key, total: value });
      }
      const final = Array.from(result);
      return final;
    };

    const column = [
      {
        title: "Name",
        dataIndex: "category",
      },
      {
        title: "Total device",
        dataIndex: "total",
      },
    ];
    return (
      <Table
        dataSource={formattingData()}
        columns={column}
        className="table-ant-customized"
        ///inventory/category_name?
        onRow={(record) => {
          return {
            onClick: () => {
              navigate(`/inventory/category_name?${record.category}`);
            },
          };
        }}
        style={{ cursor: "pointer" }}
      />
    );
  }
};

export default TableCategories;
