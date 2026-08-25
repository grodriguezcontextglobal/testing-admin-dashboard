import { Modal } from "antd";
import { lazy, Suspense, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import DevitrakLoading from "../../../../components/animation/DevitrakLoading";
import Breadcrumb from "../../../../components/UX/breadcrumbs/Breadcrumb";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import {
  formatLoanDate,
  formatRelativeDay,
  ProfileErrorState,
  ProfileIdentityCard,
  ProfileShell,
  ProfileSkeleton,
  ProfileStatTiles,
  ProfileTabs,
  StatusChip,
} from "../../../../components/UX/profile";
import { usePermission } from "../../../../hooks/usePermission";
import { onAddMemberInfo } from "../../../../store/slices/memberSlice";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import ExtraInformation from "../detailComponent/components/ExtraInformation";
import AssignDeviceDrawer from "./components/AssignDeviceDrawer";
import CustodyTimeline from "./components/CustodyTimeline";
import DeviceSidebar from "./components/DeviceSidebar";
import DeviceSpecs from "./components/DeviceSpecs";
import useDeviceProfile from "./hooks/useDeviceProfile";
import { clean } from "./utils/deviceProfileModel";
import "./deviceProfile.css";

const DeleteItem = lazy(() => import("../detailComponent/actions/DeleteItem"));
const EditItem = lazy(() => import("../detailComponent/actions/EditItem"));
const ReturnDevice = lazy(() =>
  import("../../../conditionalPage/tables/detailTableComponents/acions/return/Return")
);

const breadcrumbLink = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "18px",
  fontFamily: "Inter",
  lineHeight: "28px",
  color: "var(--blue-dark-600, #155dee)",
};

const breadcrumbCurrent = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "18px",
  fontFamily: "Inter",
  lineHeight: "28px",
  color: "var(--gray900, #0f1728)",
};

/**
 * The device profile.
 *
 * Same shell as the consumer and member pages: breadcrumb, identity, at-a-glance
 * tiles, section tabs. A person's page lists the devices they hold; this is the
 * mirror — one device, and the people who have held it.
 */
const DeviceProfilePage = () => {
  const { search } = useLocation();
  const itemId = new URLSearchParams(search).get("id");
  const dispatch = useDispatch();

  const canEdit = usePermission("inventory:update");
  const canDelete = usePermission("inventory:delete");
  const canAssign = usePermission("inventory:update");

  const [tab, setTab] = useState("custody");
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnRecord, setReturnRecord] = useState(null);

  const profile = useDeviceProfile(itemId);
  const { item, state, holder, timeline, utilization, fleet, memberLeases } = profile;

  // EditItemModal / DeleteItemModal predate this page and read the old
  // [{...row, data, itemInfo}] shape. Kept intact so both keep working.
  const legacyDataFound = useMemo(
    () => [{ ...item, data: profile.trackingRows, itemInfo: { ...item } }],
    [item, profile.trackingRows]
  );

  const breadcrumb = (
    <Breadcrumb
      path={[
        {
          title: (
            <Link to="/inventory" style={breadcrumbLink}>
              All devices
            </Link>
          ),
        },
        {
          title: (
            <Link
              to={`/inventory?item_group=${encodeURIComponent(clean(item.item_group))}`}
              style={breadcrumbLink}
            >
              {clean(item.item_group) || "Device"}
            </Link>
          ),
        },
        {
          title: (
            <span style={breadcrumbCurrent}>{clean(item.serial_number) || "—"}</span>
          ),
        },
      ]}
    />
  );

  if (profile.isLoading) {
    return (
      <ProfileShell breadcrumb={breadcrumb}>
        <div style={{ padding: "8px 0" }}>
          <ProfileSkeleton lines={5} />
        </div>
      </ProfileShell>
    );
  }

  if (profile.isError || !clean(item.serial_number)) {
    return (
      <ProfileShell breadcrumb={breadcrumb}>
        <ProfileErrorState
          title="Couldn't load this device"
          description="The inventory service didn't respond. Nothing was changed."
          action={
            <GrayButtonComponent title="Try again" func={() => profile.refetchAll()} />
          }
        />
      </ProfileShell>
    );
  }

  /* ---- chips ---------------------------------------------------------- */

  const chips = [
    <StatusChip
      key="stock"
      pip
      label={state.statusLabel}
      tone={state.inStock ? "success" : "warning"}
    />,
    state.ownership && (
      <StatusChip key="ownership" label={state.ownership} tone="neutral" />
    ),
    <StatusChip
      key="condition"
      label={state.condition}
      tone={state.condition === "Operational" ? "success" : "warning"}
    />,
    state.loan?.tone === "critical" && (
      <StatusChip key="loan" pip label={state.loan.label} tone="critical" />
    ),
  ].filter(Boolean);

  /* ---- action rail ---------------------------------------------------- */

  const openReturn = () => {
    // Return reads the member from Redux for its email notification; the
    // roster already gave us the record, so hydrate before opening.
    if (holder?.member) dispatch(onAddMemberInfo(holder.member));
    const lease = memberLeases.find(
      (row) => String(row.member_id) === String(holder?.id) && Number(row.returned) !== 1
    );
    setReturnRecord(lease ?? null);
  };

  const actions = [
    canAssign && state.inStock && (
      <BlueButtonComponent
        key="assign"
        title="Assign device"
        func={() => setAssignOpen(true)}
      />
    ),
    canAssign && !state.inStock && holder?.kind === "member" && (
      <BlueButtonComponent key="return" title="Return device" func={openReturn} />
    ),
    canEdit && (
      <Suspense key="edit" fallback={null}>
        <EditItem dataFound={legacyDataFound} />
      </Suspense>
    ),
    canDelete && clean(item.ownership) !== "Rent" && (
      <Suspense key="delete" fallback={null}>
        <DeleteItem dataFound={legacyDataFound} />
      </Suspense>
    ),
  ].filter(Boolean);

  /* ---- stat tiles ------------------------------------------------------ */
  /* These answer who has it, when it's back, where it is and how hard it
     works — not the spec facts the old page put in 30px type. */

  const holderTile = {
    label: state.inStock ? "Last held by" : "Held by",
    value: holder ? (
      holder.href ? (
        <Link to={holder.href}>{holder.label}</Link>
      ) : (
        holder.label
      )
    ) : (
      "—"
    ),
    sub: state.inStock ? "Currently unassigned" : holder?.member?.grade
      ? `Grade ${clean(holder.member.grade)}`
      : null,
    testId: "device-stat-holder",
  };

  const dueTile = state.inStock
    ? {
        label: "Availability",
        value: "Available",
        sub: "Ready to assign",
        testId: "device-stat-availability",
      }
    : {
        label: "Due back",
        value: state.loan?.label ?? "No due date",
        tone: state.loan?.tone === "critical" ? "critical" : "neutral",
        sub: state.openLease?.expectedReturnDate
          ? formatLoanDate(state.openLease.expectedReturnDate)
          : "This loan was created without one",
        testId: "device-stat-due",
      };

  const tiles = [
    dueTile,
    holderTile,
    {
      label: "Location",
      value: state.location ?? "Not recorded",
      sub: state.inStock ? "In the warehouse" : "With the holder",
      testId: "device-stat-location",
    },
    {
      label: "Utilization",
      value: `${utilization.daysOut} / ${utilization.windowDays}`,
      sub: `days out, last ${utilization.windowDays}`,
      testId: "device-stat-utilization",
    },
  ];

  /* ---- tabs ------------------------------------------------------------ */

  const tabs = [
    { key: "custody", label: "Custody" },
    { key: "specs", label: "Specs" },
    Number(item.container) > 0 && { key: "contents", label: "Contents" },
  ].filter(Boolean);

  return (
    <>
      <ProfileShell
        breadcrumb={breadcrumb}
        identity={
          <ProfileIdentityCard
            name={clean(item.serial_number)}
            imageUrl={clean(item.image_url) || null}
            chips={chips}
            factGroups={[
              {
                label: "Device",
                items: [
                  { value: clean(item.item_group) },
                  { value: clean(item.category_name), muted: true },
                ],
              },
              {
                label: "Assigned",
                items: [
                  {
                    value: state.openLease?.assignedDate
                      ? `${formatLoanDate(state.openLease.assignedDate)} (${formatRelativeDay(
                          state.openLease.assignedDate
                        )})`
                      : null,
                  },
                ],
              },
            ]}
            actions={actions}
            testId="device-identity"
          />
        }
        stats={<ProfileStatTiles tiles={tiles} testId="device-stats" />}
        tabs={
          <ProfileTabs
            items={tabs}
            activeKey={tab}
            onSelect={setTab}
            ariaLabel="Device sections"
          />
        }
        testId="device-profile"
      >
        <div className="device-body">
          <div>
            {tab === "custody" && (
              <section className="device-card">
                <div className="device-card__head">
                  <h3 className="device-card__title">Custody history</h3>
                  <span className="device-card__note">
                    {timeline.length} {timeline.length === 1 ? "event" : "events"}
                  </span>
                </div>
                <CustodyTimeline entries={timeline} loan={state.loan} />
              </section>
            )}

            {tab === "specs" && (
              <section className="device-card">
                <div className="device-card__head">
                  <h3 className="device-card__title">Specifications</h3>
                </div>
                <DeviceSpecs item={item} />
              </section>
            )}

            {tab === "contents" && (
              <ExtraInformation
                dataFound={legacyDataFound}
                containerInfo={item ?? {}}
              />
            )}
          </div>

          <DeviceSidebar item={item} fleet={fleet} utilization={utilization} />
        </div>
      </ProfileShell>

      {assignOpen && (
        <AssignDeviceDrawer
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          item={item}
          onAssigned={profile.refetchAll}
        />
      )}

      <Modal
        open={Boolean(returnRecord)}
        onCancel={() => setReturnRecord(null)}
        footer={null}
        centered
        title={`Return ${clean(item.serial_number)}`}
        destroyOnClose
      >
        <Suspense
          fallback={
            <div style={CenteringGrid}>
              <DevitrakLoading />
            </div>
          }
        >
          {returnRecord && (
            <ReturnDevice
              storedRecord={returnRecord}
              setStoredRecord={() => setReturnRecord(null)}
              modalHandler={() => {
                setReturnRecord(null);
                profile.refetchAll();
              }}
            />
          )}
        </Suspense>
      </Modal>
    </>
  );
};

export default DeviceProfilePage;
