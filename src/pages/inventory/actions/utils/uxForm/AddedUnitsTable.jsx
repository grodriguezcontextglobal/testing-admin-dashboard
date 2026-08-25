import { Typography } from "@mui/material";
import { Table } from "antd";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";

/**
 * The units staged for creation, with their identifiers visible.
 *
 * The previous version rendered one chip per unit showing only the serial, so
 * once a device was added there was no way to check what identifiers had been
 * attached to it — the only way to correct a typo in an IMEI was to delete the
 * unit and retype it. With pasted input that matters more: fifty units land at
 * once and the whole point is being able to read them back.
 */
const AddedUnitsTable = ({ units, onRemove }) => {
  if (!units?.length) return null;

  // Identifier names differ from unit to unit by design, so the columns are the
  // union of everything present, in first-seen order.
  const identifierNames = [];
  for (const unit of units) {
    for (const { keyObject } of unit.identifiers ?? []) {
      if (!identifierNames.includes(keyObject)) identifierNames.push(keyObject);
    }
  }

  const columns = [
    {
      title: "Serial number",
      dataIndex: "serial",
      key: "serial",
      fixed: "left",
      render: (serial) => <strong>{serial}</strong>,
    },
    ...identifierNames.map((name) => ({
      title: name,
      key: name,
      render: (_, unit) =>
        unit.identifiers?.find((entry) => entry.keyObject === name)
          ?.valueObject ?? (
          <span style={{ color: "var(--gray-400, #98A2B3)" }}>—</span>
        ),
    })),
    {
      title: "",
      key: "remove",
      fixed: "right",
      render: (_, unit) => (
        <DangerButtonComponent
          title="Remove"
          buttonType="button"
          func={() => onRemove(unit.id)}
          styles={{ width: "fit-content" }}
        />
      ),
    },
  ];

  return (
    <div style={{ width: "100%", margin: "1rem 0" }}>
      <Typography
        variant="body1"
        sx={{ fontWeight: 600, mb: 1, width: "100%", textAlign: "left" }}
      >
        {units.length} unit{units.length === 1 ? "" : "s"} ready to create
      </Typography>
      <Table
        columns={columns}
        dataSource={units}
        rowKey="id"
        size="small"
        className="table-ant-customized"
        scroll={{ x: "max-content", y: 320 }}
        pagination={
          units.length > 25 ? { pageSize: 25, position: ["bottomCenter"] } : false
        }
      />
    </div>
  );
};

export default AddedUnitsTable;
