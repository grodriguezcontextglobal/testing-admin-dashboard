import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Table } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import "../../../../../styles/global/ant-select.css";
import ModalReturnDeviceFromStaff from "./ModalReturnDeviceFromStaff";
import { useLocation } from "react-router-dom";
import { checkArray } from "../../../../../components/utils/checkArray";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
const ListEquipment = () => {
  const [openReturnDeviceStaffModal, setOpenReturnDeviceStaffModal] =
    useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const [assignedEquipmentList, setAssignedEquipmentList] = useState([]);
  const staffMemberQuery = useQuery({
    queryKey: ["staffMemberInfo"],
    queryFn: () =>
      devitrakApi.post("/db_staff/consulting-member", {
        email: profile.email,
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
    staffMemberQuery.refetch();
    listImagePerItemQuery.refetch();
    itemsInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const fetchLeasePerStaffMember = async (staffMember) => {
    const staffmemberInfo = await checkArray(staffMember?.data?.member);
    const assignedEquipmentStaffQuery = await devitrakApi.post(
      "/db_lease/consulting-lease",
      {
        staff_member_id: staffmemberInfo.staff_id,
        company_id: user.sqlInfo.company_id,
        subscription_current_in_use: 1,
      }
    );
    if (assignedEquipmentStaffQuery.data.ok) {
      setAssignedEquipmentList(assignedEquipmentStaffQuery.data.lease);
    }
    return assignedEquipmentList;
  };
  useEffect(() => {
    const controller = new AbortController();
    const staffMember = staffMemberQuery?.data;
    if (staffMember) {
      fetchLeasePerStaffMember(staffMember);
    }
    return () => {
      controller.abort();
    };
  }, [staffMemberQuery.data]);
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
    const dataSpecificItemInAssignedDevicePerStaffMember = (props) => {
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
        render: (device_id) => (
          <span style={Subtitle}>
            {
              dataSpecificItemInAssignedDevicePerStaffMember(device_id)
                ?.item_id_info?.item_group
            }
          </span>
        ),
      },
      {
        title: "Date and Time Assigned",
        dataIndex: "subscription_initial_date",
        key: "subscription_initial_date",
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
              dataSpecificItemInAssignedDevicePerStaffMember(record.device_id)
                ?.item_id_info?.serial_number
            }
          </span>
        ),
      },
      {
        title: "Value",
        dataIndex: "address",
        key: "address",
        render: (_, record) => (
          <span style={Subtitle}>
            {" "}
            $
            {
              dataSpecificItemInAssignedDevicePerStaffMember(record.device_id)
                ?.item_id_info?.cost
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
            <BlueButtonComponent
              title={"Mark as returned"}
              func={() => null}
              buttonType="button"
              titleStyles={{
                textTransform: "none",
                with: "100%",
                gap: "2px",
              }}
              disabled={record.active === 0}
              
            />
            <Button
              onClick={() => {
                setDeviceInfo({
                  ...record,
                  ...dataSpecificItemInAssignedDevicePerStaffMember(
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
      staffMemberQuery.isLoading
    )
      return (
        <div style={CenteringGrid}>
          <Loading />
        </div>
      );
    if (
      itemsInInventoryQuery.data &&
      listImagePerItemQuery.data &&
      staffMemberQuery.data
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
            <ModalReturnDeviceFromStaff
              openReturnDeviceStaffModal={openReturnDeviceStaffModal}
              setOpenReturnDeviceStaffModal={setOpenReturnDeviceStaffModal}
              deviceInfo={deviceInfo}
            />
          )}
        </div>
      );
    }
  }
};

export default ListEquipment;
