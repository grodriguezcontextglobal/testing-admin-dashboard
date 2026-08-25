import { useCallback, useMemo, useState } from "react";
import useBulkActionLogic from "../add/useBulkActionLogic";
import {
  findReferenceMatches,
  hasReferenceCriteria,
} from "../utils/referenceLookup";
import { summarizeInventoryMatches } from "../utils/updateInventoryMatchSummary";

export const STEPS = ["target", "scope", "fields", "review"];

/**
 * Wraps useBulkActionLogic() — shared with the create flow — with the
 * step navigation and live match data the update wizard needs. Nothing here
 * changes what useBulkActionLogic does; it only reads its form state and
 * adds wizard-only concerns on top, so the create flow (NewBulkItems.jsx) is
 * unaffected.
 */
const useUpdateInventoryWizard = () => {
  const bulkAction = useBulkActionLogic();
  const { watch, itemsInInventoryQuery, handleSearchByReference, copiedFrom } =
    bulkAction;

  const [stepIndex, setStepIndex] = useState(0);
  const [frozenMatches, setFrozenMatches] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const criteria = {
    category: watch("reference_category_name"),
    itemGroup: watch("reference_item_group"),
    brand: watch("reference_brand"),
  };
  const searched = hasReferenceCriteria(criteria);

  const liveMatches = useMemo(() => {
    const items = itemsInInventoryQuery?.data?.data?.items || [];
    return findReferenceMatches(items, criteria).matches;
    // criteria is a fresh object every render; its three primitive fields
    // are the real dependencies — depending on the object itself would
    // recompute every render regardless of whether they changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    itemsInInventoryQuery?.data,
    criteria.category,
    criteria.itemGroup,
    criteria.brand,
  ]);

  const matchSummary = useMemo(
    () => summarizeInventoryMatches(liveMatches),
    [liveMatches],
  );

  // The picker in step 2 and the frozen-list note in step 4 both need the
  // group as it stood when the user left step 1, not whatever it matches
  // right now — otherwise a change elsewhere in the app while the wizard is
  // open would silently reshuffle an already-made selection.
  const scopeMatches = frozenMatches ?? liveMatches;
  const scopeSummary = useMemo(
    () => summarizeInventoryMatches(scopeMatches),
    [scopeMatches],
  );

  const goToStep = useCallback((index) => {
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
  }, []);

  const confirmTarget = useCallback(() => {
    if (matchSummary.matchCount === 0) return;
    handleSearchByReference();
    setFrozenMatches(liveMatches);
    goToStep(1);
  }, [matchSummary.matchCount, handleSearchByReference, liveMatches, goToStep]);

  const changeTarget = useCallback(() => {
    setFrozenMatches(null);
    setConfirmed(false);
    goToStep(0);
  }, [goToStep]);

  return {
    ...bulkAction,
    stepIndex,
    currentStep: STEPS[stepIndex],
    goToStep,
    goNext: () => goToStep(stepIndex + 1),
    goBack: () => goToStep(stepIndex - 1),
    searched,
    liveMatches,
    matchSummary,
    scopeMatches,
    scopeSummary,
    confirmTarget,
    changeTarget,
    hasTarget: Boolean(copiedFrom) || frozenMatches !== null,
    confirmed,
    setConfirmed,
  };
};

export default useUpdateInventoryWizard;
