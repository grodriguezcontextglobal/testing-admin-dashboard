import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
  buildCustodyTimeline,
  clean,
  deriveDeviceState,
  summarizeUtilization,
} from "../utils/deviceProfileModel";

/**
 * Query keys carry the item id.
 *
 * The old page keyed on the bare strings "trackingItemActivity" / "infoItemSql",
 * so clicking from one device to the next re-used the previous unit's cached
 * rows and painted the wrong serial until the request landed — the same bug the
 * member profile hit. The names are kept as the first element so the existing
 * invalidations in EditItemModal and ContainerContent still match by prefix.
 */
export const deviceProfileKeys = {
  tracking: (itemId) => ["trackingItemActivity", String(itemId ?? "")],
  item: (itemId) => ["infoItemSql", String(itemId ?? "")],
  memberLeases: (itemId) => ["deviceMemberLeases", String(itemId ?? "")],
  staffLeases: (itemId) => ["deviceStaffLeases", String(itemId ?? "")],
  roster: (companyId) => ["companyMemberRoster", String(companyId ?? "")],
  fleet: (companyId, group) => [
    "deviceFleetContext",
    String(companyId ?? ""),
    String(group ?? ""),
  ],
};

const rowsOf = (response) => {
  const data = response?.data;
  if (!data) return [];
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.lease)) return data.lease;
  if (Array.isArray(data.result)) return data.result;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.members)) return data.members;
  return [];
};

const fullName = (member) =>
  [clean(member?.first_name), clean(member?.last_name)].filter(Boolean).join(" ");

/**
 * Everything the device profile renders, in one hook.
 *
 * Four sources have to agree before the page can answer "who has this and when
 * is it due": the item row, the tracking rows, and both lease tables. They're
 * fetched in parallel and merged by the pure helpers in deviceProfileModel.
 */
export function useDeviceProfile(itemId) {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;
  const enabled = Boolean(itemId);

  const trackingQuery = useQuery({
    queryKey: deviceProfileKeys.tracking(itemId),
    queryFn: () => devitrakApi.post(`/db_item/tracking_item/${itemId}`),
    enabled,
  });

  const itemQuery = useQuery({
    queryKey: deviceProfileKeys.item(itemId),
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", { item_id: itemId }),
    enabled,
  });

  // Every lease this device has ever had — `returned` is deliberately not
  // filtered, because the closed ones are the custody history.
  const memberLeasesQuery = useQuery({
    queryKey: deviceProfileKeys.memberLeases(itemId),
    queryFn: () =>
      devitrakApi.post("/db_member/retrieve-members-assigned-devices", {
        device_id: itemId,
        company_id: companyId,
      }),
    enabled: enabled && Boolean(companyId),
  });

  // lease_info rows are deleted on return, so anything here is an open loan.
  const staffLeasesQuery = useQuery({
    queryKey: deviceProfileKeys.staffLeases(itemId),
    queryFn: () =>
      devitrakApi.post("/db_lease/consulting-lease", { device_id: itemId }),
    enabled,
  });

  const trackingRows = useMemo(() => rowsOf(trackingQuery.data), [trackingQuery.data]);
  const memberLeases = useMemo(
    () => rowsOf(memberLeasesQuery.data),
    [memberLeasesQuery.data]
  );
  const staffLeases = useMemo(
    () => rowsOf(staffLeasesQuery.data),
    [staffLeasesQuery.data]
  );

  // The tracking query returns one row per assignment event; row 0 carries the
  // item_inv columns. consulting-item is the fallback when a device has never
  // been assigned and the LEFT JOIN produced nothing useful.
  const item = useMemo(() => {
    const itemRow = rowsOf(itemQuery.data)[0] ?? {};
    const trackingRow = trackingRows[0] ?? {};
    return { ...trackingRow, ...itemRow, item_id: itemId };
  }, [itemQuery.data, trackingRows, itemId]);

  // The company roster resolves member_id -> name for the holder tile and the
  // timeline, and doubles as the people index the assign drawer searches.
  const rosterQuery = useQuery({
    queryKey: deviceProfileKeys.roster(companyId),
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", { company_id: companyId }),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const membersById = useMemo(() => {
    const index = new Map();
    rowsOf(rosterQuery.data).forEach((member) => {
      if (member?.member_id !== undefined && member?.member_id !== null) {
        index.set(String(member.member_id), member);
      }
    });
    return index;
  }, [rosterQuery.data]);

  const resolvePersonLabel = useMemo(
    () => (lease) => {
      if (lease?.kind === "member") {
        const member = membersById.get(String(lease.personId));
        const name = fullName(member);
        if (name) return name;
        return lease.personId ? `Member #${lease.personId}` : "a member";
      }
      // lease_info stores a staff_id with no name-resolving endpoint of its
      // own, so staff loans read generically until one exists.
      return lease?.personId ? `Staff member #${lease.personId}` : "a staff member";
    },
    [membersById]
  );

  const state = useMemo(
    () => deriveDeviceState({ item, memberLeases, staffLeases }),
    [item, memberLeases, staffLeases]
  );

  const utilization = useMemo(
    () => summarizeUtilization({ memberLeases, staffLeases }),
    [memberLeases, staffLeases]
  );

  const timeline = useMemo(
    () =>
      buildCustodyTimeline({
        item,
        memberLeases,
        staffLeases,
        trackingRows,
        resolvePersonLabel,
      }),
    [item, memberLeases, staffLeases, trackingRows, resolvePersonLabel]
  );

  const holder = useMemo(() => {
    if (!state.openLease) return null;
    const lease = state.openLease;
    const label = resolvePersonLabel(lease);
    const member =
      lease.kind === "member" ? membersById.get(String(lease.personId)) : null;
    return {
      label,
      id: lease.personId,
      kind: lease.kind,
      href: lease.kind === "member" && lease.personId ? `/member/${lease.personId}/main` : null,
      member,
    };
  }, [state.openLease, resolvePersonLabel, membersById]);

  // "3 of 12 out" — the question an operator actually asks next.
  const fleetQuery = useQuery({
    queryKey: deviceProfileKeys.fleet(companyId, item.item_group),
    queryFn: () =>
      devitrakApi.post("/db_item/warehouse-items", {
        company_id: companyId,
        item_group: item.item_group,
        category_name: item.category_name,
      }),
    enabled: Boolean(companyId && clean(item.item_group) && clean(item.category_name)),
    staleTime: 60 * 1000,
  });

  const fleet = useMemo(() => {
    const units = rowsOf(fleetQuery.data);
    if (units.length === 0) return null;
    const inStock = units.filter((unit) => Number(unit.warehouse) === 1).length;
    return { total: units.length, inStock, out: units.length - inStock };
  }, [fleetQuery.data]);

  const refetchAll = () => {
    trackingQuery.refetch();
    itemQuery.refetch();
    memberLeasesQuery.refetch();
    staffLeasesQuery.refetch();
    fleetQuery.refetch();
  };

  return {
    // The item identity has to exist before anything renders; the lease
    // queries only enrich it, so a slow lease call must not block the page.
    isLoading: trackingQuery.isLoading || itemQuery.isLoading,
    isError: trackingQuery.isError && itemQuery.isError,
    item,
    trackingRows,
    memberLeases,
    staffLeases,
    membersById,
    roster: rowsOf(rosterQuery.data),
    rosterLoading: rosterQuery.isLoading,
    state,
    utilization,
    timeline,
    holder,
    fleet,
    refetchAll,
  };
}

export default useDeviceProfile;
