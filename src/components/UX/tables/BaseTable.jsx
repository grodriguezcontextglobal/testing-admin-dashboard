import { Table } from "antd";
import { styled } from "@mui/material";

const StyledTable = styled(Table)({
  width: "100%",
  borderRadius: "12px",
  border: "1px solid var(--gray-200)",
  background: "var(--base-white)",
  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)"
});

const BaseTable = ({ columns, dataSource, ...props }) => {
  return (
    <StyledTable 
      columns={columns}
      dataSource={dataSource}
      {...props}
    />
  );
};

export default BaseTable;