import { useMutation, useQuery } from "@tanstack/react-query";
import { message } from "antd";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import "./containerContents.css";
import {
  buildFilterOptions,
  describeContentChanges,
  filterWarehouseItems,
  summarizeCapacity,
} from "../utils/containerContentUtils";

const FILTERS = [
  { key: "category_name", anyLabel: "Any category" },
  { key: "item_group", anyLabel: "Any group" },
  { key: "brand", anyLabel: "Any brand" },
  { key: "ownership", anyLabel: "Any ownership" },
];

const EMPTY_FILTERS = {
  category_name: "",
  item_group: "",
  brand: "",
  ownership: "",
};

const describeRow = (row) =>
  [row?.item_group, row?.brand, row?.ownership].filter(Boolean).join(" · ");

/**
 * Packing a container.
 *
 * Two panes answer the question the old single multi-select conflated: what is
 * available, and what will be inside the case when this saves. Search matches
 * the serial number against an already-populated list — the previous flow made
 * you pick from four dropdowns and press "Search items" before a single row
 * appeared, so the filters here refine rather than gate. They are also built
 * from the stock actually on hand, so a filter can never offer a value that
 * returns nothing.
 *
 * Nothing is written until Save, and the write is a single call: PUT to replace
 * the contents of a case that already has some, POST to fill an empty one.
 * There is deliberately no DELETE-then-POST — a failed POST there left the case
 * emptied with nothing to put back.
 */
const ContainerContent = ({
  openModal,
  closeModal,
  containerId,
  spotLimit,
  currentItems,
  onSaved,
}) => {
  const { user } = useSelector((state) => state.admin);
  const persistedItems = useMemo(() => currentItems ?? [], [currentItems]);
  const persistedIds = useMemo(
    () => persistedItems.map((row) => row?.item_id),
    [persistedItems],
  );

  const [stagedIds, setStagedIds] = useState(persistedIds);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const companyId = user?.sqlInfo?.company_id;

  const stockQuery = useQuery({
    queryKey: ["assignableWarehouseStock", companyId],
    queryFn: async () => {
      const response = await devitrakApi.post("/db_item/warehouse-items", {
        company_id: companyId,
        warehouse: 1,
        enableAssignFeature: 1,
      });
      const items = response.data?.items;
      return Array.isArray(items) ? items : [];
    },
    enabled: Boolean(companyId),
    refetchOnWindowFocus: false,
  });

  const stock = stockQuery.data ?? [];

  // Items already in the case are no longer warehouse stock, so the right pane
  // has to resolve them from both sources.
  const byId = useMemo(() => {
    const lookup = new Map();
    persistedItems.concat(stock).forEach((row) => {
      if (row?.item_id === undefined || row?.item_id === null) return;
      const key = String(row.item_id);
      if (!lookup.has(key)) lookup.set(key, row);
    });
    return lookup;
  }, [persistedItems, stock]);

  const available = useMemo(
    () => filterWarehouseItems(stock, { query, filters, excludeIds: stagedIds }),
    [stock, query, filters, stagedIds],
  );

  const staged = useMemo(
    () =>
      stagedIds
        .map((id) => byId.get(String(id)))
        .filter(Boolean)
        .map((row) => ({
          ...row,
          isNew: !persistedIds.some((id) => String(id) === String(row.item_id)),
        })),
    [stagedIds, byId, persistedIds],
  );

  const capacity = summarizeCapacity(stagedIds.length, spotLimit);
  const changes = describeContentChanges(persistedIds, stagedIds);
  const hasAnyRefinement =
    query.trim() !== "" || FILTERS.some(({ key }) => filters[key] !== "");

  const saveMutation = useMutation({
    mutationFn: () => {
      if (persistedIds.length > 0) {
        return devitrakApi.put(`/db_inventory/container/${containerId}`, {
          child_ids: stagedIds,
        });
      }
      return devitrakApi.post("/db_inventory/container-items", {
        container_item_id: Number(containerId),
        child_ids: stagedIds,
      });
    },
    onSuccess: () => {
      message.success("Case contents saved");
      if (onSaved) onSaved();
      closeModal();
    },
    onError: (error) =>
      message.error(`The case could not be saved: ${error.message}`),
  });

  const addItem = (itemId) => setStagedIds(stagedIds.concat([itemId]));
  const removeItem = (itemId) =>
    setStagedIds(stagedIds.filter((id) => String(id) !== String(itemId)));

  const clearRefinement = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  };

  const body = (
    <div className={`case-tone--${capacity.tone}`}>
      <div className="case-pack__head">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <h2 className="case-pack__title">Pack this case</h2>
          <p className="case-pack__subtitle">
            {capacity.hasLimit
              ? `Holds up to ${capacity.limit} items`
              : "No spot limit recorded for this case"}
          </p>
        </div>
        <span className="case-pill">
          <span className="case-pill__dot" />
          {capacity.statusLabel}
        </span>
      </div>

      <div className="case-pack__panes">
        {/* ── available stock ── */}
        <div className="case-pane case-pane--stock">
          <div className="case-pane__head">
            <div className="case-pane__title-row">
              <span className="case-pane__title">Available in warehouse</span>
              <span className="case-pane__note">
                {stockQuery.isLoading
                  ? "loading…"
                  : `${available.length} assignable`}
              </span>
            </div>

            <div className="case-search">
              <span className="case-search__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input
                className="case-field"
                placeholder="Scan or type a serial number"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="case-filters">
              {FILTERS.map(({ key, anyLabel }) => (
                <select
                  key={key}
                  className="case-field"
                  value={filters[key]}
                  onChange={(event) =>
                    setFilters({ ...filters, [key]: event.target.value })
                  }
                >
                  {buildFilterOptions(stock, key, anyLabel).map((option) => (
                    <option key={option.value || "any"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          <div className="case-list">
            {stockQuery.isError ? (
              <div className="case-list__blank">
                <p className="case-empty__title">Stock could not be loaded</p>
                <p className="case-empty__body">
                  The warehouse list is unavailable right now.
                </p>
              </div>
            ) : available.length > 0 ? (
              available.map((row) => (
                <div className="case-row" key={row.item_id}>
                  <button
                    type="button"
                    className="case-row__move"
                    onClick={() => addItem(row.item_id)}
                    aria-label={`Add ${row.serial_number} to this case`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <span className="case-row__text">
                    <span className="case-row__serial">{row.serial_number}</span>
                    <span className="case-row__meta">{describeRow(row)}</span>
                  </span>
                </div>
              ))
            ) : (
              !stockQuery.isLoading && (
                <div className="case-list__blank">
                  <span className="case-list__blank-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </span>
                  <p className="case-empty__title">
                    {hasAnyRefinement
                      ? "No stock matches that"
                      : "Everything available is already packed"}
                  </p>
                  <p className="case-empty__body">
                    Only stock in the warehouse and flagged assignable can be
                    packed.
                  </p>
                  {hasAnyRefinement && (
                    <GrayButtonComponent
                      title="Clear search and filters"
                      func={clearRefinement}
                      size="sm"
                      styles={{ margin: "4px 0 0", width: "fit-content" }}
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* ── what will be in the case ── */}
        <div className="case-pane case-pane--case">
          <div className="case-pane__head">
            <div className="case-pane__title-row">
              <span className="case-pane__title">In this case on save</span>
              <GrayButtonComponent
                title="Clear all"
                func={() => setStagedIds([])}
                isDisabled={stagedIds.length === 0}
                size="sm"
                styles={{ margin: 0, width: "fit-content" }}
              />
            </div>

            <div className="case-meter">
              <div className="case-meter__count">
                <span className="case-meter__used">{capacity.used}</span>
                {capacity.hasLimit && (
                  <span className="case-meter__of">of {capacity.limit} spots</span>
                )}
              </div>
              {capacity.hasLimit && (
                <div className="case-meter__track">
                  <div
                    className="case-meter__fill"
                    style={{ width: `${capacity.fillPct}%` }}
                  />
                </div>
              )}
              <span
                className="case-pack__delta"
                style={{
                  color: changes.hasChanges
                    ? "var(--blue-700, #175CD3)"
                    : "var(--gray-500, #667085)",
                }}
              >
                {changes.deltaLabel}
              </span>
            </div>
          </div>

          <div className="case-list">
            {staged.length > 0 ? (
              staged.map((row) => (
                <div className="case-row" key={row.item_id}>
                  <button
                    type="button"
                    className="case-row__move case-row__move--out"
                    onClick={() => removeItem(row.item_id)}
                    aria-label={`Take ${row.serial_number} out of this case`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="case-row__text">
                    <span className="case-row__serial">{row.serial_number}</span>
                    <span className="case-row__meta">{describeRow(row)}</span>
                  </span>
                  {row.isNew && <span className="case-row__new">New</span>}
                </div>
              ))
            ) : (
              <div className="case-list__blank">
                <p className="case-empty__title">Nothing in the case</p>
                <p className="case-empty__body">
                  Add stock from the left. Saving an empty case empties it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="case-pack__foot">
        {capacity.isOver ? (
          <span className="case-pack__blocked">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Take out {capacity.excess} {capacity.excess === 1 ? "item" : "items"} to save
          </span>
        ) : (
          <span className="case-pack__hint">
            {changes.hasChanges
              ? "Nothing is written until you save"
              : "Pick stock on the left to start packing"}
          </span>
        )}

        <div className="case-pack__actions">
          <GrayButtonComponent
            title="Cancel"
            func={closeModal}
            isDisabled={saveMutation.isPending}
            styles={{ margin: 0 }}
          />
          <BlueButtonComponent
            title={changes.saveLabel}
            func={() => saveMutation.mutate()}
            isDisabled={capacity.isOver || !changes.hasChanges}
            isLoading={saveMutation.isPending}
            styles={{ margin: 0 }}
          />
        </div>
      </div>
    </div>
  );

  return <ModalUX body={body} openDialog={openModal} closeModal={closeModal} />;
};

export default ContainerContent;
