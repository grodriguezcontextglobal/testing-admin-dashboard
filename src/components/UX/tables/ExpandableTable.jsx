import BaseTable from "./BaseTable";

const ExpandableTable = ({
  columns,
  dataSource,
  expandable,
  expandRowByClick = true, // Default to true
  enablePagination = true, // Default to true
  pageSize = 10, // Default to 10
  ...props
}) => {
  const expandableProps = {
    ...expandable,
    expandRowByClick,
  };

  return (
    <BaseTable
      columns={columns}
      dataSource={dataSource}
      expandable={expandableProps}
      {...props}
      enablePagination={enablePagination}
      pageSize={pageSize}
    />
  );
};

export default ExpandableTable;
