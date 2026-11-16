import { Link } from "react-router";
import { StatusChip } from "../../../components/UX/profile";
import { formatSectionValue, sectionStatusTone } from "../utils/clientProfile";

/**
 * Column configs ({ key, title, format, align }) → BaseTable columns.
 * "status" renders a StatusChip; "company" links to that client's profile.
 *
 * Kept apart from the console's components so that a file never exports both a
 * component and a helper, which costs Fast Refresh the whole module on edit.
 */
export const toTableColumns = (columns) =>
  columns.map((column) => ({
    title: column.title,
    dataIndex: column.key,
    key: column.key,
    align: column.align,
    render: (value, row) => {
      if (column.format === "status" && value) {
        return <StatusChip label={formatSectionValue("status", value)} tone={sectionStatusTone(value)} />;
      }
      if (column.format === "company") {
        return row.companyId && value ? (
          <Link
            to={`/platform/clients/${encodeURIComponent(row.companyId)}`}
            style={{ color: "var(--blue-dark-600, #155eef)", fontWeight: 500 }}
          >
            {value}
          </Link>
        ) : (
          "—"
        );
      }
      return (
        <span style={column.align === "right" ? { fontVariantNumeric: "tabular-nums" } : undefined}>
          {formatSectionValue(column.format, value, row)}
        </span>
      );
    },
  }));
