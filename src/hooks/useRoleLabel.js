import { useCallback } from "react";
import { useSelector } from "react-redux";
import { getRoleLabel, getRoleLabelGroupKey } from "../config/roles";

/**
 * Returns a `roleLabel(roleType)` function that prefers the company's
 * customized label (companyData.roleLabels, keyed by role concept — see
 * ROLE_LABEL_GROUPS) and falls back to the default ROLE_LABELS otherwise.
 * Stable across renders (via useCallback) as long as companyRoleLabels
 * doesn't change, so it's safe to drop in useMemo/useCallback deps.
 */
export const useRoleLabel = () => {
  const companyRoleLabels = useSelector(
    (state) => state.admin.user?.companyData?.roleLabels
  );
  return useCallback(
    (roleType) => {
      const groupKey = getRoleLabelGroupKey(roleType);
      // `||` (not `??`): an override cleared back to "" should fall back to
      // the default label too, not render blank.
      return companyRoleLabels?.[groupKey] || getRoleLabel(roleType);
    },
    [companyRoleLabels]
  );
};

export default useRoleLabel;
