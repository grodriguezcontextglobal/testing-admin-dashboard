import { Typography } from "@mui/material";
import { Table } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
// import "../../../../style/component/events/EventsToHomePage.css";
import "../../../styles/global/ant-table.css"
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
export default function TablesConsumers({ getInfoNeededToBeRenderedInTable }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleDataDetailUser = (record) => {
    let userFormatData = {
      uid: record?.key,
      name: record?.entireData?.name,
      lastName: record?.entireData?.lastName,
      email: record?.entireData?.email,
      phoneNumber: record?.entireData?.phoneNumber,
      data: record.entireData
    };
    dispatch(onAddCustomerInfo(userFormatData));
    dispatch(onAddCustomer(userFormatData));
    navigate(`/consumers/${record.entireData.id}`);
  };
  const columns = [
    {
      title: "User",
      dataIndex: "user",
      width: "30%",
      sorter: {
        compare: (a, b) => ("" + a.user).localeCompare(b.user),
      },
      render: (user) => (
        <span key={`${user}`}>
          {user.map((detail, index) => {
            return (
              <div
                key={`${detail}-${index}`}
                style={{
                  flexDirection: "column",
                  color: `${index === 0
                    ? "var(--gray-900, #101828)"
                    : "var(--gray-600, #475467)"
                    }`,
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: `${index === 0 ? "500" : null}`,
                }}
              >
                <Typography textTransform={"capitalize"}>{detail}</Typography>
              </div>
            );
          })}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      width: "30%",
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
    }
  ];
  return (
    <Table
      sticky
      size="large"
      columns={columns}
      dataSource={getInfoNeededToBeRenderedInTable}
      onRow={(record) => {
        return {
          onClick: () => { handleDataDetailUser(record) }
        };
      }}
      style={{ cursor: "pointer" }}
      pagination={{
        position: ["bottomCenter"],
      }}
      className="table-ant-customized"
    />

  );
}
