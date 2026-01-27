import { DownNarrow } from "../../icons/DownNarrow";
import { UpNarrowIcon } from "../../icons/UpNarrowIcon";
import BaseTable from "./BaseTable";

const ExpandableTable = ({ columns, dataSource, expandable, ...props }) => {
  const expandableProps = {
    expandIcon: (record) => {
      return record.expanded ? (
        <div style={{ width: "100%", textAlign: "right" }}>
          <UpNarrowIcon />
        </div>
      ) : (
        <div style={{ width: "100%", textAlign: "right" }}>
          <DownNarrow />
        </div>
      );
    },
    expandRowByClick: true,
    ...expandable,
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
