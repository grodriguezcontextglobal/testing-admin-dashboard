import { Button } from "antd";
import { groupBy } from "lodash";
import { useState } from "react";
import { useSelector } from "react-redux";
import { utils, writeFile } from "xlsx";
import { devitrakApi } from "../../../api/devitrakApi";
import { XLSXIcon } from "../../../components/icons/XLSXIcon";

const DownLoadReportButton = () => {
  const { user } = useSelector((state) => state.admin);
  const [isLoadingState, setIsLoadingState] = useState(false);

  const fetchStaffMemberSQLInfo = async () => {
    try {
      setIsLoadingState(true);
      const query = `SELECT staff_id, email from staff_member where email in (${user.companyData.employees.map(
        () => "?"
      )})`;
      const values = [...user.companyData.employees.map((emp) => emp.user)];
      const x = await devitrakApi.post(
        "/db_event/inventory-based-on-submitted-parameters",
        {
          query,
          values,
        }
      );
      return x;
    } catch (error) {
      alert(error);
    } finally {
      setIsLoadingState(false);
    }
  };
  // Build joined dataset: leases + staff + item info
  const buildJoinedDataset = async () => {
    try {
      setIsLoadingState(true);
      // 1) Staff IDs for this company
      const staffSQL = await fetchStaffMemberSQLInfo();
      const staffSqlRows = staffSQL?.data?.result || [];
      if (staffSqlRows.length === 0) {
        return [];
      }

      // 2) Active leases for each staff member. Each request is independent
      // of the others (different staff_member_id), so fetch them concurrently
      // instead of awaiting one staff member at a time.
      const flatLeases = [];
      const leaseResponses = await Promise.all(
        staffSqlRows.map((st) =>
          devitrakApi.post("/db_lease/consulting-lease", {
            staff_member_id: st.staff_id,
            company_id: user.sqlInfo.company_id,
            subscription_current_in_use: 1,
          })
        )
      );
      for (const leaseResp of leaseResponses) {
        if (leaseResp?.data?.ok && Array.isArray(leaseResp?.data?.lease)) {
          flatLeases.push(...leaseResp.data.lease);
        }
      }
      if (flatLeases.length === 0) {
        return [];
      }

      // 3) Staff details and 4) item info both derive from flatLeases only
      // (not from each other), so fetch them in parallel.
      const staffIds = Array.from(
        new Set(flatLeases.map((l) => l.staff_member_id))
      ).filter(Boolean);
      const deviceIds = Array.from(
        new Set(flatLeases.map((l) => l.device_id))
      ).filter(Boolean);

      const staffDetailsPromise =
        staffIds.length > 0
          ? devitrakApi.post(
              "/db_event/inventory-based-on-submitted-parameters",
              {
                query: `SELECT staff_id, first_name, last_name, email FROM staff_member WHERE staff_id IN (${staffIds
                  .map(() => "?")
                  .join(",")})`,
                values: staffIds,
              }
            )
          : Promise.resolve(null);

      const itemsPromise =
        deviceIds.length > 0
          ? devitrakApi.post(
              "/db_event/inventory-based-on-submitted-parameters",
              {
                query: `SELECT item_id, item_group, brand, serial_number, location, warehouse, cost, category_name FROM item_inv WHERE item_id IN (${deviceIds
                  .map(() => "?")
                  .join(",")})`,
                values: deviceIds,
              }
            )
          : Promise.resolve(null);

      const [staffDetailResp, itemResp] = await Promise.all([
        staffDetailsPromise,
        itemsPromise,
      ]);

      const staffDetails = staffDetailResp?.data?.result || [];
      const staffById = groupBy(staffDetails, "staff_id");

      const itemsResult = itemResp?.data?.result || [];
      const itemsById = groupBy(itemsResult, "item_id");

      // 5) Join into flat rows for export
      const joinedRows = flatLeases.map((lease) => {
        const item = itemsById[lease.device_id]?.[0] || {};
        const staff = staffById[lease.staff_member_id]?.[0] || {};
        return {
          Company: user.company ?? user.companyData?.company_name ?? "",
          Staff_Name:
            [staff.first_name, staff.last_name].filter(Boolean).join(" ") || "",
          Staff_Email: staff.email ?? "",
          Device_ID: lease.device_id ?? item.item_id ?? "",
          Device_Name: item.item_group ?? "",
          Brand: item.brand ?? "",
          Serial_Number: item.serial_number ?? "",
          Warehouse: item.location ?? "",
          Category_Name: item.category_name ?? "",
          Cost: item.cost ?? "",
          Assignment_Begins_Date:
            new Date(lease.subscription_initial_date).toLocaleString() ?? "",
        };
      });

      return joinedRows;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setIsLoadingState(false);
    }
  };

  const exportToXLSX = async (rows) => {
    if (!rows || rows.length === 0) return;
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Staff_Members_Assigned_Devices");
    const filename = `staff_members_assigned_devices_${Date.now()}.xlsx`;
    await writeFile(wb, filename);
  };

  const handleDownloadReport = async () => {
    const dataset = await buildJoinedDataset();
    await exportToXLSX(dataset);
  };
  return (
    <Button
      style={{
        display: "flex",
        alignItems: "center",
        borderTop: "transparent",
        borderLeft: "transparent",
        borderBottom: "transparent",
        borderRadius: "8px 8px 0 0",
      }}
      onClick={handleDownloadReport}
      loading={isLoadingState}
    >
      <p
        style={{
          textTransform: "none",
          textAlign: "left",
          fontWeight: 500,
          fontSize: "12px",
          fontFamily: "Inter",
          lineHeight: "28px",
          color: "var(--blue-dark-700, #004EEB)",
          padding: "0px",
        }}
      >
        <XLSXIcon />&nbsp;
        Download Report
      </p>
    </Button>
  );
};

export default DownLoadReportButton;
