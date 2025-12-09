import { OutlinedInput } from "@mui/material";
import { useMemo, useState } from "react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useSelector } from "react-redux";

const DeleteMember = ({
  openModal,
  setOpenModal,
  members = [],
  onDelete,
}) => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.admin);
  const allMembersOfCompany = useQuery({
    queryKey: ["allMembersInfoDataQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        company_id: user?.sqlInfo?.company_id,
      }),
    enabled: !!user?.sqlInfo?.company_id,
  });
  const apiMembers = useMemo(() => {
    const payload = allMembersOfCompany?.data?.data;
    const list = payload?.members || payload?.data || payload;
    return Array.isArray(list) ? list : [];
  }, [allMembersOfCompany?.data]);
  const sourceMembers = apiMembers.length ? apiMembers : members;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const deleteMembersMutation = useMutation({
    mutationFn: async (payload) => {
      let body;
      if (Array.isArray(payload)) {
        body = { member_ids: payload };
      } else if (payload && typeof payload === "object") {
        body = payload;
      } else {
        body = { member_id: payload };
      }
      const res = await devitrakApi.post("/db_member/delete-member-info", body);
      return res?.data;
    },
    onSuccess: () => {
      // Refresh member list from server and clear current selection
      queryClient.invalidateQueries({
        queryKey: ["allMembersInfoDataQuery"],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["membersInfoQuery"],
        exact: true,
      });
      setSelected(new Set());
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sourceMembers;
    return sourceMembers.filter((m) => {
      const fields = [
        m.first_name,
        m.last_name,
        m.email,
        m.phone_number || m.phone,
        m.address,
        m.address_street,
        m.address_city,
        m.address_state,
        m.address_zip || m.address_zip_code,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(q));
    });
  }, [sourceMembers, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paged = useMemo(
    () => filtered.slice(start, end),
    [filtered, start, end]
  );

  const allIdsInView = useMemo(
    () => paged.map((m) => m.member_id).filter((id) => id !== undefined),
    [paged]
  );

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllInView = () => {
    const allSelected = allIdsInView.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allIdsInView.forEach((id) => next.delete(id));
      } else {
        allIdsInView.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const deleteSelected = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (onDelete && typeof onDelete === "function") {
      onDelete(ids);
      return setSelected(new Set());
    }
    deleteMembersMutation.mutate({ member_ids: ids });
  };

  const deleteOne = (id) => {
    if (onDelete && typeof onDelete === "function") {
      onDelete([id]);
      return setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    deleteMembersMutation.mutate({ member_id: id });
  };

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <OutlinedInput
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or address"
          style={{ ...OutlinedInputStyle, flex: 1, padding: 8 }}
        />
        <GrayButtonComponent title="Clear" func={() => setQuery("")} />
        {allMembersOfCompany.isLoading ? (
          <span style={{ color: "#6b7280" }}>Loading members…</span>
        ) : null}
        {allMembersOfCompany.isError ? (
          <span style={{ color: "crimson" }}>
            Failed to load company members.
          </span>
        ) : null}
        {deleteMembersMutation.isLoading ? (
          <span style={{ color: "#6b7280" }}>Deleting…</span>
        ) : null}
        {deleteMembersMutation.isError ? (
          <span style={{ color: "crimson" }}>Delete failed.</span>
        ) : null}
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0 8px",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>
                <input
                  type="checkbox"
                  checked={
                    allIdsInView.length > 0 &&
                    allIdsInView.every((id) => selected.has(id))
                  }
                  onChange={toggleAllInView}
                  aria-label="Select all in view"
                />
              </th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((m) => (
              <tr
                key={m.member_id}
                style={{
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(m.member_id)}
                    onChange={() => toggleOne(m.member_id)}
                    aria-label={`Select member ${m.member_id}`}
                  />
                </td>
                <td>{m.first_name}</td>
                <td>{m.last_name}</td>
                <td>{m.email}</td>
                <td>{m.phone_number || m.phone}</td>
                <td>
                  {m.address ||
                    `${m.address_street ?? ""}${
                      m.address_city ? ", " + m.address_city : ""
                    }${m.address_state ? ", " + m.address_state : ""}${
                      m.address_zip ? " " + m.address_zip : ""
                    }`}
                </td>
                <td>
                  <GrayButtonComponent
                    title="Delete"
                    func={() => deleteOne(m.member_id)}
                    loadingState={
                      deleteMembersMutation.isPending ||
                      deleteMembersMutation.status === "loading"
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <span>
          Page {currentPage} of {totalPages} ({filtered.length} result
          {filtered.length !== 1 ? "s" : ""})
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <GrayButtonComponent
            title="Prev"
            func={() => setPage((p) => Math.max(1, p - 1))}
          />
          <BlueButtonComponent
            title="Next"
            func={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      </div>
    </div>
  );

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <GrayButtonComponent title="Close" func={() => setOpenModal(false)} />
      <BlueButtonComponent
        title="Delete Selected"
        func={deleteSelected}
        disabled={selected.size === 0}
        loadingState={
          deleteMembersMutation.isPending ||
          deleteMembersMutation.status === "loading"
        }
      />
    </div>
  );

  return (
    <ModalUX
      title="Delete member(s)"
      body={body}
      openDialog={openModal}
      closeModal={setOpenModal}
      width={1000}
      footer={footer}
      modalStyles={{}}
    />
  );
};

export default DeleteMember;
