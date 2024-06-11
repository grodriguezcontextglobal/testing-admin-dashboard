import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Divider, Popconfirm } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import { PointFilled, WhitePlusIcon } from "../../../../components/icons/Icons";
import {
  onAddStaffProfile,
  onResetStaffProfile,
} from "../../../../store/slices/staffDetailSlide";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import dicRole from "../../../../components/general/dicRole";
import { NewStaffMember } from "../../action/NewStaffMember";

const HeaderStaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const [modalState, setModalState] = useState(false);
  const dispatch = useDispatch();
  const eventQuery = useQuery({
    queryKey: ["events-header-section"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        active: true,
      }),
    // enabled: false,
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
        <Loading />
      </div>
    );
  if (eventQuery.data || eventQuery.isFetched || eventQuery.isRefetching) {
    const activeOrDesactiveStaffMemberInCompany = async () => {
      try {
        const employeesInCompany = [...profile.companyData.employees];
        const foundUserIndex = employeesInCompany.findIndex(
          (element) => element.user === profile.email
        );

        employeesInCompany[foundUserIndex] = {
          ...employeesInCompany[foundUserIndex],
          active: !profile.status,
        };
        const respoCompany = await devitrakApi.patch(
          `/company/update-company/${profile.companyData.id}`,
          {
            employees: employeesInCompany,
          }
        );
        if (respoCompany.data.ok) {
          dispatch(
            onAddStaffProfile({
              ...profile,
              active: !profile.status,
              status: !profile.status,
              companyData: respoCompany.data.company,
            })
          );
          return;
        }
      } catch (error) {
        console.log(
          "🚀 ~ activeOrDesactiveStaffMemberInCompany ~ error:",
          error
        );
      }
    };

    const filterActiveEventsPerStaffMember = () => {
      const data = eventQuery.data.data.list;
      const findingEvent = new Set();
      for (let item of data) {
        const staffMembers = [
          ...item.staff.adminUser,
          ...item.staff.headsetAttendees,
        ];
        if (staffMembers.some((element) => element.email === profile.email)) {
          findingEvent.add({
            eventName: item.eventInfoDetail.eventName,
            startingDate: item.eventInfoDetail.dateBegin,
          });
        }
      }
      const sortedResultValue = Array.from(findingEvent);
      return sortedResultValue.sort((a, b) => a.startingDate - b.startingDate);
    };
    return (
      <>
        <Grid
          style={{
            padding: "5px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
          container
        >
          <Grid
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            container
          >
            <Grid item xs={6}>
              <Typography
                style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}
              >
                Staff
              </Typography>
            </Grid>
            <Grid
              textAlign={"right"}
              display={Number(user.role) < 2 ? "flex" : "none"}
              justifyContent={"flex-end"}
              alignItems={"center"}
              gap={1}
              item
              xs={6}
            >
              {" "}
              <button style={BlueButton} onClick={() => setModalState(true)}>
                <WhitePlusIcon />
                <p style={{ ...BlueButtonText, textTransform: "none" }}>
                  Add new staff
                </p>
              </button>
            </Grid>
          </Grid>
          <Grid
            style={{
              paddingTop: "0px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            container
          >
            <Grid marginY={0} item xs={8}>
              <Grid
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                item
                xs={12}
              >
                <Link to="/staff">
                  <button
                    style={{
                      backgroundColor: "transparent",
                      outline: "none",
                      margin: 0,
                      padding: 0,
                    }}
                    onClick={() => dispatch(onResetStaffProfile())}
                  >
                    {" "}
                    <p
                      style={{
                        ...TextFontsize18LineHeight28,
                        textAlign: "left",
                        color: "var(--blue-dark-600)",
                      }}
                    >
                      All staff
                    </p>
                  </button>
                </Link>
                <p
                  style={{
                    ...TextFontsize18LineHeight28,
                    textAlign: "left",
                    color: "var(--gray-900)",
                  }}
                >
                  <Icon icon="mingcute:right-line" />
                  {profile.firstName}, {profile?.lastName}
                </p>
              </Grid>
            </Grid>
            <Grid textAlign={"right"} item xs={4}></Grid>
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            justifyContent={"left"}
            textAlign={"left"}
            alignItems={"center"}
            height={"10rem"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Grid
              display={"flex"}
              justifyContent={"space-around"}
              alignItems={"center"}
              alignSelf={"flex-start"}
              container
            >
              <Grid item xs={12} sm={12} md={3} lg={3}>
                <Avatar
                  src={profile?.adminUserInfo?.imageProfile}
                  style={{ width: "5rem", height: "5rem" }}
                >
                  {!profile.adminUserInfo.imageProfile &&
                    `${profile?.firstName[0]} ${profile?.lastName[0]}`}
                </Avatar>
              </Grid>
              <Grid item xs={12} sm={12} md={9} lg={9}>
                <p
                  style={{
                    ...TextFontsize18LineHeight28,
                    textAlign: "left",
                    color: "var(--gray-900)",
                    width: "100%",
                  }}
                >
                  Name
                </p>
                <p
                  style={{
                    ...TextFontSize30LineHeight38,
                    textAlign: "left",
                    width: "100%",
                    paddingTop: "8px",
                  }}
                >
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p
                  style={{
                    ...TextFontsize18LineHeight28,
                    textAlign: "left",
                    color: "var(--gray-900)",
                    width: "100%",
                    textTransform: "capitalize",
                  }}
                >
                  {dicRole[profile?.role]}
                </p>
              </Grid>
            </Grid>
            <Grid
              display={"flex"}
              flexDirection={"column"}
              justifyContent={"flex-start"}
              textAlign={"center"}
              alignSelf={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <p
                style={{
                  ...TextFontsize18LineHeight28,
                  textAlign: "left",
                  color: "var(--gray-900)",
                  width: "100%",
                }}
              >
                Contact
              </p>
              <p
                style={{
                  ...TextFontSize30LineHeight38,
                  width: "100%",
                  textAlign: "left",
                  paddingTop: "8px",
                }}
              >
                {profile.adminUserInfo.phone
                  ? profile.adminUserInfo.phone
                  : "+1-000-000-0000"}
              </p>
              <p
                style={{
                  ...TextFontsize18LineHeight28,
                  textAlign: "left",
                  color: "var(--gray-900)",
                  width: "100%",
                  textTransform: "none",
                }}
              >
                {profile?.email}
              </p>
            </Grid>
            <Grid
              container
              justifyContent="flex-end"
              alignItems="flex-start"
              alignSelf={"start"}
            >
              <Grid
                display={"flex"}
                justifyContent="flex-end"
                alignItems="flex-start"
                flexDirection={"column"}
                gap={1}
                item
                xs={12}
              >
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  {/* {user.role === "Administrator" && ( */}
                  {Number(user.role) < 2 && (
                    <button style={{ background: "transparent" }}>
                      <Popconfirm
                        title={`Do you want to ${
                          profile.active ? "remove" : "grant"
                        } access to this staff member?`}
                        onConfirm={() =>
                          activeOrDesactiveStaffMemberInCompany()
                        }
                      >
                        <p
                          style={{
                            ...BlueButtonText,
                            fontWeight: 400,
                            width: "fit-content",
                            margin: "auto",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            borderRadius: "12px",
                            padding: "1px 5px",
                            backgroundColor: `${
                              !profile.status
                                ? "var(--blue-50, #EFF8FF)"
                                : "var(--success-50, #ECFDF3)"
                            }`,
                            color: `${
                              !profile.status
                                ? "var(--blue-700, #175CD3)"
                                : "var(--success-700, #027A48)"
                            }`,
                            textTransform: "none",
                          }}
                        >
                          {profile.status ? (
                            <PointFilled style={{ color: "#12b76a" }} />
                          ) : (
                            <PointFilled style={{ color: "#D0D5DD" }} />
                          )}
                          {profile.status ? "Active" : "Inactive"}
                        </p>
                      </Popconfirm>
                    </button>
                  )}
                </div>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      borderRadius: "16px",
                      justifyContent: "flex-start",
                      display: "flex",
                      padding: "2px 8px",
                      alignItems: "center",
                      mixBlendMode: "multiply",
                      background: "var(--orange-dark-50, #FFF4ED)",
                      width: "fit-content",
                      marginBottom: "5px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        fontFamily: "Inter",
                        fontStyle: "normal",
                        fontWeight: 500,
                        lineHeight: "18px",
                        textAlign: "left",
                        textTransform: "capitalize",
                        color: `${
                          filterActiveEventsPerStaffMember().length > 0
                            ? "var(--primary-700, #6941C6)"
                            : "var(--orange-700, #B93815)"
                        }`,
                      }}
                    >
                      <Icon
                        icon="tabler:point-filled"
                        rotate={3}
                        color={
                          filterActiveEventsPerStaffMember().length > 0
                            ? "var(--primary-700, #6941C6)"
                            : "#EF6820"
                        }
                      />
                      {filterActiveEventsPerStaffMember().length > 0
                        ? filterActiveEventsPerStaffMember().at(-1).eventName
                        : "No active event"}
                      {/* */}
                    </p>
                  </span>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
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
