import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "antd";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import renderingTitle from "../../../../../../components/general/renderingTitle";
import EmailReturnRentalItems from "../../../../../../components/notification/email/EmailReturnRentalItems";
import { useStatusNotification } from "../../../../../../components/notification/alerts/useStatusNotification";
import DangerButtonConfirmationComponent from "../../../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import EmptyState from "../../../../../../components/UX/emptyState/EmptyState";
import Input from "../../../../../../components/UX/inputs/Input";
import Label from "../../../../../../components/UX/inputs/Label";
import ModalUX from "../../../../../../components/UX/modal/ModalUX";
import BaseTable from "../../../../../../components/UX/tables/BaseTable";
import { checkRequestSize } from "../../../../../../components/utils/checkRequestSize";
import "../../../../../../styles/global/actionForm.css";
import { registerStaffActivity } from "../../../../../../api/activityLog";
import clearCacheMemory from "../../../../../../utils/actions/clearCacheMemory";
import {
  RETURN_STEPS,
  canShrinkBatch,
  chunkForBatching,
  describeReturnAction,
  filterRentedRows,
  nextBatchSize,
  progressPercent,
} from "./utils/returnRentedPlan";
import {
  buildReturnAuditEntries,
  describeBlocked,
  itemIdOf,
  partitionForReturn,
} from "./utils/returnToSupplier";

const INITIAL_BATCH_SIZE = 200;
const BATCH_PAUSE_MS = 150;
const PAGE_SIZE = 50;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sending rented items back to the supplier.
 *
 * The screen was two tabs — "Return All Items" and "Return Selected Items" —
 * over the same table, one with a checkbox column and one without. They were
 * two modes for one decision, and switching between them reset the search, the
 * page and the selection, so glancing at the other tab to check a count threw
 * the work away. There is one table now, with row selection, and one button
 * that says which of the two it is about to do.
 *
 * The defect underneath was worse: `handleReturnSelectedItems` called
 * `returnItemsToRenter(itemIds)` twice — the same batched write to
 * `/db_inventory/update-large-data`, copy-pasted along with its "now deleting
 * records..." message — so every selected return ran the whole first stage
 * twice. The progress bar was equally confused: the step was set to "Sending
 * email notification" *after* the delete had finished, and its percentage was
 * `current / total` with no guard, so the first frame of a run rendered `NaN%`.
 *
 * The batching loop mutated its own index to retry a shrunken batch. It is a
 * queue now, and the shrink rule is `nextBatchSize`, which cannot grow.
 *
 * Every request is unchanged: the same three catalog entries, the same
 * `update-large-data`, `delete-bulk-items`, email helper and cache key.
 */
const ReturnRentedItemModal = ({ open, handleClose, supplier_id, data = null }) => {
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [notice, setNotice] = useState(null);

  // The caller either hands over the rows it already has, or leaves it to us.
  // Derived, not held in state: it used to be a `useState` set inside an
  // initializer that other callbacks then depended on, which is how the fetch
  // and the prop could disagree about which source was in play.
  const usingProvidedData = Array.isArray(data) && data.length > 0;

  const providedRows = useMemo(
    () => (usingProvidedData ? filterRentedRows(data, search) : []),
    [usingProvidedData, data, search]
  );

  const fetchPage = useCallback(
    async (nextPage, term) => {
      setIsLoading(true);
      setNotice(null);
      try {
        // One catalog entry each, sharing a single filter object, so the list
        // and the total cannot disagree. `undefined` rather than "" when not
        // filtering, so the server omits the clause instead of LIKE '%%'.
        const filters = {
          supplierId: supplier_id || undefined,
          search: term || undefined,
        };

        const [list, count] = await Promise.all([
          devitrakApi.post("/db_company/inventory-query", {
            queryName: "inventory.rentedPage",
            params: { ...filters, pageSize: PAGE_SIZE, offset: (nextPage - 1) * PAGE_SIZE },
          }),
          devitrakApi.post("/db_company/inventory-query", {
            queryName: "inventory.rentedCount",
            params: filters,
          }),
        ]);

        setRows(list.data?.result ?? []);
        setTotal(count.data?.result?.[0]?.total ?? 0);
      } catch {
        setRows([]);
        setNotice("The rented items could not be loaded. Try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [supplier_id]
  );

  // Opening resets the screen. Closing leaves it alone: the modal is unmounted
  // by its caller, so there is nothing to tidy.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setPage(1);
    setSelectedIds([]);
    setNotice(null);
    if (!usingProvidedData) fetchPage(1, "");
  }, [open, usingProvidedData, fetchPage]);

  // Server-side search is debounced; the provided-data path filters in memory.
  useEffect(() => {
    if (!open || usingProvidedData) return;
    const id = setTimeout(() => {
      setPage(1);
      fetchPage(1, search);
    }, 300);
    return () => clearTimeout(id);
  }, [open, usingProvidedData, search, fetchPage]);

  const visibleRows = usingProvidedData
    ? providedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : rows;
  const visibleTotal = usingProvidedData ? providedRows.length : total;

  const action = describeReturnAction({
    totalItems: visibleTotal,
    selectedCount: selectedIds.length,
  });

  // ─── The write path. Same requests, same order, same bodies. ──────────────

  /**
   * Sends `ids` in batches, shrinking when a body is too big for the server.
   *
   * A queue rather than an index the body mutates: the old loop did `i -=
   * currentBatchSize; continue;` and relied on the `for` step putting it back,
   * which only worked because the two happened to cancel out.
   */
  const runBatched = async ({ ids, send }) => {
    let size = INITIAL_BATCH_SIZE;
    let queue = chunkForBatching(ids, size);
    let index = 0;
    let done = 0;

    setProgress({ current: 0, total: ids.length });

    const reshapeRemaining = () => {
      const remaining = queue.slice(index).flat();
      queue = [...queue.slice(0, index), ...chunkForBatching(remaining, size)];
    };

    while (index < queue.length) {
      const batch = queue[index];
      try {
        if (checkRequestSize({ batch }).isLarge && canShrinkBatch(size)) {
          size = nextBatchSize(size, "payload-large");
          reshapeRemaining();
          continue;
        }

        /* These endpoints answer HTTP 200 with `{ ok: false, msg }` when they
           refuse the write. The response used to be discarded, so a refusal
           advanced the progress bar and the modal reported the items returned
           while nothing had been written. */
        const response = await send(batch);
        if (response?.data?.ok === false) {
          throw new Error(
            response.data.msg ||
              "The server refused the update and returned no reason."
          );
        }
        done += batch.length;
        setProgress({ current: done, total: ids.length });
        index += 1;
        if (index < queue.length) await wait(BATCH_PAUSE_MS);
      } catch (error) {
        if (error?.response?.status === 413 && canShrinkBatch(size)) {
          size = nextBatchSize(size, "payload-too-large");
          reshapeRemaining();
          continue;
        }
        throw error;
      }
    }
  };

  /**
   * The state of every item being returned, straight from the server.
   *
   * This replaces the old first step, which wrote `warehouse`,
   * `enableAssignFeature`, `returnedRentedInfo` and `return_date` onto rows the
   * last step deletes seconds later. Nothing read any of it: the report is
   * built from the item's own serial and group and stamps its own date. It was
   * also the call `update-large-data` was rejecting for carrying
   * `returnedRentedInfo`, so a return could not complete at all.
   *
   * Reading instead of writing is what makes the next decision possible.
   */
  const readItemState = async (ids) => {
    const response = await devitrakApi.post("/db_company/inventory-query", {
      queryName: "inventory.itemsByIds",
      params: { itemIds: ids, supplierId: supplier_id || undefined },
    });
    return response.data?.result ?? [];
  };

  /**
   * One activity-log row per item, because the item record itself is about to
   * be deleted — this is the only place each one stays accounted for.
   *
   * Chunked, and never allowed to fail the return: `registerStaffActivity` is
   * fire-and-forget by design.
   */
  const recordInActivityLog = async (items, timestamp) => {
    const entries = buildReturnAuditEntries({
      items,
      supplierId: supplier_id || null,
      returnedBy: user?.name,
      timestamp,
    });
    setProgress({ current: 0, total: entries.length });
    const batches = chunkForBatching(entries, 50);
    let done = 0;
    for (const batch of batches) {
      await Promise.allSettled(batch.map((entry) => registerStaffActivity(entry)));
      done += batch.length;
      setProgress({ current: done, total: entries.length });
    }
  };

  const removeFromInventory = (ids) =>
    runBatched({
      ids,
      send: (batch) =>
        devitrakApi.post("/db_company/delete-bulk-items", {
          item_ids: batch,
          company_id: user.sqlInfo.company_id,
        }),
    });

  const refreshInventoryViews = () => {
    [
      "currentStateDevicePerGroupName",
      "deviceInInventoryPerGroup",
      "currentStateDevicePerCategory",
      "deviceInInventoryPerBrand",
      "currentStateDevicePerBrand",
    ].forEach((queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] }));

    [
      "listOfItemsInStock",
      "ItemsInInventoryCheckingQuery",
      "RefactoredListInventoryCompany",
    ].forEach((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [queryKey], exact: true, refetchType: "active" })
    );
  };

  /** Every id the current filter matches, not just the page on screen. */
  const idsForWholeFilter = async () => {
    if (usingProvidedData) return providedRows.map((row) => row.item_id);

    const response = await devitrakApi.post("/db_company/inventory-query", {
      queryName: "inventory.rentedAll",
      params: { supplierId: supplier_id || undefined },
    });
    return (response.data?.result ?? []).map((row) => row.item_id);
  };

  const handleReturn = async () => {
    setNotice(null);
    setIsRunning(true);
    try {
      const ids = action.isAll ? await idsForWholeFilter() : [...selectedIds];
      if (ids.length === 0) {
        setNotice("There is nothing to return.");
        return;
      }

      /* An item that is out with somebody cannot go back to its supplier, and
         the last step of this flow deletes the record — so what may leave is
         decided before anything is reported or removed, from the server's own
         state rather than from the row on screen. */
      setActiveStep("check");
      setProgress({ current: 0, total: ids.length });
      const { returnable, blocked, checked } = partitionForReturn({
        items: await readItemState(ids),
        requestedIds: ids,
      });
      setProgress({ current: ids.length, total: ids.length });

      if (returnable.length === 0) {
        setNotice(
          describeBlocked(blocked) ??
            "None of these items can be returned right now."
        );
        return;
      }

      const returnedAt = new Date().toISOString();
      const returnableIds = returnable.map((item) => itemIdOf(item));

      /* The report goes out before anything is deleted, because it is the
         record: once the rows are gone, nothing that is not in it survives. */
      setActiveStep("email");
      setProgress({ current: 0, total: 1 });
      await EmailReturnRentalItems({
        items: returnableIds,
        resolvedItems: returnable,
        supplier_id,
        user,
        setProgress,
        returnedAt,
      });

      setActiveStep("audit");
      await recordInActivityLog(returnable, returnedAt);

      setActiveStep("delete");
      await removeFromInventory(returnableIds);

      await clearCacheMemory(`providerCompanies_${user.companyData.id}`);
      refreshInventoryViews();

      /* A guard that silently did not apply is worse than no guard: if the
         state query answered without either field, the in-use rule had nothing
         to run on, and that is said rather than assumed either way. */
      const guardNote = checked
        ? null
        : "The in-use check could not run: the inventory query returned no status for these items, so they were returned as selected.";

      notify(
        "success",
        `${returnable.length} item${returnable.length === 1 ? "" : "s"} returned.`,
        blocked.length > 0
          ? `${blocked.length} left in place.`
          : "They are out of this company's inventory."
      );
      const leftToSay = [describeBlocked(blocked), guardNote]
        .filter(Boolean)
        .join(" ");
      if (leftToSay) {
        setNotice(leftToSay);
        return;
      }
      return handleClose();
    } catch (error) {
      // The batches that already went through are not rolled back, so the
      // message must not claim nothing happened. The server's own reason is
      // carried through: a refused write says why, rather than reading as a
      // dropped connection.
      const reason = error?.response?.data?.msg || error?.message;
      setNotice(
        `The return stopped partway. Some items may already have been reported or removed — reopen this list to see what is left.${
          reason ? ` The server said: ${reason}` : ""
        }`
      );
    } finally {
      setIsRunning(false);
      setActiveStep(null);
      setProgress({ current: 0, total: 0 });
    }
  };

  const columns = [
    {
      key: "item_id",
      title: "Item ID",
      dataIndex: "item_id",
      sorter: (a, b) => Number(a.item_id) - Number(b.item_id),
    },
    {
      key: "serial_number",
      title: "Serial",
      dataIndex: "serial_number",
      render: (value) =>
        value ? <span className="action-form__serial">{value}</span> : "—",
    },
    {
      key: "item_group",
      title: "Group",
      dataIndex: "item_group",
      render: (value) => value || "—",
    },
  ];

  const body = (
    <div className="action-form">
      {contextHolder}

      <div className="action-form__header">
        <p className="action-form__lead">
          These items go back to the supplier and are then removed from this
          company&apos;s inventory. Nothing happens until you confirm.
        </p>
      </div>

      <div className="action-form__field">
        <Label>Search</Label>
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          disabled={isRunning}
          placeholder="Item ID, serial number or group"
        />
      </div>

      <div className="action-form__toolbar">
        <p className="action-form__count">
          <strong>{visibleTotal}</strong> rented item
          {visibleTotal === 1 ? "" : "s"}
          {selectedIds.length > 0 && (
            <>
              {" · "}
              <strong>{selectedIds.length}</strong> selected
            </>
          )}
        </p>
        {selectedIds.length > 0 && (
          <GrayButtonComponent
            size="sm"
            title="Clear selection"
            buttonType="button"
            disabled={isRunning}
            func={() => setSelectedIds([])}
          />
        )}
      </div>

      {visibleTotal === 0 && !isLoading ? (
        <EmptyState
          compact
          icon="tabler:package-off"
          title="No rented items"
          description={
            search
              ? "Nothing matches that search."
              : "This supplier has no rented items in your inventory."
          }
        />
      ) : (
        <div className="action-form__scroll">
          <BaseTable
            className="profile-table"
            columns={columns}
            dataSource={visibleRows}
            rowKey="item_id"
            loading={isLoading}
            size="small"
            scroll={{ y: 360 }}
            // Selection survives paging and searching: it used to live in a
            // hand-built checkbox column that a tab change threw away.
            rowSelection={{
              selectedRowKeys: selectedIds,
              onChange: (keys) => setSelectedIds(keys),
              getCheckboxProps: () => ({ disabled: isRunning }),
              preserveSelectedRowKeys: true,
            }}
            enablePagination
            pageSize={PAGE_SIZE}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: visibleTotal,
              showSizeChanger: false,
              position: ["bottomCenter"],
              onChange: (nextPage) => {
                setPage(nextPage);
                if (!usingProvidedData) fetchPage(nextPage, search);
              },
              showTotal: (count, range) => `${range[0]}-${range[1]} of ${count}`,
            }}
          />
        </div>
      )}

      {isRunning && (
        <div className="action-form__step">
          <ul className="action-form__steps">
            {RETURN_STEPS.map((step) => {
              const activeIndex = RETURN_STEPS.findIndex((s) => s.key === activeStep);
              const stepIndex = RETURN_STEPS.findIndex((s) => s.key === step.key);
              const state =
                stepIndex < activeIndex ? "is-done" : step.key === activeStep ? "is-active" : "";
              return (
                <li className={state} key={step.key}>
                  {step.label}
                </li>
              );
            })}
          </ul>
          <Progress
            percent={progressPercent(progress)}
            status="active"
            format={() =>
              progress.total > 1 ? `${progress.current}/${progress.total}` : ""
            }
          />
        </div>
      )}

      {notice && <p className="action-form__notice">{notice}</p>}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          Returned items leave this company&apos;s inventory permanently.
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          disabled={isRunning}
          func={handleClose}
        />
        <DangerButtonConfirmationComponent
          title={action.label}
          buttonType="button"
          disabled={!action.canSubmit}
          loadingState={isRunning}
          confirmationTitle={action.confirmTitle}
          confirmationDescription={action.confirmDescription}
          okText="Return"
          func={handleReturn}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      openDialog={open}
      closeModal={isRunning ? () => {} : handleClose}
      closable={!isRunning}
      title={renderingTitle("Return rented items to the supplier")}
      footer={null}
      width={880}
      body={body}
    />
  );
};

ReturnRentedItemModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func.isRequired,
  supplier_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Rows the caller already holds; when absent they are fetched here. */
  data: PropTypes.array,
};

export default ReturnRentedItemModal;
