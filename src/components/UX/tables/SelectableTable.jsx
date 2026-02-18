import { Table } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";
import "./selectable-table.css";

/**
 * SelectableTable Component
 *
 * A highly modular and reusable table component with row selection, pagination,
 * and expandable row capabilities.
 *
 * @param {object} props - Component props
 * @param {Array} props.dataSource - Data array for the table
 * @param {Array} props.columns - Column definitions
 * @param {string} props.rowKey - Key for each row (default: 'key' or 'id')
 * @param {string} props.selectionMode - 'single' | 'multiple' | 'none'
 * @param {function} props.onSelectionChange - Callback (selectedKeys, selectedRows)
 * @param {function} props.renderExpandedRow - Function to render expanded content
 * @param {object} props.pagination - Pagination config or boolean
 * @param {boolean} props.loading - Loading state
 * @param {string} props.className - Custom class names
 * @param {object} props.expandableConfig - Additional config for expandable rows (e.g. expandIcon, rowExpandable)
 * @returns {JSX.Element}
 */
const SelectableTable = ({
  dataSource = [],
  columns = [],
  rowKey = "key",
  selectionMode = "multiple",
  onSelectionChange,
  renderExpandedRow,
  pagination = { defaultPageSize: 10, position: ["bottomCenter"] },
  loading = false,
  className = "",
  expandableConfig = {},
  rowSelectionConfig = {}, // New prop for extra rowSelection options
  selectedRowKeys: controlledSelectedRowKeys, // Optional: controlled state
  ...rest
}) => {
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState([]);

  // Use controlled state if provided, otherwise internal
  const selectedKeys =
    controlledSelectedRowKeys !== undefined
      ? controlledSelectedRowKeys
      : internalSelectedRowKeys;

  // Handle row selection changes
  const handleRowSelectChange = (newSelectedRowKeys, selectedRows) => {
    if (controlledSelectedRowKeys === undefined) {
      setInternalSelectedRowKeys(newSelectedRowKeys);
    }
    if (onSelectionChange) {
      onSelectionChange(newSelectedRowKeys, selectedRows);
    }
  };

  // Row selection configuration
  const rowSelection =
    selectionMode === "none"
      ? null
      : {
          type: selectionMode === "single" ? "radio" : "checkbox",
          selectedRowKeys: selectedKeys,
          onChange: handleRowSelectChange,
          columnWidth: 48,
          ...rowSelectionConfig, // Merge extra config
        };

  // Expandable configuration
  const expandable = renderExpandedRow
    ? {
        expandedRowRender: renderExpandedRow,
        ...expandableConfig,
      }
    : undefined;

  return (
    <div className={`selectable-table-container ${className}`}>
      <Table
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        rowSelection={rowSelection}
        expandable={expandable}
        pagination={pagination}
        loading={loading}
        className="selectable-table-customized"
        {...rest}
      />
    </div>
  );
};

SelectableTable.propTypes = {
  dataSource: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  selectionMode: PropTypes.oneOf(["single", "multiple", "none"]),
  onSelectionChange: PropTypes.func,
  renderExpandedRow: PropTypes.func,
  pagination: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  loading: PropTypes.bool,
  className: PropTypes.string,
  expandableConfig: PropTypes.object,
  rowSelectionConfig: PropTypes.object,
};

export default SelectableTable;
