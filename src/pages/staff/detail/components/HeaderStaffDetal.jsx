import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Breadcrumb, Button, Divider } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import dicRole from "../../../../components/general/dicRole";
import { PointFilled } from "../../../../components/icons/PointFilled";
import { WhitePlusIcon } from "../../../../components/icons/WhitePlusIcon";
import { onResetStaffProfile } from "../../../../store/slices/staffDetailSlide";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
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
        type: "event",
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
      const sortedResultValue = Array.from(findingEvent);
      return sortedResultValue.sort((a, b) => a.startingDate - b.startingDate);
    };

    const breadcrumbItems = [
      {
        title: (
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
        ),
      },
      {
        title: (
          <p
            style={{
              ...TextFontsize18LineHeight28,
              textAlign: "left",
              color: "var(--gray-900)",
            }}
          >
            {profile.firstName}, {profile?.lastName}
          </p>
        ),
      },
    ];

    const styleGrid = {
      display: "flex",
      flexDirection: "column",
      justifyContent: {
        xs: "center",
        sm: "center",
        md: "flex-start",
        lg: "flex-start",
      },
      alignItems: "flex-start",
    };
    const renderingOptions = (id) => {
      switch (id) {
        case 0:
          return {
            ...TextFontsize18LineHeight28,
            textAlign: "left",
            textTransform: "capitalize",
            width: "100%",
          };
        case 1:
          return {
            ...TextFontSize30LineHeight38,
            textAlign: "left",
            textTransform: "capitalize",
            width: "100%",
          };
        case 2:
          return {
            ...TextFontsize18LineHeight28,
            textTransform: "capitalize",
            color: "var(--gray-900)",
            textAlign: "left",
            fontWeight: 400,
            width: "100%",
          };
        default:
          return null;
      }
    };

    return (
      <>
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid item xs={12} sm={12} md={6} lg={6}>
            <Typography
              style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}
            >
              Staff
            </Typography>
          </Grid>
          <Grid
            sx={{
              justifyContent: {
                xs: "flex-start",
                sm: "flex-start",
                md: "flex-end",
                lg: "flex-end",
              },
            }}
            display={Number(user.role) < 2 ? "flex" : "none"}
            alignItems={"center"}
            gap={1}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            {" "}
            <Button style={BlueButton} onClick={() => setModalState(true)}>
              <p style={{ ...BlueButtonText, textTransform: "none" }}>
                <WhitePlusIcon /> Add new staff
              </p>
            </Button>
          </Grid>
          <Breadcrumb path={breadcrumbItems} />
          <Divider />
          <Grid
            sx={{
              display: "flex",
              flexDirection: {
                xs: "column",
                sm: "column",
                md: "row",
                lg: "row",
              },
            }}
            alignSelf={"flex-start"}
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
          >
            <Grid
              sx={{
                ...styleGrid,
                flexDirection: "row",
              }}
              item
              xs={12}
              sm={12}
              md={3}
              lg={3}
            >
              {" "}
              <Avatar
                src={profile?.adminUserInfo?.imageProfile}
                style={{ width: "5rem", height: "5rem" }}
              >
                {!profile.adminUserInfo.imageProfile &&
                  `${profile?.firstName[0]} ${profile?.lastName[0]}`}
              </Avatar>
            </Grid>
            <Grid sx={styleGrid} item xs={12} sm={12} md={9} lg={9}>
              {[
                { title: "name", id: 0 },
                { title: `${profile?.firstName} ${profile?.lastName}`, id: 1 },
                { title: dicRole[profile?.role], id: 2 },
              ].map((item) => (
                <Typography
                  key={item.id}
                  sx={{
                    ...renderingOptions(item.id),
                    textAlign: {
                      xs: "center",
                      sm: "center",
                      md: "left",
                      lg: "left",
                    },
                    width: "100%",
                    margin: item.id === 2 ? "0 auto 20px" : "auto",
                  }}
                >
                  {item.title}
                </Typography>
              ))}
            </Grid>
          </Grid>
          <Grid
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: {
                xs: "center",
                sm: "center",
                md: "flex-start",
                lg: "flex-start",
              },
              alignSelf: "flex-start",
            }}
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
          >
            <Typography
              sx={{
                ...TextFontsize18LineHeight28,
                textAlign: {
                  xs: "center",
                  sm: "center",
                  md: "left",
                  lg: "left",
                },
                color: "var(--gray-900)",
                width: "100%",
              }}
            >
              Contact
            </Typography>
            <Typography
              sx={{
                ...TextFontSize30LineHeight38,
                width: "100%",
                textAlign: {
                  xs: "center",
                  sm: "center",
                  md: "left",
                  lg: "left",
                },
                paddingTop: "8px",
              }}
            >
              {profile.adminUserInfo.phone
                ? profile.adminUserInfo.phone
                : "+1-000-000-0000"}
            </Typography>
            <Typography
              sx={{
                ...TextFontsize18LineHeight28,
                textAlign: {
                  xs: "center",
                  sm: "center",
                  md: "left",
                  lg: "left",
                },
                color: "var(--gray-900)",
                width: "100%",
                textTransform: "none",
              }}
            >
              {profile?.email}
            </Typography>
          </Grid>
          <Grid
            sx={{
              ...styleGrid,
              justifyContent: {
                xs: "center",
                sm: "center",
                md: "flex-end",
                lg: "flex-end",
              },
              alignSelf: "flex-start",
            }}
            item
            xs={12}
            sm={12}
            md={3}
            lg={3}
          >
            <Grid container>
              <Grid
                sx={{
                  display: "flex",
                  justifyContent: {
                    xs: "center",
                    sm: "center",
                    md: "flex-end",
                    lg: "flex-end",
                  },
                  alignItems: "flex-start",
                  width: "100%",
                }}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                {Number(user.role) < 2 && (
                  <button
                    style={{ background: "transparent", cursor: "default" }}
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
                  </button>
                )}
              </Grid>
              <Grid
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: {
                    xs: "center",
                    sm: "center",
                    md: "flex-end",
                    lg: "flex-end",
                  },
                  alignItems: "flex-start",
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
