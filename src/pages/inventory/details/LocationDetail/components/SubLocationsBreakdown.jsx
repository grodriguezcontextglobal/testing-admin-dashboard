import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { devitrakApi } from "../../../../../api/devitrakApi";

/**
 * Sub-locations breakdown for a location page — makes the rooms/storage
 * inside this location visible at a glance. Each chip filters the table to
 * that sub-location path (same navigation-state mechanism as the tree view).
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

const SubLocationsBreakdown = ({ locationName }) => {
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const activePath = location.state?.sub_location
    ? decodeURIComponent(location.state.sub_location)
    : null;

  const treeQuery = useQuery({
    queryKey: ["locationsAndSublocationsWithTypes"],
    queryFn: () =>
      devitrakApi.get(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`
      ),
    enabled: !!user?.sqlInfo?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const node = treeQuery.data?.data?.data?.[locationName];
  if (!node?.children) return null;

  // flatten the tree into chip entries: [pathArray, total]
  const entries = [];
  const walk = (children, prefix) => {
    for (const [name, child] of Object.entries(children)) {
      const path = [...prefix, name];
      entries.push([path, child.total]);
      if (child.children) walk(child.children, path);
    }
  };
  walk(node.children, []);
  if (!entries.length) return null;

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
        Sub-locations in {locationName}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <Link
          to={`${location.pathname}${location.search}`}
          state={null}
          style={{
            ...chipBase,
            ...(activePath === null
              ? {
                  background: "var(--gray-900, #171d1a)",
                  borderColor: "var(--gray-900, #171d1a)",
                  color: "var(--base-white, #fff)",
                }
              : {}),
          }}
        >
          All areas
        </Link>
        {entries.map(([path, total]) => {
          const pathStr = path.join(",");
          const isActive = activePath === pathStr;
          return (
            <Link
              key={pathStr}
              to={`${location.pathname}${location.search}`}
              state={{ sub_location: encodeURIComponent(pathStr) }}
              style={{
                ...chipBase,
                ...(isActive
                  ? {
                      background: "var(--gray-900, #171d1a)",
                      borderColor: "var(--gray-900, #171d1a)",
                      color: "var(--base-white, #fff)",
                    }
                  : {}),
              }}
            >
              {path.join(" › ")}
              <span
                style={{
                  fontWeight: 500,
                  color: isActive
                    ? "var(--gray-300, #c6c7bb)"
                    : "var(--gray-500, #777b73)",
                }}
              >
                {Number(total).toLocaleString()}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SubLocationsBreakdown;
