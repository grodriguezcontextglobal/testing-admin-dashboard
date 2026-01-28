import { Table } from "antd";
import { styled } from "@mui/material";
import PropTypes from "prop-types";
import "../../../styles/global/ant-table.css";

const StyledTable = styled(Table)({
  width: "-webkit-fill-available",
  boxShadow:
    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
});

const BaseTable = ({
  columns,
  dataSource,
  enablePagination,
  pageSize,
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
    <StyledTable
      columns={columns}
      dataSource={dataSource}
      pagination={paginationConfig}
      {...props}
      className="table-ant-customized"
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
