import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import DownDoubleArrowIcon from "../../../../../components/icons/DownDoubleArrowIcon.jsx";
import UpDoubleArrow from "../../../../../components/icons/UpDoubleArrow.jsx";
import { checkArray } from "../../../../../components/utils/checkArray";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import "../../../../../styles/global/ant-select.css";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import ModalReturnDeviceFromStaff from "./ModalReturnDeviceFromStaff";
function ListEquipment() {
  const [openReturnDeviceStaffModal, setOpenReturnDeviceStaffModal] =
    useState(false);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
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
    enabled: !!user.uid,
    staleTime: 60 * 60,
  });
  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList"],
    queryFn: () => devitrakApi.post("/image/images", { company: user.company }),
    enabled: !!user.uid,
    staleTime: 60 * 60,
  });
  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!user.uid,
    staleTime: 60 * 60,
  });

  // useEffect(() => {
  //   const controller = new AbortController();
  //   staffMemberQuery.refetch();
  //   listImagePerItemQuery.refetch();
  //   itemsInInventoryQuery.refetch();
  //   return () => {
  //     controller.abort();
  //   };
  // }, []);

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

  // Build per-verification document list and overall status
  const [verificationDetailsMap, setVerificationDetailsMap] = useState({});
  useEffect(() => {
    const deriveTitleFromUrl = (url) => {
      try {
        const last = url?.split("/")?.pop() || "";
        return decodeURIComponent(last);
      } catch {
        return url || "Document";
      }
    };

    const run = async () => {
      if (!assignedEquipmentList?.length) return;

      const map = {};
      for (const row of assignedEquipmentList) {
        const verificationId = row.verification_id;
        if (!verificationId) continue;

        let docs = [];
        try {
          // Prefer fetching the verification document to read its contract_list
          const res = await devitrakApi.post(`/document/verification/staff_member/check_signed_document`, {
            verificationID: verificationId,
          });
          const contractList =
            res?.data?.contract_info?.contract_list ||
            res?.data?.verification?.contract_list ||
            res?.data?.data?.contract_list ||
            [];

          if (Array.isArray(contractList) && contractList.length > 0) {
            docs = contractList.map((c) => ({
              key: c._id || c.document_url,
              title: deriveTitleFromUrl(c.document_url),
              url: c.document_url,
              signed: !!c.signature,
            }));
          }
        } catch (e) {
          // If the fetch by verification_id fails or returns no data, leave docs empty
        }

        const allSigned = docs.length > 0 && docs.every((d) => d.signed);
        map[verificationId] = { docs, allSigned };
      }

      setVerificationDetailsMap(map);
    };

    run();
  }, [assignedEquipmentList]);
  const groupingImage = groupBy(
    listImagePerItemQuery?.data?.data?.item,
    "item_group"
  );
  const groupSerialNumber = groupBy(
    itemsInInventoryQuery?.data?.data?.items,
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
      title: "Contract Status",
      key: "contract_status",
      render: (_, record) => {
        const verificationId = record.verification_id;
        const allSigned =
          verificationId && verificationDetailsMap[verificationId]?.allSigned;
        return renderStatusBadge(!!allSigned);
      },
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
            func={() => {
              setDeviceInfo({
                ...record,
                ...dataSpecificItemInAssignedDevicePerStaffMember(
                  record.device_id
                ),
              });
              setOpenReturnDeviceStaffModal(true);
            }}
            buttonType="button"
            titleStyles={{
              textTransform: "none",
              with: "100%",
              gap: "2px",
            }}
            disabled={record.active === 0}
          />
          <GrayButtonComponent
            title={"Mark as lost"}
            func={() => null}
            disabled={true}
          />
        </div>
      ),
    },
  ];

  // Single expanded row control (moved here to avoid conditional hook call)
  const getRowKey = (record) =>
    `${record.device_id}-${record.subscription_initial_date}`;

  const renderStatusBadge = (isSigned) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        lineHeight: 1.6,
        fontWeight: 600,
        color: isSigned ? "#155724" : "#8a2a2a",
        background: isSigned ? "#d4edda" : "#f8d7da",
        border: `1px solid ${isSigned ? "#c3e6cb" : "#f5c6cb"}`,
      }}
    >
      {isSigned ? "Signed" : "Pending"}
    </span>
  );

  // New: Expanded row with document links and per-document status
  const expandedRowRender = (record) => {
    const verificationId = record.verification_id;
    const docs =
      (verificationId && verificationDetailsMap[verificationId]?.docs) || [];

    const data = docs.map((doc) => ({
      key: doc.key,
      title: doc.title,
      url: doc.url,
      signed: !!doc.signed,
    }));

    const innerColumns = [
      { title: "Document Name", dataIndex: "title", key: "title" },
      {
        title: "Signed",
        dataIndex: "signed",
        key: "signed",
        render: (signed) => renderStatusBadge(!!signed),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, rowDoc) => {
          const href = `/display-contracts?company_id=${encodeURIComponent(
            user.companyData.id
          )}&contract_url=${encodeURIComponent(
            rowDoc.url
          )}&staff_member_id=${encodeURIComponent(
            profile.adminUserInfo.id
          )}&date_reference=${encodeURIComponent(
            record.subscription_initial_date
          )}`;
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#1677ff" }}
            >
              View & Sign
            </a>
          );
        },
      },
    ];
    return (
      <Table
        columns={innerColumns}
        dataSource={data}
        pagination={false}
        style={{ width: "100%" }}
        className="table-ant-customized"
      />
    );
  };
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
          rowKey={getRowKey}
          expandable={{
            expandedRowRender,
            expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
            onExpand: (expanded, record) => {
              const key = getRowKey(record);
              setExpandedRowKey(expanded ? key : null);
            },
            expandIcon: ({ expanded, onExpand, record }) => (
              <span
                onClick={(e) => onExpand(record, e)}
                role="button"
                aria-label={expanded ? "Collapse row" : "Expand row"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {expanded ? <UpDoubleArrow /> : <DownDoubleArrowIcon />}
              </span>
            ),
          }}
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

export default ListEquipment;
