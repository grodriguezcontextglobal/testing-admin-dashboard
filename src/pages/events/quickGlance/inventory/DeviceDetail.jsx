import { InputAdornment, OutlinedInput } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Breadcrumb from "../../../../components/UX/breadcrumbs/Breadcrumb";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import {
  ProfileErrorState,
  ProfileIdentityCard,
  ProfileSection,
  ProfileShell,
  ProfileSkeleton,
  ProfileStatTiles,
  ProfileTabs,
  StatusChip,
} from "../../../../components/UX/profile";
import { onResetDeviceInQuickGlance } from "../../../../store/slices/devicesHandleSlice";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import ActionsMainPage from "./action/MainPage";
import TableDetailPerDevice from "./detailComponent/TableDetailPerDevice";
import TableIssuesPerDevice from "./detailComponent/TableIssuesPerDevice";
import "./eventDeviceDetail.css";
import {
  buildDeviceStatTiles,
  describeDeviceCondition,
  filterDeviceRows,
  readDeviceSelection,
  toAssignmentRows,
  toIssueRows,
} from "./utils/eventDeviceDetail";

/**
 * One device, at one event.
 *
 * Rebuilt on the shared profile shell, so it reads like
 * pages/inventory/details/deviceProfile/DeviceProfilePage.jsx — the global
 * device profile — instead of being the event-scoped copy still written in MUI
 * Grid with inline styles.
 *
 * What the shell replaced:
 *   - A 30px page title reading "Devices", plural and generic, for a page about
 *     one unit. The serial number is the page's only <h1> now.
 *   - An "Add new group of devices" button at the top of a single-device page,
 *     linking to /inventory/new-bulk-items. It was a global inventory action in
 *     the wrong place, reachable from five other entry points, and it carried
 *     `style={{ display: isAssistant(...) && "none" }}` — which never hid
 *     anything, because the UX buttons take `styles`, not `style`, and because
 *     `false && "none"` is `false`, not a CSS value. Assistants saw it.
 *   - A hand-rolled breadcrumb: a "Back" link, an icon, and a text node, with
 *     the state-resetting onClick attached to the text inside the link.
 *   - A three-column grid whose middle column was empty, because the component
 *     that filled it is commented out — so the device facts sat far left and the
 *     actions far right with a gap between them.
 *   - A 28px "Search:" heading above a box placeholdered "Search consumer",
 *     which read as a page-level search rather than a table filter.
 *
 * The two data sources are now two tabs. They used to be concatenated into one
 * table: assignment records and reported-fault records have different shapes,
 * and the shared status column read `record.device.status` — which on a fault
 * record is `undefined`, because there `device` is the serial string. A device
 * written off as lost was displayed as "Returned".
 */

const breadcrumbLinkStyle = {
  ...TextFontsize18LineHeight28,
  color: "var(--blue-dark-600, #155EEF)",
  cursor: "pointer",
};

const breadcrumbCurrentStyle = {
  ...TextFontsize18LineHeight28,
  color: "var(--gray-900, #101828)",
};

const TABS = [
  { key: "history", label: "Assignment history" },
  { key: "issues", label: "Reported issues" },
];

const DeviceDetail = () => {
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab] = useState("history");
  const [search, setSearch] = useState("");

  const device = readDeviceSelection(deviceInfoSelected);
  const companyId = user?.companyData?.id;
  const eventName = event?.eventInfoDetail?.eventName;

  // Fetching lives here rather than inside the table, which used to run two
  // `useCallback`s with empty dependency arrays that appended to the state they
  // closed over, driven by an effect keyed on those arrays' lengths — so every
  // mount fetched everything twice.
  const assignmentsQuery = useQuery({
    queryKey: ["eventDeviceAssignments", eventName, companyId, device.serialNumber],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        "device.serialNumber": device.serialNumber,
        eventSelected: eventName,
        company: companyId,
      }),
    enabled: Boolean(device.serialNumber && eventName && companyId),
  });

  const issuesQuery = useQuery({
    queryKey: ["eventDeviceIssues", eventName, event?.company, device.serialNumber],
    queryFn: () =>
      devitrakApi.post("/receiver/list-receiver-returned-issue", {
        device: device.serialNumber,
        eventSelected: eventName,
        provider: event.company,
      }),
    enabled: Boolean(device.serialNumber && eventName && event?.company),
  });

  const assignments = toAssignmentRows(assignmentsQuery.data?.data?.listOfReceivers);
  const issues = toIssueRows(issuesQuery.data?.data?.record);
  const condition = describeDeviceCondition(device);

  const goBackToEvent = () => {
    dispatch(onResetDeviceInQuickGlance());
    navigate("/events/event-quickglance");
  };

  const breadcrumb = (
    <Breadcrumb
      path={[
        {
          title: <p style={breadcrumbLinkStyle}>{eventName ?? "Event"}</p>,
          onClick: goBackToEvent,
        },
        {
          title: (
            <p style={breadcrumbCurrentStyle} data-testid="device-detail-title">
              {device.serialNumber ?? "Device"}
            </p>
          ),
        },
      ]}
    />
  );

  // Reloading /device-quick-glance, or arriving after the selection was reset,
  // used to read `deviceInfoSelected.entireData.type` and blank the page.
  if (!device.hasData) {
    return (
      <div style={{ padding: "16px 24px 24px" }}>
        <ProfileShell breadcrumb={breadcrumb}>
          <ProfileErrorState
            title="No device selected"
            description="Open a device from the event's inventory list to see its history."
            action={
              <Link to="/events/event-quickglance">
                <GrayButtonComponent title="Back to the event" />
              </Link>
            }
          />
        </ProfileShell>
      </div>
    );
  }

  const isLoading = assignmentsQuery.isLoading || issuesQuery.isLoading;
  const isError = assignmentsQuery.isError || issuesQuery.isError;

  const activeRows = filterDeviceRows(
    tab === "history" ? assignments : issues,
    search
  );

  const section = () => {
    if (isError) {
      return (
        <ProfileErrorState
          title="Couldn't load this device's history"
          description="The service didn't respond. Nothing was changed."
          action={
            <GrayButtonComponent
              title="Try again"
              func={() => {
                assignmentsQuery.refetch();
                issuesQuery.refetch();
              }}
            />
          }
        />
      );
    }

    const isHistory = tab === "history";
    return (
      <ProfileSection
        title={isHistory ? "Assignment history" : "Reported issues"}
        count={isLoading ? undefined : activeRows.length}
        description={
          isHistory
            ? "Every time this unit was handed to a consumer at this event."
            : "Faults recorded against this unit at this event."
        }
        testId="device-history-section"
        actions={
          <div className="device-toolbar">
            <div className="device-toolbar__search">
              <OutlinedInput
                value={search}
                onChange={(changeEvent) => setSearch(changeEvent.target.value)}
                style={OutlinedInputStyle}
                fullWidth
                size="small"
                placeholder={isHistory ? "Search consumer" : "Search note or holder"}
                aria-label="Filter this device's history"
                startAdornment={
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                }
                endAdornment={
                  search ? (
                    <InputAdornment position="end">
                      <X
                        size={16}
                        role="button"
                        aria-label="Clear search"
                        color="var(--gray-500, #777b73)"
                        style={{ cursor: "pointer" }}
                        onClick={() => setSearch("")}
                      />
                    </InputAdornment>
                  ) : null
                }
              />
            </div>
          </div>
        }
      >
        <div style={{ padding: "0 16px 12px" }}>
          {isHistory ? (
            <TableDetailPerDevice rows={activeRows} isLoading={isLoading} />
          ) : (
            <TableIssuesPerDevice rows={activeRows} isLoading={isLoading} />
          )}
        </div>
      </ProfileSection>
    );
  };

  return (
    <div style={{ padding: "16px 24px 24px" }}>
      <ProfileShell
        testId="event-device-detail"
        breadcrumb={breadcrumb}
        identity={
          <ProfileIdentityCard
            name={device.serialNumber}
            chips={[
              <StatusChip
                key="condition"
                tone={condition.tone}
                pip
                label={condition.label}
              />,
              device.type ? (
                <StatusChip key="type" label={device.type} />
              ) : null,
            ].filter(Boolean)}
            factGroups={[
              {
                label: "Device",
                items: [
                  { value: device.type },
                  { value: device.provider, muted: true },
                ],
              },
              {
                label: "Event",
                items: [
                  { value: eventName },
                  { value: event?.eventInfoDetail?.address, muted: true },
                ],
              },
              {
                label: "Condition",
                items: [
                  { value: device.status ?? "Operational" },
                  {
                    value: device.isAssigned
                      ? "Out with a consumer"
                      : device.isLost
                      ? "Written off"
                      : "In the event pool",
                    muted: true,
                  },
                ],
              },
            ]}
            actions={
              <ActionsMainPage
                onChanged={() => {
                  assignmentsQuery.refetch();
                  issuesQuery.refetch();
                }}
              />
            }
            testId="device-identity"
          />
        }
        stats={
          isError ? null : isLoading ? (
            <ProfileSkeleton lines={2} />
          ) : (
            <ProfileStatTiles
              tiles={buildDeviceStatTiles({ assignments, issues, condition })}
              testId="event-device-stats"
            />
          )
        }
        tabs={
          <ProfileTabs
            items={TABS}
            activeKey={tab}
            onSelect={(next) => {
              setTab(next);
              // The two tabs search different fields; carrying a term across
              // would silently show an empty table.
              setSearch("");
            }}
            ariaLabel="Device sections"
          />
        }
      >
        {section()}
      </ProfileShell>
    </div>
  );
};

export default DeviceDetail;
