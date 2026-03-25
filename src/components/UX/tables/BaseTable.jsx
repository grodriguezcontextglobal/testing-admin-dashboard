import { Table } from "antd";
import PropTypes from "prop-types";
import "../../../styles/global/ant-table.css";

const BaseTable = ({
  columns,
  dataSource,
  enablePagination = true,
  pageSize = 10,
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
      className="table-ant-customized"
      style={{width:"100%"}}
    />
  );
};

BaseTable.propTypes = {
  columns: PropTypes.array.isRequired,
  dataSource: PropTypes.array.isRequired,
  enablePagination: PropTypes.bool,
  pageSize: PropTypes.number,
};

BaseTable.defaultProps = {
  enablePagination: false,
  pageSize: 10,
};

export default BaseTable;
