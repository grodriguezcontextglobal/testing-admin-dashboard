import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, Popconfirm, Avatar } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import { onAddStaffProfile, onResetStaffProfile } from "../../../../store/slices/staffDetailSlide";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { PointFilled, WhitePlusIcon } from "../../../../components/icons/Icons";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";

const HeaderStaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const { watch } = useForm();
  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () => devitrakApi.post("/event/event-list", { company: user.company }),
    enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController()
    eventQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [profile.activeInCompany])

  if (eventQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>;
  if (eventQuery.data || eventQuery.isFetched || eventQuery.isRefetching) {
    const activeOrDesactiveStaffMemberInCompany = async () => {
      try {
        const employeesInCompany = [...profile.companyData.employees];
        const foundUserIndex = employeesInCompany.findIndex(element => element.user === profile.email);

        employeesInCompany[foundUserIndex] = {
          ...employeesInCompany[foundUserIndex],
          active: !profile.status,
        };
        const respoCompany = await devitrakApi.patch(`/company/update-company/${profile.companyData.id}`, {
          employees: employeesInCompany,
        });
        if (respoCompany.data.ok) {
          dispatch(onAddStaffProfile({ ...profile, active: !profile.status, status: !profile.status, companyData: respoCompany.data.company }));
          return;
        }
      } catch (error) {
        console.log("🚀 ~ activeOrDesactiveStaffMemberInCompany ~ error:", error)
      }
    };

    const dataPerCompany = () => {
      if (watch("searchEvent")?.length > 0) {
        const check = eventQuery?.data?.data?.list?.filter(
          (item) =>
            item?.eventInfoDetail?.eventName
              ?.toLowerCase()
              .includes(watch("searchEvent").toLowerCase())
        );
        return check;
      }
      const groupOfCompanies = eventQuery?.data?.data?.list
      return groupOfCompanies;
    };
    dataPerCompany();

    const sortData = () => {
      let result = [];
      let index = 0;
      if (dataPerCompany()) {
        for (let data of dataPerCompany()) {
          if (data.staff.adminUser?.some((item) => item === profile.email)) {
            result.splice(index, 0, { ...data, role: "Administrator" });
            index++;
          } else if (
            data.staff.headsetAttendees?.some((item) => item === profile.email)
          ) {
            result.splice(index, 0, { ...data, role: "Coordinator" });
            index++;
          }
        }
      }
      return result;
    };
    sortData();
    const dataToRenderInTable = () => {
      let tableData = [];
      let index = 0;
      for (let data of sortData()) {
        tableData.splice(index, 0, {
          event: data.eventInfoDetail.eventName,
          status: data.active,
          role: data.role,
          entireData: data,
        });
      }
      return tableData;
    };
    dataToRenderInTable();

    return (
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
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            gap={1}
            item
            xs={6}
          >
            <Button
              style={{
                width: "fit-content",
                ...BlueButton
              }}
            >
              <Typography
                textTransform={"none"}
                style={{ ...BlueButtonText, ...CenteringGrid }}
              >
                <WhitePlusIcon />&nbsp;
                Add new staff
              </Typography>
            </Button>
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
                <Typography
                  style={{ ...TextFontsize18LineHeight28, textAlign: "left", color: "var(--blue-dark-600)" }}
                  onClick={() => dispatch(onResetStaffProfile())}
                >
                  All staff
                </Typography>
              </Link>
              <Typography
                style={{ ...TextFontsize18LineHeight28, textAlign: "left", color: "var(--gray-900)" }}
              >
                <Icon icon="mingcute:right-line" />
                {profile.firstName}, {profile?.lastName}
              </Typography>
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
          xs={12} sm={12} md={12} lg={12}
        >
          <Grid
            display={"flex"}
            justifyContent={"space-around"}
            alignItems={"center"}
            alignSelf={'flex-start'}
            container
          >
            <Grid item xs={12} sm={12} md={3} lg={3}><Avatar src={profile?.adminUserInfo?.imageProfile} style={{ width: "5rem", height: "5rem" }}>
              {!profile.adminUserInfo.imageProfile && `${profile?.firstName[0]} ${profile?.lastName[0]}`}</Avatar></Grid>
            <Grid item xs={12} sm={12} md={9} lg={9}>
              <Typography
                style={{ ...TextFontsize18LineHeight28, textAlign: "left", color: "var(--gray-900)", width: "100%" }}>
                Name
              </Typography>
              <Typography
                textAlign={"left"}
                paddingTop={"8px"}
                style={{ ...TextFontSize30LineHeight38, width: "100%" }}
              >
                {profile?.firstName} {profile?.lastName}
              </Typography>
              <Typography
                textTransform={"capitalize"}
                style={{ ...TextFontsize18LineHeight28, textAlign: "left", color: "var(--gray-900)", width: "100%" }}>
                {profile?.role}
              </Typography></Grid>

          </Grid>
          <Grid
            display={"flex"}
            flexDirection={'column'}
            justifyContent={"flex-start"}
            textAlign={"center"}
            alignSelf={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              style={{ ...TextFontsize18LineHeight28, textAlign: "left", color: "var(--gray-900)", width: "100%" }}
            >
              Contact
            </Typography>
            <Typography
              textAlign={"left"}
              paddingTop={"8px"}
              style={{ ...TextFontSize30LineHeight38, width: "100%" }}
            >
              {profile.adminUserInfo.phone ? profile.adminUserInfo.phone : "+1-000-000-0000"}
            </Typography>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...TextFontSize30LineHeight38, width: "100%" }}
            >
              {profile?.email}
            </Typography>
          </Grid>
          <Grid
            container
            justifyContent="flex-end"
            alignItems="flex-start"
            alignSelf={'start'}
          >
            <Grid
              display={"flex"}
              justifyContent="flex-end"
              alignItems="flex-start"
              flexDirection={'column'}
              gap={1}
              item
              xs={12}
            >
              <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                {user.role === "Administrator" &&
                  <Button style={{ background: "transparent" }}>

                    <Popconfirm title={`Do you want to ${profile.active ? "remove" : "grant"} access to this staff member?`} onConfirm={() => activeOrDesactiveStaffMemberInCompany()}>
                      <Typography
                        textTransform={"none"}
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
                          backgroundColor: `${!profile.status ? "var(--blue-50, #EFF8FF)"
                            : "var(--success-50, #ECFDF3)"}`,
                          color: `${!profile.status ? "var(--blue-700, #175CD3)"
                            : "var(--success-700, #027A48)"}`
                        }}
                      >
                        {profile.status ? (
                          <PointFilled style={{ color: "#12b76a" }} />

                        ) : (
                          <PointFilled style={{ color: "#D0D5DD" }} />
                        )}{profile.status ? "Active" : "Inactive"}
                      </Typography>
                    </Popconfirm>
                  </Button>}

              </div>
              <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
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
                  <Typography
                    color={
                      dataToRenderInTable().some(
                        (item) => item.status
                      )
                        ? "var(--primary-700, #6941C6)"
                        : "var(--orange-700, #B93815)"
                    }
                    fontSize={"12px"}
                    fontFamily={"Inter"}
                    fontStyle={"normal"}
                    fontWeight={500}
                    lineHeight={"18px"}
                    textAlign={"left"}
                    textTransform={"capitalize"}
                  >
                    <Icon
                      icon="tabler:point-filled"
                      rotate={3}
                      color={
                        dataToRenderInTable().some(
                          (item) => item.status
                        )
                          ? "var(--primary-700, #6941C6)"
                          : "#EF6820"
                      }
                    />
                    {dataToRenderInTable().some(
                      (item) => item.status
                    )
                      ? "Active at event"
                      : "No active event"}
                  </Typography>
                </span>
              </div>
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    );
  }
};

export default HeaderStaffDetail;
