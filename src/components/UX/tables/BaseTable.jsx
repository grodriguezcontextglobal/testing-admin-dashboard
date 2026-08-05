import { Table } from "antd";
import PropTypes from "prop-types";
import "../../../styles/global/ant-table.css";

const BaseTable = ({
  columns,
  dataSource,
  enablePagination = true,
  pageSize = 10,
  className,
  style,
  ...props
}) => {
  const paginationConfig = enablePagination
    ? {
        pageSize: pageSize,
        position: ["bottomCenter"],
        showSizeChanger: false,
        showQuickJumper: false,
      }
    : false;

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={paginationConfig}
      {...props}
      // Caller classes are merged rather than replaced, so a page can opt into
      // extra table behaviour (e.g. hover-revealed row actions) without losing
      // the shared antd overrides.
      className={["table-ant-customized", className].filter(Boolean).join(" ")}
      style={{ width: "100%", ...style }}
    />
  );
};

BaseTable.propTypes = {
  columns: PropTypes.array.isRequired,
  dataSource: PropTypes.array.isRequired,
  enablePagination: PropTypes.bool,
  pageSize: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
};

BaseTable.defaultProps = {
  enablePagination: false,
  pageSize: 10,
};

export default BaseTable;
