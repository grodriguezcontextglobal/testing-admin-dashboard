import BaseTable from "./BaseTable";

const ExpandableTable = ({
  columns,
  dataSource,
  expandable,
  expandRowByClick = true, // Default to true
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
    />
  );
};

export default ExpandableTable;
