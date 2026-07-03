import { useQuery } from "@tanstack/react-query";
import { Divider, Breadcrumb } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { BadgeWithDot } from "../../../../components/base/badges/badges";
import DevitrakLoading from "../../../../components/animation/DevitrakLoading";
import { usePermission } from "../../../../hooks/usePermission";
import { onResetStaffProfile } from "../../../../store/slices/staffDetailSlide";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { NewStaffMember } from "../../action/NewStaffMember";
import RefactoredHeaderUntitledUiReact from "./RefactoredHeaderUntitledUiReact";

const HeaderStaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const canManageStaff = usePermission("staff:create");
  const [modalState, setModalState] = useState(false);
  const dispatch = useDispatch();

  const eventQuery = useQuery({
    queryKey: ["events-header-section"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        type: "event",
        active: true,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    eventQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [profile.activeInCompany]);

  if (eventQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <DevitrakLoading />
      </div>
    );

  if (eventQuery.data || eventQuery.isFetched || eventQuery.isRefetching) {
    const filterActiveEventsPerStaffMember = () => {
      const data = eventQuery?.data?.data?.list;
      const findingEvent = new Set();
      if (data.length > 0) {
        for (let item of data) {
          const staffMembers = [
            ...item.staff.adminUser,
            ...(item.staff.headsetAttendees ?? []),
          ];
          if (staffMembers.some((element) => element.email === profile.email)) {
            findingEvent.add({
              eventName: item.eventInfoDetail.eventName,
              startingDate: item.eventInfoDetail.dateBegin,
            });
          }
        }
      }
      return Array.from(findingEvent).sort(
        (a, b) => a.startingDate - b.startingDate,
      );
    };

    const activeEvents = filterActiveEventsPerStaffMember();

    const breadcrumbItems = [
      {
        title: (
          <Link
            to="/staff"
            onClick={() => dispatch(onResetStaffProfile())}
            style={{ fontSize: "14px", fontWeight: 500, color: "var(--blue-dark-600)" }}
          >
            All staff
          </Link>
        ),
      },
      {
        title: (
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--gray-900)" }}>
            {profile.firstName}, {profile?.lastName}
          </span>
        ),
      },
    ];

    const actions = [
      canManageStaff && (
        <BadgeWithDot key="status" color={profile.status ? "success" : "gray"}>
          {profile.status ? "Active" : "Inactive"}
        </BadgeWithDot>
      ),
      <BadgeWithDot
        key="event"
        color={activeEvents.length > 0 ? "brand" : "warning"}
      >
        {activeEvents.length > 0
          ? activeEvents.at(-1).eventName
          : "No active event"}
      </BadgeWithDot>,
    ].filter(Boolean);

    return (
      <>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "4px",
            }}
          >
            <h1 style={{ ...TextFontSize30LineHeight38, textAlign: "left", margin: 0 }}>
              Staff
            </h1>
            {canManageStaff && (
              <BlueButtonComponent
                title="Add new staff"
                func={() => setModalState(true)}
              />
            )}
          </div>
          <Breadcrumb
            style={{ margin: "12px 0 8px" }}
            separator=">"
            items={breadcrumbItems}
          />
          <Divider style={{ margin: "0 0 16px" }} />
          <RefactoredHeaderUntitledUiReact actions={actions} />
        </div>
        {modalState && (
          <NewStaffMember
            modalState={modalState}
            setModalState={setModalState}
          />
        )}
      </>
    );
  }
};

export default HeaderStaffDetail;
