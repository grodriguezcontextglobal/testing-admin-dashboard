import { Table } from "antd";
import PropTypes from "prop-types";
import { resolveTableLoading } from "./tableLoading";
import "../../../styles/global/ant-table.css";

const BaseTable = ({
  columns,
  dataSource,
  // Taken out of `...props` on purpose: antd only lets you replace its dot
  // spinner through the object form, so a boolean reaching the table
  // untouched is a table waiting with antd's spinner instead of ours.
  loading,
  loadingLabel,
  // `false`, and it has to stay `false`. The signature said `true` while a
  // defaultProps block below said `false`, and defaultProps wins — React fills
  // missing props before the function runs, so the parameter default never
  // fired. Seven screens render this without passing the prop and have always
  // got an unpaginated table. Removing defaultProps for the React 18.3
  // deprecation without moving `false` up here would switch all seven to
  // paginated at once.
  enablePagination = false,
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
      loading={resolveTableLoading(loading, { label: loadingLabel })}
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
  /** Boolean, or antd's own `{spinning, indicator}` when a screen needs one. */
  loading: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  /** Names what is loading, for screen readers: "Loading inventory…". */
  loadingLabel: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default BaseTable;
