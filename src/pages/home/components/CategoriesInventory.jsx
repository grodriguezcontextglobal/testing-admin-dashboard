import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
const TableCategories = lazy(
  () => import("./category_components/TableCategories"),
);

const CategoryInventory = () => {
  const { user } = useSelector((state) => state.admin);

  const itemsQuery = useQuery({
    queryKey: ["consultingCategoriesPerCompany"],
    queryFn: () =>
      devitrakApi.post("db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });

  // derive from the query cache — no local state / effects needed
  const totalCategories = useMemo(() => {
    const items = itemsQuery.data?.data?.items ?? [];
    return new Set(items.map((i) => i.category_name)).size;
  }, [itemsQuery.data]);

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      {/* Single Untitled card: header row + table share one container */}
      <div
        style={{
          width: "100%",
          background: "var(--base-white, #fff)",
          border: "1px solid var(--gray-200, #ddded6)",
          borderRadius: "12px",
          boxShadow: "var(--shadow-xs)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-200, #ddded6)",
          }}
        >
          <h3
            style={{
              ...TextFontsize18LineHeight28,
              margin: 0,
              fontWeight: 600,
              color: "var(--gray-900, #171d1a)",
              textAlign: "left",
            }}
          >
            Categories
          </h3>
          <span
            style={{
              borderRadius: "9999px",
              background: "var(--action-50, #eff4ff)",
              color: "var(--action-700, #004eea)",
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              lineHeight: "18px",
              padding: "2px 10px",
            }}
          >
            {totalCategories} {totalCategories === 1 ? "category" : "categories"}
          </span>
        </div>
        <div className="flush-table">
          <TableCategories />
        </div>
      </div>
    </Suspense>
  );
};

export default CategoryInventory;
