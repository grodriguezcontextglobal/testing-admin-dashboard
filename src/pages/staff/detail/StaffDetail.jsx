import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Divider, Popconfirm, Table, message } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { onAddStaffProfile, onResetStaffProfile } from "../../../store/slices/staffDetailSlide";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
// import EditProfileModal from "./EditProfileModal";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";

const StaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  // const [editProfile, setEditProfile] = useState(false);
  const dispatch = useDispatch();
  const { register, watch } = useForm();
  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () => devitrakApi.post("/event/event-list", { company: user.company }),
    enabled: false,
    refetchOnMount: false,
  });
  const queryClient = useQueryClient()
  const [messageApi, contextHolder] = message.useMessage();
  const warning = (type, content) => {
    messageApi.open({
      type: type,
      content: content,
    });
  };

  useEffect(() => {
    const controller = new AbortController()
    eventQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [profile.activeInCompany])

  const columns = [
    {
      title: "Event",
      dataIndex: "event",
      align: "left",
      sorter: {
        compare: (a, b) => ("" + a.event).localeCompare(b.event),
      },
      render: (event) => (
        <span key={`${event}`}>
          <div
            key={`${event}`}
            style={{
              flexDirection: "column",
              fontSize: "14px",
              fontFamily: "Inter",
              lineHeight: "20px",
            }}
          >
            <Typography textTransform={"capitalize"}>{event}</Typography>
          </div>
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      width: "25%",
      responsive: ["lg"],

      sorter: {
        compare: (a, b) => ("" + a.role).localeCompare(b.role),
      },
      render: (role) => (
        <span
          style={{
            alignItems: "center",
            background: `${role !== "Damaged" ? "var(--blue-50, #EFF8FF)" : "#ffefef"
              }`,
            borderRadius: "16px",
            display: "flex",
            justifyContent: "center",
            padding: "2px 8px",
            width: "fit-content",
          }}
        >
          <Typography
            fontSize={"12px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"18px"}
            textAlign={"center"}
            textTransform={"capitalize"}
          >
            {role}
          </Typography>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: "25%",
      sorter: {
        compare: (a, b) => ("" + a.status).localeCompare(b.status),
      },
      render: (status) => (
        <span
          style={{
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${status
              ? "var(--primary-50, #F9F5FF)"
              : "var(--success-50, #ECFDF3)"
              }`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${status
              ? "var(--primary-700, #6941C6)"
              : "var(--success-700, #027A48)"
              }`}
            fontSize={"12px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"18px"}
            textAlign={"center"}
            textTransform={"capitalize"}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${status ? "var(--primary-700, #6941C6)" : "#12B76A"}`}
            />
            {status ? "Active" : "Completed"}
          </Typography>
        </span>
      ),
    },
  ];

  if (eventQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>;
  if (eventQuery.data || eventQuery.isFetched || eventQuery.isRefetching) {
    const activeOrDesactiveStaffMemberInCompany = async () => {
      try {
        const employeesInCompany = [...profile.companyData.employees]; // Create a deep copy
        const foundUserIndex = employeesInCompany.findIndex(element => element.user === profile.email);
    
        if (foundUserIndex === -1) {
          return warning('error', 'User not found in the list of employees.');
        }
    
        employeesInCompany[foundUserIndex] = {
          ...employeesInCompany[foundUserIndex], // Copy existing employee object
          active: !profile.activeInCompany, // Toggle active status
        };
    
        const respoCompany = await devitrakApi.patch(`/company/update-company/${profile.companyData.id}`, {
          employees: employeesInCompany,
        });
    
        if (respoCompany.data.ok) {
          dispatch(onAddStaffProfile({ ...profile, activeInCompany: !profile.activeInCompany, companyData: respoCompany.data.company }));
          queryClient.resetQueries();
          return warning('success', `Staff member is ${!profile.activeInCompany ? 'inactive' : 'active'}. Staff member ${!profile.activeInCompany ? 'does not have' : 'now has'} access to log in to the company account.`);
        }
      } catch (error) {
        console.log("🚀 ~ activeOrDesactiveStaffMemberInCompany ~ error:", error);
        warning('error', 'Something went wrong. Please try again later.');
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
      <>
        {contextHolder}
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
                textTransform={"none"}
                style={{
                  color: "var(--gray-900, #101828)",
                  lineHeight: "38px",
                }}
                textAlign={"left"}
                fontWeight={600}
                fontFamily={"Inter"}
                fontSize={"30px"}
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
                  border: "1px solid var(--blue-dark-600, #155EEF)",
                  borderRadius: "8px",
                  background: "var(--blue-dark-600, #155EEF)",
                  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                }}
              // onClick={() => setOpenDeviceModal(true)}
              >
                <Typography
                  textTransform={"none"}
                  style={{
                    color: "var(--base-white, #FFF",
                    fontSize: "14px",
                    fontWeight: "600",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                  }}
                >
                  <Icon
                    icon="ic:baseline-plus"
                    color="var(--base-white, #FFF"
                    width={20}
                    height={20}
                  />{" "}
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
                    textTransform={"none"}
                    textAlign={"left"}
                    fontWeight={600}
                    fontSize={"18px"}
                    fontFamily={"Inter"}
                    lineHeight={"28px"}
                    color={"var(--blue-dark-600, #155EEF)"}
                    onClick={() => dispatch(onResetStaffProfile())}
                  >
                    All staff
                  </Typography>
                </Link>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontWeight={600}
                  fontSize={"18px"}
                  fontFamily={"Inter"}
                  lineHeight={"28px"}
                  color={"var(--gray-900, #101828)"}
                >
                  <Icon icon="mingcute:right-line" />
                  {profile?.name}, {profile?.lastName}
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
            xs={12}
          >
            <Grid
              padding={"0px"}
              display={"flex"}
              justifyContent={"flex-start"}
              textAlign={"left"}
              alignItems={"flex-start"}
              alignSelf={"stretch"}
              item
              xs={4}
            >
              <Card
                id="card-contact-person"
                style={{
                  borderRadius: "12px",
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  textAlign: "left",
                }}
              >
                <Grid
                  display={"flex"}
                  justifyContent={"space-around"}
                  alignItems={"center"}
                  container
                >
                  <Grid
                    display={"flex"}
                    justifyContent={"flex-start"}
                    textAlign={"center"}
                    alignSelf={"stretch"}
                    alignItems={"center"}
                    item
                    xs={12}
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
                      <Typography
                        color={
                          dataToRenderInTable().some(
                            (item) => item.status === true
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
                              (item) => item.status === true
                            )
                              ? "var(--primary-700, #6941C6)"
                              : "#EF6820"
                          }
                        />
                        {dataToRenderInTable().some(
                          (item) => item.status === true
                        )
                          ? "Active at event"
                          : "No active event"}
                      </Typography>
                    </span>
                  </Grid>
                  <Grid
                    display={"flex"}
                    justifyContent={"flex-start"}
                    textAlign={"left"}
                    alignItems={"center"}
                    item
                    xs={12}
                  >
                    <Typography
                      textAlign={"left"}
                      fontFamily={"Inter"}
                      fontSize={"18px"}
                      fontStyle={"normal"}
                      fontWeight={400}
                      lineHeight={"28px"}
                      color={"var(--gray-900, #101828)"}
                    >
                      Name
                    </Typography>
                  </Grid>
                  <Grid
                    display={"flex"}
                    justifyContent={"left"}
                    textAlign={"left"}
                    alignItems={"center"}
                    item
                    xs={12}
                  >
                    <Typography
                      textAlign={"left"}
                      paddingTop={"8px"}
                      fontFamily={"Inter"}
                      fontSize={"38px"}
                      fontStyle={"normal"}
                      fontWeight={600}
                      lineHeight={"38px"}
                      color={"var(--gray-900, #101828)"}
                    >
                      {profile?.name} {profile?.lastName}
                    </Typography>
                  </Grid>
                  <Grid
                    display={"flex"}
                    justifyContent={"left"}
                    textAlign={"left"}
                    alignItems={"center"}
                    item
                    xs={12}
                  >
                    <Typography
                      textTransform={"capitalize"}
                      textAlign={"left"}
                      paddingTop={"8px"}
                      fontFamily={"Inter"}
                      fontSize={"18px"}
                      fontStyle={"normal"}
                      fontWeight={600}
                      lineHeight={"28px"}
                      color={"var(--gray-900, #101828)"}
                    >
                      {profile?.role}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid
              paddingLeft={"10px"}
              paddingTop={"0px"}
              display={"flex"}
              justifyContent={"flex-start"}
              textAlign={"center"}
              alignItems={"center"}
              alignSelf={"stretch"}
              item
              xs={4}
            >
              <Card
                id="card-contact-person"
                style={{
                  borderRadius: "12px",
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  textAlign: "left",
                }}
              >
                <Grid
                  display={"flex"}
                  justifyContent={"flex-start"}
                  textAlign={"center"}
                  // flexDirection={"column"}
                  alignSelf={"stretch"}
                  alignItems={"center"}
                  item
                  xs={12}
                >
                  <Grid
                    display={"flex"}
                    justifyContent={"space-around"}
                    alignItems={"center"}
                    container
                  >
                    <Grid
                      display={"flex"}
                      justifyContent={"flex-start"}
                      textAlign={"left"}
                      alignItems={"center"}
                      item
                      xs={12}
                    >
                      <Typography
                        textAlign={"left"}
                        fontFamily={"Inter"}
                        fontSize={"18px"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"28px"}
                        color={"var(--gray-900, #101828)"}
                      >
                        Contact
                      </Typography>
                    </Grid>
                    <Grid
                      display={"flex"}
                      justifyContent={"left"}
                      textAlign={"left"}
                      alignItems={"center"}
                      item
                      xs={12}
                    >
                      <Typography
                        textAlign={"left"}
                        paddingTop={"8px"}
                        fontFamily={"Inter"}
                        fontSize={"38px"}
                        fontStyle={"normal"}
                        fontWeight={600}
                        lineHeight={"38px"}
                        color={"var(--gray-900, #101828)"}
                      >
                        {profile.phone ? profile.phone : "+1-000-000-0000"}
                      </Typography>
                    </Grid>
                    <Grid
                      display={"flex"}
                      justifyContent={"left"}
                      textAlign={"left"}
                      alignItems={"center"}
                      item
                      xs={12}
                    >
                      <Typography
                        textTransform={"none"}
                        textAlign={"left"}
                        paddingTop={"8px"}
                        fontFamily={"Inter"}
                        fontSize={"16px"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"24px"}
                        color={"var(--gray-900, #101828)"}
                      >
                        {profile?.email}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid
              padding={"0px"}
              display={"flex"}
              justifyContent={"flex-end"}
              textAlign={"left"}
              alignItems={"flex-start"}
              alignSelf={"stretch"}
              item
              xs={4}
            >
              <Card
                id="card-contact-person"
                style={{
                  borderRadius: "12px",
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  textAlign: "right",
                }}
              >
                <Grid
                  container
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="flex-start"
                >
                  <Grid
                    display={"flex"}
                    // direction="row"
                    justifyContent="flex-end"
                    alignItems="flex-start"
                    gap={1}
                    item
                    xs={12}
                  >
                    <Button
                      style={BlueButton}
                      // onClick={() => setEditProfile(true)}
                    >
                      {profile.email === user.email ? <Typography
                        textTransform={"none"}
                        style={{ ...BlueButtonText, width: "fit-content", margin: "auto" }}
                      >
                        Edit
                      </Typography> :
                        <Popconfirm title="Do you want to remove access to this staff member?" onConfirm={() => activeOrDesactiveStaffMemberInCompany()}>
                          <Typography
                            textTransform={"none"}
                            style={{ ...BlueButtonText, width: "fit-content", margin: "auto" }}
                          >
                            {profile.activeInCompany ? "Inactive" : "Active"}
                          </Typography></Popconfirm>}


                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
          <Divider />
          <Grid
            marginY={3}
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            gap={1}
            container
          >
            <Grid textAlign={"right"} item xs></Grid>
            <Grid justifyContent={"right"} alignItems={"center"} item xs={3}>
              <OutlinedInput
                {...register("searchEvent")}
                style={{
                  borderRadius: "12px",
                  color: "#344054",
                  height: "5dvh",
                }}
                fullWidth
                placeholder="Search events here"
                startAdornment={
                  <InputAdornment position="start">
                    <Icon
                      icon="radix-icons:magnifying-glass"
                      color="#344054"
                      width={20}
                      height={19}
                    />
                  </InputAdornment>
                }
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Table
                sticky
                size="large"
                columns={columns}
                dataSource={
                  dataToRenderInTable() ? dataToRenderInTable() : []
                }
                pagination={{
                  position: ["bottomCenter"],
                }}
                className="table-ant-customized"
              />
            </Grid>
          </Grid>

        </Grid>
        {/* {editProfile && (
          <EditProfileModal
            editProfile={editProfile}
            setEditProfile={setEditProfile}
          />
        )} */}
      </>
    );
  }
};

export default StaffDetail;
