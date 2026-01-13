import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import "../../../../styles/global/ant-table.css";
const TableCategories = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const consumersQuery = useQuery({
    queryKey: ["consumersPerCompanyQuery"],
    queryFn: () =>
      devitrakApi.post(`/db_company/company-inventory-structure`, {
        company_id: user.sqlInfo.company_id,
        role: user.companyData.employees.find(
          (element) => element.user === user.email
        )?.role,
        preference:
          user.companyData.employees.find(
            (element) => element.user === user.email
          )?.preference || [],
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 2 * 60 * 1000,
  });

  const dataFetched =
    consumersQuery?.data?.data?.groupedData?.category_name || [];
  if (consumersQuery.data) {
    const formattingData = () => {
      const result = new Set();
      for (let key of Object.keys(dataFetched)) {
        result.add({ key: key, category: key, total: dataFetched[key]?.total });
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
        title: "Total devices",
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
              navigate(`/inventory/category_name?${record.category}&search=`);
            },
          };
        }}
        style={{ cursor: "pointer" }}
      />
    );
  }
};

export default TableCategories;
