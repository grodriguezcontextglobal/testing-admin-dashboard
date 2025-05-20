import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import Loading from "../../../components/animation/Loading";
import { groupBy } from "lodash";
import { Subtitle } from "../../../styles/global/Subtitle";
import { Button, Table } from "antd";
import { LightBlueButton } from "../../../styles/global/LightBlueButton";
import { BlueButton } from "../../../styles/global/BlueButton";
import { Typography } from "@mui/material";
import LightBlueButtonText from "../../../styles/global/LightBlueButtonText";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import UpdatingConsumerLease from "../action/UpdatingConsumerLease";
const LeasesTable = () => {
  const [openReturnDeviceStaffModal, setOpenReturnDeviceStaffModal] =
    useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const [assignedEquipmentList, setAssignedEquipmentList] = useState([]);
  const consumerInfoQuery = useQuery({
    queryKey: ["consumerSqlInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/db_consumer/consulting-consumer", {
        email: customer.email,
      }),
    refetchOnMount: false,
  });
  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList"],
    queryFn: () => devitrakApi.post("/image/images", { company: user.company }),
    refetchOnMount: false,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    consumerInfoQuery.refetch();
    listImagePerItemQuery.refetch();
    itemsInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const refetchingQueries = () => {
    consumerInfoQuery.refetch();
    listImagePerItemQuery.refetch();
    itemsInInventoryQuery.refetch();
  };
  const fetchLeasePerConsumerObject = async (consumerObject) => {
    const assignedEquipmentStaffQuery = await devitrakApi.post(
      "/db_lease/consulting-consumer-lease",
      {
        consumer_member_id: checkArray(consumerObject).consumer_id,
      }
    );
    if (assignedEquipmentStaffQuery.data.ok) {
      setAssignedEquipmentList(assignedEquipmentStaffQuery.data.lease);
    }
    return assignedEquipmentList;
  };

  useEffect(() => {
    const controller = new AbortController();
    const consumerObject = consumerInfoQuery?.data?.data?.consumer;
    if (Array.isArray(consumerObject) && consumerObject.length > 0) {
      fetchLeasePerConsumerObject(consumerObject);
    }
    return () => {
      controller.abort();
    };
  }, [consumerInfoQuery.data, consumerInfoQuery.isLoading]);
  if (itemsInInventoryQuery.isLoading && listImagePerItemQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (itemsInInventoryQuery.data && listImagePerItemQuery.data) {
    const groupingImage = groupBy(
      listImagePerItemQuery.data.data.item,
      "item_group"
    );
    const groupSerialNumber = groupBy(
      itemsInInventoryQuery.data.data.items,
      "item_id"
    );
    const dataSpecificItemInAssignedDevicePerconsumerObject = (props) => {
      return {
        devicePhoto:
          groupingImage[groupSerialNumber[props]?.at(-1)?.item_group]?.at(-1)
            .source,
        item_id_info: groupSerialNumber[props]?.at(-1),
      };
    };
    const columns = [
      {
        title: "Device name",
        dataIndex: "device_id",
        key: "device_id",
        responsive: ["sm"],
        render: (device_id) => (
          <span style={Subtitle}>
            {
              dataSpecificItemInAssignedDevicePerconsumerObject(device_id)
                ?.item_id_info?.item_group
            }
          </span>
        ),
      },
      {
        title: "Date and Time Assigned",
        dataIndex: "subscription_initial_date",
        key: "subscription_initial_date",
        responsive: ["sm"],
        render: (subscription_initial_date) => (
          <span style={Subtitle}>
            {new Date(subscription_initial_date).toUTCString()}
          </span>
        ),
      },
      {
        title: "Serial Number",
        dataIndex: "address",
        key: "address",
        render: (_, record) => (
          <span style={Subtitle}>
            {
              dataSpecificItemInAssignedDevicePerconsumerObject(
                record.device_id
              )?.item_id_info?.serial_number
            }
          </span>
        ),
      },
      {
        title: "Value",
        dataIndex: "address",
        key: "address",
        responsive: ["sm"],
        render: (_, record) => (
          <span style={Subtitle}>
            {" "}
            $
            {
              dataSpecificItemInAssignedDevicePerconsumerObject(
                record.device_id
              )?.item_id_info?.cost
            }
          </span>
        ),
      },
      {
        title: "",
        dataIndex: "address",
        key: "address",
        render: (_, record) => (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <Button
              onClick={() => {
                setDeviceInfo({
                  ...record,
                  ...dataSpecificItemInAssignedDevicePerconsumerObject(
                    record.device_id
                  ),
                });
                setOpenReturnDeviceStaffModal(true);
              }}
              disabled={record.active === 0}
              style={record.active === 0 ? LightBlueButton : BlueButton}
            >
              <Typography
                style={
                  record.active === 0
                    ? { ...LightBlueButtonText, color: "#83a9f6" }
                    : BlueButtonText
                }
              >
                Mark as returned
              </Typography>
            </Button>
            <Button disabled style={GrayButton}>
              <Typography
                style={
                  record.active === 0
                    ? { ...GrayButtonText, color: "#a5a5a5" }
                    : GrayButtonText
                }
              >
                Mark as lost
              </Typography>
            </Button>
          </div>
        ),
      },
    ];
    if (
      itemsInInventoryQuery.isLoading ||
      listImagePerItemQuery.isLoading ||
      consumerInfoQuery.isLoading
    )
      return (
        <div style={CenteringGrid}>
          <Loading />
        </div>
      );
    if (
      itemsInInventoryQuery.data &&
      listImagePerItemQuery.data &&
      consumerInfoQuery.data
    ) {
      return (
        <div style={{ width: "100%" }} key={location.key}>
          <Table
            style={{ width: "100%" }}
            columns={columns}
            dataSource={assignedEquipmentList}
            className="table-ant-customized"
          />
          {openReturnDeviceStaffModal && (
            <UpdatingConsumerLease
              openReturnDeviceStaffModal={openReturnDeviceStaffModal}
              setOpenReturnDeviceStaffModal={setOpenReturnDeviceStaffModal}
              deviceInfo={deviceInfo}
              refetching={refetchingQueries}
            />
          )}
        </div>
      );
    }
  }
};

export default LeasesTable;
