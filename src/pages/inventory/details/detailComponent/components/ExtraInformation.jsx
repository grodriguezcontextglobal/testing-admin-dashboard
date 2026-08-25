import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import ContainerContent from "./ContainerContent";
import "./containerContents.css";
import {
  describeContentChanges,
  describeEmptyAction,
  groupContainerItems,
  summarizeCapacity,
} from "../utils/containerContentUtils";

const CaseIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
    <rect x="1" y="3" width="22" height="5" rx="1" />
    <path d="M10 12h4" />
  </svg>
);

/**
 * What is packed inside a container, and the way in and out of it.
 *
 * Capacity is a meter rather than the `| 8/12 cap` fragment it used to be, each
 * serial sits under its item group, and removals stage locally until Save — so
 * the write is one full-replace PUT instead of the DELETE-then-POST that could
 * leave the case emptied when the POST failed.
 */
const ExtraInformation = ({ dataFound, containerInfo }) => {
  const [stagedIds, setStagedIds] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const queryClient = useQueryClient();

  const item = dataFound?.[0] ?? {};
  // The two props are the same underlying row; the old code read the id from
  // whichever one happened to be at hand, which is why the fetch and the empty
  // call could disagree.
  const containerId = containerInfo?.item_id ?? item?.item_id ?? null;
  const spotLimit = item?.containerSpotLimit ?? containerInfo?.containerSpotLimit;
  const isContainer = Number(containerInfo?.container ?? item?.container ?? 0) > 0;

  const contentsQuery = useQuery({
    queryKey: ["containerItems", containerId],
    queryFn: async () => {
      try {
        const response = await devitrakApi.get(
          `/db_inventory/container-items/${containerId}`,
        );
        return response.data?.container?.items ?? [];
      } catch (error) {
        // An empty case answers 404 rather than an empty list.
        if (error?.response?.status === 404) return [];
        throw error;
      }
    },
    enabled: Boolean(isContainer && containerId),
    refetchOnWindowFocus: false,
  });

  const persistedItems = contentsQuery.data ?? [];
  const persistedIds = useMemo(
    () => persistedItems.map((row) => row?.item_id),
    [persistedItems],
  );

  // Staged state follows the server until the user touches something.
  useEffect(() => {
    setStagedIds(null);
  }, [containerId]);

  const effectiveIds = stagedIds ?? persistedIds;
  const stagedItems = useMemo(() => {
    const keep = new Set(effectiveIds.map((id) => String(id)));
    return persistedItems.filter((row) => keep.has(String(row?.item_id)));
  }, [persistedItems, effectiveIds]);

  const capacity = summarizeCapacity(stagedItems.length, spotLimit);
  const groups = useMemo(() => groupContainerItems(stagedItems), [stagedItems]);
  const changes = describeContentChanges(persistedIds, effectiveIds);
  const emptyAction = describeEmptyAction(stagedItems.length);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["containerItems", containerId] });
    queryClient.invalidateQueries({ queryKey: ["infoItemSql"] });
    queryClient.invalidateQueries({ queryKey: ["trackingItemActivity"] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      devitrakApi.put(`/db_inventory/container/${containerId}`, {
        child_ids: effectiveIds,
      }),
    onSuccess: () => {
      message.success("Case contents updated");
      setStagedIds(null);
      invalidateAll();
    },
    onError: (error) =>
      message.error(`The case could not be updated: ${error.message}`),
  });

  const emptyMutation = useMutation({
    mutationFn: () => devitrakApi.delete(`/db_inventory/container/${containerId}`),
    onSuccess: () => {
      message.success("Case was successfully emptied");
      setStagedIds(null);
      setConfirmOpen(false);
      invalidateAll();
    },
    onError: (error) => {
      setConfirmOpen(false);
      message.error(`The case could not be emptied: ${error.message}`);
    },
  });

  if (!isContainer) return null;

  const removeItem = (itemId) =>
    setStagedIds(
      effectiveIds.filter((id) => String(id) !== String(itemId)),
    );

  const busy = saveMutation.isPending || emptyMutation.isPending;

  return (
    <section className="device-card">
      <div className="device-card__head">
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ display: "flex", color: "var(--gray-600, #475467)" }}>
              <CaseIcon />
            </span>
            <h3 className="device-card__title">Items in this case</h3>
          </div>
          <span className="device-card__note">
            {stagedItems.length === 0
              ? "Nothing packed in this case yet"
              : "Packed items travel with the case when it moves"}
          </span>
        </div>

        <BlueButtonComponent
          title="Add items"
          func={() => setPackOpen(true)}
          isDisabled={busy}
          styles={{ margin: 0 }}
        />
      </div>

      <div className={`case-tone--${capacity.tone}`}>
        <div className="case-meter">
          <div className="case-meter__row">
            <div className="case-meter__count">
              <span className="case-meter__used">{capacity.used}</span>
              {capacity.hasLimit && (
                <span className="case-meter__of">of {capacity.limit} spots</span>
              )}
            </div>
            <span className="case-pill">
              <span className="case-pill__dot" />
              {capacity.statusLabel}
            </span>
          </div>

          {capacity.hasLimit && (
            <div className="case-meter__track">
              <div
                className="case-meter__fill"
                style={{ width: `${capacity.fillPct}%` }}
              />
            </div>
          )}
        </div>

        {capacity.isOver && (
          <div className="case-banner" style={{ marginTop: "20px" }}>
            <span className="case-banner__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </span>
            <p className="case-banner__text">{capacity.overMessage}</p>
          </div>
        )}
      </div>

      {contentsQuery.isLoading ? (
        <p className="case-empty__body" style={{ margin: "24px auto 0" }}>
          Loading the contents of this case…
        </p>
      ) : contentsQuery.isError ? (
        <div className="case-banner" style={{ marginTop: "20px" }}>
          <span className="case-banner__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </span>
          <p className="case-banner__text">
            The contents of this case could not be loaded.
          </p>
        </div>
      ) : stagedItems.length > 0 ? (
        <div className="case-groups" style={{ marginTop: "20px" }}>
          {groups.map((group) => (
            <div className="case-group" key={group.name}>
              <div className="case-group__head">
                <span className="case-group__name">{group.name}</span>
                <span className="case-group__count">· {group.countLabel}</span>
                <span className="case-group__rule" />
              </div>
              <div className="case-chips">
                {group.items.map((entry) => (
                  <span className="case-chip" key={entry.itemId ?? entry.serial}>
                    <span className="case-chip__serial">{entry.serial}</span>
                    <button
                      type="button"
                      className="case-chip__remove"
                      onClick={() => removeItem(entry.itemId)}
                      disabled={busy}
                      aria-label={`Remove ${entry.serial} from this case`}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="case-empty" style={{ marginTop: "20px" }}>
          <span className="case-empty__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
              <rect x="1" y="3" width="22" height="5" rx="1" />
            </svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
            <p className="case-empty__title">This case is empty</p>
            <p className="case-empty__body">
              Anything you pack in here travels with the case — allocate the case
              to an event and its contents go too.
            </p>
          </div>
          <GrayButtonComponent
            title="Add the first items"
            func={() => setPackOpen(true)}
            isDisabled={busy}
            styles={{ margin: "4px 0 0", width: "fit-content" }}
          />
        </div>
      )}

      {changes.hasChanges && (
        <div className="case-pending">
          <span className="case-pending__label">
            <span className="case-pending__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </span>
            {changes.changeLabel}
          </span>
          <div className="case-pending__actions">
            <GrayButtonComponent
              title="Discard"
              func={() => setStagedIds(null)}
              isDisabled={busy}
              styles={{ margin: 0 }}
            />
            <BlueButtonComponent
              title="Save changes"
              func={() => saveMutation.mutate()}
              isDisabled={capacity.isOver}
              isLoading={saveMutation.isPending}
              styles={{ margin: 0 }}
            />
          </div>
        </div>
      )}

      {emptyAction.isAvailable && (
        <div
          className={`case-danger-row${changes.hasChanges ? "" : " case-danger-row--stacked"}`}
        >
          <button
            type="button"
            className="case-ghost-danger"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            {emptyAction.buttonLabel}
          </button>
        </div>
      )}

      {confirmOpen && (
        <ModalUX
          openDialog={confirmOpen}
          closeModal={() => setConfirmOpen(false)}
          width={480}
          body={
            <>
              <div className="case-confirm">
                <span className="case-confirm__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <p className="case-confirm__title">{emptyAction.confirmTitle}</p>
                  <p className="case-confirm__body">
                    They go back to the warehouse as available stock. The case
                    itself stays where it is.
                  </p>
                </div>
              </div>
              <div className="case-confirm__actions">
                <GrayButtonComponent
                  title="Cancel"
                  func={() => setConfirmOpen(false)}
                  isDisabled={emptyMutation.isPending}
                  styles={{ margin: 0 }}
                />
                <BlueButtonComponent
                  title={emptyAction.confirmCta}
                  func={() => emptyMutation.mutate()}
                  isLoading={emptyMutation.isPending}
                  styles={{
                    margin: 0,
                    background: "var(--error, #B42318)",
                    borderColor: "var(--error, #B42318)",
                  }}
                />
              </div>
            </>
          }
        />
      )}

      {packOpen && (
        <ContainerContent
          openModal={packOpen}
          closeModal={() => setPackOpen(false)}
          containerId={containerId}
          spotLimit={spotLimit}
          currentItems={persistedItems}
          onSaved={invalidateAll}
        />
      )}
    </section>
  );
};

export default ExtraInformation;
