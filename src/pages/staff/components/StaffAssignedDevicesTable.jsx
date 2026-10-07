import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";
import BaseTable from "../../../components/UX/tables/BaseTable";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import { staffLeaseRows } from "../utils/staffLeaseTable";

/**
 * The devices staff are holding.
 *
 * The staff page had one view, its table of people. Members has had a tabbed
 * navigator for a while — all / overdue / readiness — and this is the same
 * idea asked for here (2026-10-06): see the people, but also what they are
 * holding.
 *
 * No due date, no status, no overdue (2026-10-07): staff keep a device until
 * they leave or it has to change, so lateness here would be noise. The
 * inventory lookup is what turns a device id into a serial somebody recognises.
 */
const StaffAssignedDevicesTable = () => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;

  const leasesQuery = useQuery({
    queryKey: ["staffLeaseStatus", companyId],
    queryFn: () =>
      devitrakApi.post("/db_lease/status", {
        company_id: companyId,
        lessee_type: "staff",
      }),
    enabled: !!companyId,
  });

  /* The same company inventory the staff equipment tab fetches; shared cache
     key so opening both does not ask twice. */
  const itemsQuery = useQuery({
    queryKey: ["ItemsInventoryCheckingQuery", companyId],
    queryFn: () => devitrakApi.post("/db_item/consulting-item", { company_id: companyId }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const itemsById = useMemo(() => {
    const items = itemsQuery.data?.data?.items ?? [];
    return new Map(items.map((item) => [item.item_id, item]));
  }, [itemsQuery.data]);

  const leases = useMemo(
    () => leasesQuery.data?.data?.leases ?? [],
    [leasesQuery.data]
  );

  /* A lease row carries the staff member's SQL id and no name, and an id
     identifies nobody at a glance. Resolved the way the device profile does
     it: the id gives the email, and the email gives the name among the
     company's employees. Shared query keys, so opening this tab after the
     staff table costs nothing. */
  const staffIds = useMemo(
    () => [
      ...new Set(
        leases
          .filter((lease) => lease?.lessee_type === "staff")
          .map((lease) => lease?.lessee_id)
          .filter((id) => id !== undefined && id !== null && `${id}`.trim())
          .map(String)
      ),
    ],
    [leases]
  );

  const employeesQuery = useQuery({
    queryKey: ["employeesPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", { _id: user?.companyData?.id }),
    enabled: !!user?.companyData?.id,
    staleTime: 5 * 60 * 1000,
  });

  const staffRecordQueries = useQueries({
    queries: staffIds.map((staffId) => ({
      queryKey: ["staffRecordById", staffId],
      queryFn: () =>
        devitrakApi.post("/db_staff/consulting-member", { staff_id: staffId }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  /* useQueries hands back a new array every render, so the memo keys on the
     emails it resolved rather than on the array itself. */
  const staffEmails = staffRecordQueries
    .map((query) => checkArray(query?.data?.data?.member)?.email ?? "")
    .join("|");

  const staffById = useMemo(() => {
    const employees =
      employeesQuery.data?.data?.company?.[0]?.employees ?? [];
    const index = new Map();
    staffIds.forEach((staffId, position) => {
      const email = staffEmails.split("|")[position] ?? "";
      if (!email) return;
      const match = employees.find(
        (employee) =>
          `${employee?.user ?? ""}`.trim().toLowerCase() === email.toLowerCase()
      );
      const name = [match?.firstName, match?.lastName]
        .map((part) => `${part ?? ""}`.trim())
        .filter(Boolean)
        .join(" ");
      index.set(staffId, { name, email });
    });
    return index;
  }, [staffIds, staffEmails, employeesQuery.data]);

  const rows = useMemo(
    () => staffLeaseRows(leases, { itemsById, staffById }),
    [leases, itemsById, staffById]
  );

  const columns = [
    {
      title: "Device",
      dataIndex: "deviceLabel",
      key: "device",
      render: (label, row) =>
        row.deviceId ? (
          <Link to={`/inventory/item?id=${row.deviceId}`}>{label}</Link>
        ) : (
          label
        ),
    },
    {
      title: "Held by",
      key: "holder",
      render: (_, row) => (
        <span style={{ display: "flex", flexDirection: "column" }}>
          <span>{row.holderName}</span>
          {/* The email is the one thing that cannot repeat in a company with
              two people of the same name. */}
          {row.holderEmail && (
            <span style={{ fontSize: "0.8125rem", color: "var(--gray-500, #777b73)" }}>
              {row.holderEmail}
            </span>
          )}
        </span>
      ),
    },
  ];

  if (!leasesQuery.isLoading && rows.length === 0) {
    return (
      <EmptyState
        title="No devices are out with staff"
        description="Devices handed to a staff member show up here until they come back."
      />
    );
  }

  return (
    <>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: "0.875rem",
          color: "var(--gray-600, #5d615a)",
        }}
      >
        {rows.length} {rows.length === 1 ? "device" : "devices"} out
      </p>
      <BaseTable
        className="profile-table"
        columns={columns}
        dataSource={rows}
        rowKey={(row) => row.key}
        loading={leasesQuery.isLoading}
        enablePagination={rows.length > 10}
        pageSize={10}
        size="small"
      />
    </>
  );
};

export default StaffAssignedDevicesTable;
