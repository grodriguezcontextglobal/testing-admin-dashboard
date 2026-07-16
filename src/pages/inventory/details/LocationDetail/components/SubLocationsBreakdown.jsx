import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { devitrakApi } from "../../../../../api/devitrakApi";

/**
 * Sub-locations drill-down for a location page.
 *
 * UX: one level at a time — the chip row always shows the children of
 * wherever you currently are (top level, or inside the active sub-location).
 * Parents with deeper areas get a › affordance; empty areas render muted.
 * The page breadcrumb handles navigating back up; "All areas" resets.
 */
const chipBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  borderRadius: "var(--radius-full, 9999px)",
  border: "1px solid var(--gray-300, #c6c7bb)",
  background: "var(--base-white, #fff)",
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--gray-700, #454944)",
  textDecoration: "none",
  whiteSpace: "nowrap",
};
const chipActive = {
  background: "var(--gray-900, #171d1a)",
  borderColor: "var(--gray-900, #171d1a)",
  color: "var(--base-white, #fff)",
};
const chipEmpty = {
  borderStyle: "dashed",
  borderColor: "var(--gray-300, #c6c7bb)",
  background: "var(--gray-50, #f7f7f4)",
  color: "var(--gray-400, #a2a69b)",
  fontWeight: 500,
};

const SubLocationsBreakdown = ({ locationName }) => {
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const activePath = location.state?.sub_location
    ? decodeURIComponent(location.state.sub_location).split(",").filter(Boolean)
    : [];

  const treeQuery = useQuery({
    queryKey: ["locationsAndSublocationsWithTypes"],
    queryFn: () =>
      devitrakApi.get(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`
      ),
    enabled: !!user?.sqlInfo?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const root = treeQuery.data?.data?.data?.[locationName];
  if (!root?.children) return null;

  // walk to the active node; fall back to root if the path doesn't resolve
  let node = root;
  const resolved = [];
  for (const seg of activePath) {
    if (node.children?.[seg]) {
      node = node.children[seg];
      resolved.push(seg);
    } else break;
  }

  // one level at a time: children of the active node; at a leaf, show its
  // siblings so the row never disappears
  let level = node.children;
  let levelPrefix = resolved;
  if (!level || Object.keys(level).length === 0) {
    levelPrefix = resolved.slice(0, -1);
    let parent = root;
    for (const seg of levelPrefix) parent = parent.children[seg];
    level = parent.children ?? {};
  }
  const entries = Object.entries(level);
  if (!entries.length) return null;

  const chip = (label, count, hasChildren, path, key, extraStyle = {}) => {
    const pathStr = path.join(",");
    const isActive = resolved.join(",") === pathStr && pathStr !== "";
    const isEmpty = count === 0;
    return (
      <Link
        key={key}
        to={`${location.pathname}${location.search}`}
        state={pathStr ? { sub_location: encodeURIComponent(pathStr) } : null}
        style={{
          ...chipBase,
          ...(isEmpty && !isActive ? chipEmpty : {}),
          ...(isActive ? chipActive : {}),
          ...extraStyle,
        }}
      >
        {label}
        <span
          style={{
            fontWeight: 500,
            color: isActive
              ? "var(--gray-300, #c6c7bb)"
              : isEmpty
              ? "var(--gray-400, #a2a69b)"
              : "var(--gray-500, #777b73)",
          }}
        >
          {isEmpty ? "Empty" : Number(count).toLocaleString()}
        </span>
        {hasChildren && (
          <Icon
            icon="tabler:chevron-right"
            width={14}
            style={{ margin: "0 -4px 0 -2px" }}
          />
        )}
      </Link>
    );
  };

  return (
    <div style={{ width: "100%", margin: "8px 0 4px", textAlign: "left" }}>
      <p
        style={{
          margin: "0 0 8px",
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--gray-600, #5d615a)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Icon icon="tabler:map-pin" width={15} />
        {resolved.length === 0
          ? `Sub-locations in ${locationName}`
          : `Inside ${resolved.join(" › ")}`}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <Link
          to={`${location.pathname}${location.search}`}
          state={null}
          style={{
            ...chipBase,
            ...(resolved.length === 0 ? chipActive : {}),
          }}
        >
          All areas
        </Link>
        {resolved.length > 0 &&
          chip(
            resolved[resolved.length - 1],
            node.total,
            false,
            resolved,
            "__current",
          )}
        {entries.map(([name, child]) =>
          chip(
            name,
            child.total,
            Boolean(child.children && Object.keys(child.children).length),
            [...levelPrefix, name],
            [...levelPrefix, name].join(","),
          )
        )}
      </div>
    </div>
  );
};

export default SubLocationsBreakdown;
