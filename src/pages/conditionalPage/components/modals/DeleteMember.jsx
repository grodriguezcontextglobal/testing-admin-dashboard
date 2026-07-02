import { Icon } from "@iconify/react";
import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Typography, notification } from "antd";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import DangerButtonConfirmationComponent from "../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import BaseTable from "../../../../components/UX/tables/BaseTable";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { buildMemberRows, filterMemberRows } from "../../utils/memberTableUtils";

const cellNameStyle = {
  fontSize: "14px",
  fontFamily: "Inter",
  fontWeight: 500,
  lineHeight: "20px",
  color: "var(--gray-900, #101828)",
};

const cellSubtextStyle = {
  fontSize: "12px",
  fontFamily: "Inter",
  fontWeight: 400,
  lineHeight: "18px",
  color: "var(--gray-600, #475467)",
};

const DeleteMember = ({ openModal, setOpenModal, members = [], onDelete }) => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.admin);
  const [query, setQuery] = useState("");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [api, contextHolder] = notification.useNotification();

  const allMembersOfCompany = useQuery({
    queryKey: ["allMembersInfoDataQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        company_id: user?.sqlInfo?.company_id,
      }),
    enabled: !!user?.sqlInfo?.company_id,
  });

  const sourceMembers = useMemo(() => {
    const payload = allMembersOfCompany?.data?.data;
    const list = payload?.members || payload?.data || payload;
    const apiMembers = Array.isArray(list) ? list : [];
    return apiMembers.length ? apiMembers : members;
  }, [allMembersOfCompany?.data, members]);

  const rows = useMemo(() => buildMemberRows(sourceMembers), [sourceMembers]);
  const filtered = useMemo(() => filterMemberRows(rows, query), [rows, query]);

  const deleteMembersMutation = useMutation({
    mutationFn: async (payload) => {
      const body = Array.isArray(payload) ? { member_ids: payload } : payload;
      const res = await devitrakApi.post("/db_member/delete-member-info", body);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["allMembersInfoDataQuery"],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["membersInfoQuery"],
        exact: true,
      });
      setSelectedKeys([]);
      api.open({ message: "Member(s) deleted" });
    },
  });

  const deleteSelected = () => {
    const ids = [...selectedKeys];
    if (!ids.length) return;
    if (typeof onDelete === "function") {
      onDelete(ids);
      return setSelectedKeys([]);
    }
    deleteMembersMutation.mutate({ member_ids: ids });
  };

  const isDeleting =
    deleteMembersMutation.isPending ||
    deleteMembersMutation.status === "loading";

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: (keys) => setSelectedKeys(keys),
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      align: "left",
      sorter: { compare: (a, b) => ("" + a.name).localeCompare(b.name) },
      render: (name, record) => {
        const initials = String(name || "")
          .split(" ")
          .map((i) => i[0])
          .join("");
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Avatar src={record?.entireData?.image_url}>
              {!record?.entireData?.image_url && initials}
            </Avatar>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Typography style={cellNameStyle}>{name}</Typography>
              <Typography style={cellSubtextStyle}>
                {record?.phone ?? "+1-000-000-0000"}
              </Typography>
            </div>
          </span>
        );
      },
    },
    {
      title: "Email address",
      dataIndex: "email",
      responsive: ["lg"],
      sorter: { compare: (a, b) => ("" + a.email).localeCompare(b.email) },
      render: (email) => <Typography style={cellSubtextStyle}>{email}</Typography>,
    },
    {
      title: "Address",
      dataIndex: "address",
      responsive: ["lg"],
      sorter: { compare: (a, b) => ("" + a.address).localeCompare(b.address) },
      render: (address) => (
        <Typography style={cellSubtextStyle}>{address}</Typography>
      ),
    },
  ];

  const body = (
    <Grid container margin={"15px 0 0 0"} padding={0} gap={0}>
      <Grid
        item
        xs={12}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        gap={"12px"}
        flexWrap={"wrap"}
        border={"1px solid var(--gray-200, #eaecf0)"}
        borderRadius={"12px 12px 0 0"}
        padding={"8px 12px"}
        marginBottom={-1}
      >
        <OutlinedInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or address"
          style={{ ...OutlinedInputStyle, flex: 1, minWidth: "220px" }}
          startAdornment={
            <InputAdornment position="start">
              <MagnifyIcon />
            </InputAdornment>
          }
        />
        <GrayButtonComponent
          title="Refresh"
          iconLeading={<Icon icon="jam:refresh" />}
          func={() => allMembersOfCompany.refetch()}
          size="sm"
        />
      </Grid>

      <BaseTable
        style={{ width: "100%", cursor: "pointer" }}
        dataSource={filtered}
        columns={columns}
        rowKey={(record) => record.member_id}
        rowClassName="editable-row"
        className="table-ant-customized"
        rowSelection={{ type: "checkbox", ...rowSelection }}
        enablePagination={true}
        pageSize={5}
        loading={allMembersOfCompany.isLoading}
      />

      <Grid item xs={12} marginTop={"0.5rem"}>
        <DangerButtonConfirmationComponent
          confirmationTitle={`Are you sure you want to delete the ${selectedKeys.length} selected member(s)?`}
          title={`Delete selected member(s)${
            selectedKeys.length ? ` (${selectedKeys.length})` : ""
          }`}
          func={deleteSelected}
          styles={{ width: "100%" }}
          isDisabled={selectedKeys.length === 0}
          isLoading={isDeleting}
        />
        {deleteMembersMutation.isError ? (
          <Typography style={{ ...cellSubtextStyle, color: "var(--error, #B42318)", marginTop: 6 }}>
            Delete failed. Please try again.
          </Typography>
        ) : null}
      </Grid>
    </Grid>
  );

  return (
    <>
      {contextHolder}
      <ModalUX
        title={<p style={TextFontSize30LineHeight38}>Deleting member(s)</p>}
        body={body}
        openDialog={openModal}
        closeModal={() => setOpenModal(false)}
        width={1000}
        footer={null}
        modalStyles={{}}
      />
    </>
  );
};

export default DeleteMember;
