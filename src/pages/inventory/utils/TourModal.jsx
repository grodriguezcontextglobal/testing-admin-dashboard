import { Space, Tooltip, Typography } from "antd";
import { useRef } from "react";
import { utils, writeFile } from "xlsx";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import TourModals from "../../../components/UX/tours/TourModals";
import {
  INVENTORY_IMPORT_COLUMNS,
  buildGuideRow,
  buildTemplateRows,
} from "./inventoryImportTemplate";

const { Text } = Typography;

/**
 * The import guide: the table of expected headers, the tour that explains each
 * one, and the button that hands out a matching spreadsheet.
 *
 * All three are generated from INVENTORY_IMPORT_COLUMNS rather than written out
 * three times. They used to be three hand-maintained lists, which is how the
 * template kept shipping a Company column the guide had already dropped, and
 * how a tour step ("Container Items") ended up pointing at a ref that was
 * declared but never attached to any column — an anchor that resolved to null
 * on every render.
 */
const TourModal = ({ open, setOpen }) => {
  // One ref per column, created on demand and handed to both the header cell
  // and the tour step. A step can no longer reference a header that does not
  // exist: they read the same map, keyed by the same field.
  const headerRefs = useRef({});
  const headerRef = (field) => {
    if (!headerRefs.current[field]) {
      headerRefs.current[field] = { current: null };
    }
    return headerRefs.current[field];
  };

  // Three tiers, not two. A recommended column is not optional in the way a
  // truly optional one is: the row imports either way, but a blank brand or a
  // cost of 0 has to be corrected device by device afterwards.
  const tierLabel = (column) =>
    column.required ? "Mandatory field" : column.recommended ? "Recommended" : "Optional";

  const columns = INVENTORY_IMPORT_COLUMNS.map((column) => ({
    title: column.required ? (
      <Text type="danger">{column.header}*</Text>
    ) : column.recommended ? (
      <Text type="warning">{column.header}</Text>
    ) : (
      <Text>{column.header}</Text>
    ),
    dataIndex: column.field,
    key: column.field,
    width: column.width,
    onHeaderCell: () => ({ ref: headerRef(column.field) }),
  }));

  const dataSource = [buildGuideRow()];

  const steps = INVENTORY_IMPORT_COLUMNS.map((column) => ({
    title: column.header,
    description: (
      <Space direction="vertical">
        <Text strong>{tierLabel(column)}</Text>
        {column.notes?.map((note) => (
          <Text key={note}>{note}</Text>
        ))}
        {column.defaultNote && (
          <Text type="secondary">{column.defaultNote}</Text>
        )}
        <Text type="secondary">
          Also accepted as: {column.aliases.join(", ")}
        </Text>
      </Space>
    ),
    target: () => headerRef(column.field).current,
  }));

  const handleDownloadTemplate = () => {
    const worksheet = utils.json_to_sheet(buildTemplateRows());
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Template");
    writeFile(workbook, "Inventory_Template.xlsx");
  };

  return (
    <TourModals
      open={open}
      setOpen={setOpen}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Inventory Import Template Guide</span>
          <Tooltip title="Download Template">
            <BlueButtonComponent
              shape="round"
              onClick={handleDownloadTemplate}
              size="sm"
            >
              Download Template
            </BlueButtonComponent>
          </Tooltip>
        </div>
      }
      description={
        <>
          This tour guides you through the expected structure of your Excel
          (.xlsx) file. <Text type="danger">Red headers</Text> are the only
          mandatory ones — a row missing any of them is skipped. Every other
          column is optional and falls back to the default shown in its step.
          Follow the tour for accepted column names (aliases). Company is not a
          column: it is taken from your session at import time.
        </>
      }
      columns={columns}
      dataSource={dataSource}
      steps={steps}
      width={3000}
    />
  );
};

export default TourModal;
