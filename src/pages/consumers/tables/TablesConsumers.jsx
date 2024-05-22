import { Chip } from "@mui/material";
import { Avatar, Table } from "antd";
import _ from 'lodash';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import "../../../styles/global/ant-table.css";

export default function TablesConsumers({ getInfoNeededToBeRenderedInTable }) {
  const { user } = useSelector((state) => state.admin)
  const [dataSortedAndFilterToRender, setDataSortedAndFilterToRender] = useState([])
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

  const currentStatus = (props) => {
    const grouping = _.groupBy(props, 'device.status')
    if (grouping[true]) return true;
    return false
  }
  const dataToRenderInTable = async () => {
    const result = new Set()
    for (let data of getInfoNeededToBeRenderedInTable) {
      const fetching = await devitrakApi.post('/receiver/receiver-assigned-users-list', {
        user: data.email,
        provider: user.company
      })
      if (fetching.data.ok) {
        result.add({ ...data, currentActivity: fetching.data.listOfReceivers, status: currentStatus(fetching.data.listOfReceivers) })
      }
    }
    return setDataSortedAndFilterToRender(Array.from(result))
  }

  useEffect(() => {
    const controller = new AbortController()
    dataToRenderInTable()
    return () => {
      controller.abort()
    }
  }, [getInfoNeededToBeRenderedInTable])

  const renderingStyle = {
    ...TextFontsize18LineHeight28, fontSize: "14px", lineHeight: "20px", color: "var(--Gray-600, #475467)",
    alignSelf: "stretch", fontWeight: 500,
  }
  const renderingRowStyle = {
    ...TextFontsize18LineHeight28, fontSize: "12px", lineHeight: "18px", color: "var(--Indigo-700, #3538CD)",
    alignSelf: "stretch", fontWeight: 400,
  }

  const renderingStyleInChip = (props) => {
    return <p style={renderingRowStyle}>{props}</p>
  }

  const renderingRowStyling = (props) => {
    return <p style={renderingStyle}>{props}</p>
  }

  const columns = [
    {
      title: renderingRowStyling("User"),
      dataIndex: "user",
      width: "fit-content",
      sorter: {
        compare: (a, b) => ("" + a.user).localeCompare(b.user),
      },
      render: (user) => (
        <span key={`${user}`} style={{ display: "flex", justifyContent: "flex-start", alignSelf: "flex-start", gap: "5px" }}>
          <Avatar />
          {user.map((detail, index) => {
            return (
              <div key={`${detail}-${index}`}
                style={{
                  flexDirection: "column",
                  color: "var(--gray-600, #475467)",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: 500,
                }}
              >
                <p style={{ ...renderingStyle, textTransform: "capitalize" }} >{detail}</p>
              </div>
            );
          })}
        </span>
      ),
    },    {
      title: <div style={{ width: "fit-content" }}>{renderingRowStyling("Status")}</div>,
      dataIndex: "email",
      width: "10%",
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
      render: (email) => (
        <p style={renderingStyle}>{email}</p>
      )
    },

    {
      title: <div style={{ width: "fit-content" }}>{renderingRowStyling("Email")}</div>,
      dataIndex: "email",
      width: "fit-content",
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
      render: (email) => (
        <p style={renderingStyle}>{email}</p>
      )
    },
    {
      title: renderingRowStyling("Devices"),
      dataIndex: "currentActivity",
      sorter: {
        compare: (a, b) => ("" + a.currentActivity).localeCompare(b.currentActivity),
      },
      width: "10%",
      render: (currentActivity) => (
        <p style={{ ...renderingStyle, width: "fit-content" }}>{currentActivity.length}</p>
      )
    },

    {
      title: renderingRowStyling("Events"),
      dataIndex: "entireData",
      width: "fit-content",
      render: (entireData) => (
        <><Chip style={{background: "var(--Indigo-50, #EEF4FF)"}} label={renderingStyleInChip(entireData.eventSelected.at(-1))} />&nbsp;{entireData.eventSelected.length > 1 && <Chip label={renderingRowStyling(`+${(Number(entireData.eventSelected.length) - 1)}`)} />}</>
      )
    }

  ];
  return (
    <Table
      sticky
      size="large"
      columns={columns}
      dataSource={dataSortedAndFilterToRender}
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
