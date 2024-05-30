import { Grid, OutlinedInput, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Modal,
  Popconfirm,
  Select,
  Space,
  notification,
} from "antd";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
  onAddEventData,
  onAddEventStaff,
} from "../../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { CardStyle } from "../../../../../styles/global/CardStyle";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import PropTypes from "prop-types";

const EditingStaff = ({ editingStaff, setEditingStaff }) => {
  const { register, handleSubmit, watch } = useForm();
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [roleSelected, setRoleSelected] = useState("");
  const [checkingStaffInfo, setCheckingStaffInfo] = useState([]);
  const { event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const staffEventQuery = useQuery({
    queryKey: ["staffEvent"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
    enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    staffEventQuery.refetch();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryClient = useQueryClient();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };

  const validateEmailFormat = (props) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(props);
  };
  const checkStaffExisting = async () => {
    const companyInfo = await devitrakApi.post("company/search-company", {
      company_name: event.company,
      "employees.user": watch("email"),
    });
    return setCheckingStaffInfo([
      {
        company: companyInfo.data.company[0],
      },
    ]);
  };
  useEffect(() => {
    const controller = new AbortController();
    if (validateEmailFormat(watch("email"))) {
      checkStaffExisting();
    } else {
      setCheckingStaffInfo([]);
    }
    return () => {
      controller.abort();
    };
  }, [watch("email")?.length]);

  if (staffEventQuery.data) {
    const employee = staffEventQuery.data.data.adminUsers;
    const groupingEmployees = _.groupBy(employee, "email");
    const result = new Map();
    const mergeStaffInEvent2 = async () => {
      for (let data of event.staff.adminUser) {
        if (groupingEmployees[data.email]) {
          if (!result.has(data.email)) {
            result.set(data.email, {
              name: `${groupingEmployees[data.email].at(-1).name} ${
                groupingEmployees[data.email].at(-1).lastName
              }`,
              role: "Administrator",
              online: groupingEmployees[data.email].at(-1).online,
              email: groupingEmployees[data.email].at(-1).email,
              id: groupingEmployees[data.email].at(-1).id,
            });
          }
        }
        if (!result.has(data.email)) {
          result.set(data.email, {
            name: `${data.firstName} ${data.lastName}`,
            role: "Assistant",
            online: false,
            email: data.email,
          });
        }
      }
      for (let data of event.staff.headsetAttendees) {
        if (groupingEmployees[data.email]) {
          if (!result.has(data.email)) {
            result.set(data.email, {
              name: `${groupingEmployees[data.email].at(-1).name} ${
                groupingEmployees[data.email].at(-1).lastName
              }`,
              role: "Assistant",
              online: groupingEmployees[data.email].at(-1).online,
              email: groupingEmployees[data.email].at(-1).email,
              id: groupingEmployees[data.email].at(-1).id,
            });
          }
        }
        if (!result.has(data.email)) {
          result.set(data.email, {
            name: `${data.firstName} ${data.lastName}`,
            role: "Assistant",
            online: false,
            email: data.email,
          });
        }
      }
    };
    mergeStaffInEvent2();
    const closeModal = () => {
      return setEditingStaff(false);
    };

    const removeStaff = async (props) => {
      if (String(props.role).toLowerCase() === "administrator") {
        const result = event.staff.adminUser.filter(
          (member) => member.email !== props.email
        );
        const responseUpdating = await devitrakApi.patch(
          `/event/edit-event/${event.id}`,
          {
            staff: {
              adminUser: result,
              headsetAttendees: event.staff.headsetAttendees,
            },
          }
        );
        dispatch(onAddEventData(responseUpdating.data.event));
        dispatch(onAddEventStaff(responseUpdating.data.event.staff));
      } else {
        const result = event.staff.headsetAttendees.filter(
          (member) => member.email !== props.email
        );
        const responseUpdating = await devitrakApi.patch(
          `/event/edit-event/${event.id}`,
          {
            staff: {
              adminUser: event.staff.adminUser,
              headsetAttendees: result,
            },
          }
        );
        dispatch(onAddEventData(responseUpdating.data.event));
        dispatch(onAddEventStaff(responseUpdating.data.event.staff));
      }
    };
    const handleChange = (value) => {
      return setRoleSelected(value);
    };
    const newStaffMemberCreated = async (data) => {
      try {
        const companiesQuery = await devitrakApi.post(
          "company/search-company",
          {
            company_name: event.company,
          }
        );
        const templateNewUser = {
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          question: "company name",
          answer: event.company,
          role: 4,
          company: event.company,
        };
        await devitrakApi.patch(
          `/company/update-company/${companiesQuery.data.company[0].id}`,
          {
            employees: [
              ...companiesQuery.data.company[0].employees,
              {
                user: templateNewUser.email,
                firstName: templateNewUser.name,
                lastName: templateNewUser.lastName,
                status: "Pending",
                super_user: false,
                role: templateNewUser.role,
              },
            ],
          }
        );

        await devitrakApi.post("/nodemailer/new_invitation", {
          consumer: templateNewUser.email,
          subject: "Invitation",
          company: event.company,
          link: `https://admin.devitrak.net/invitation?first=${templateNewUser.name}&last=${templateNewUser.lastName}&email=${templateNewUser.email}&question=${templateNewUser.question}&answer=${templateNewUser.answer}&role=${templateNewUser.role}&company=${templateNewUser.company}`,
        });
        queryClient.invalidateQueries({
          queryKey: ["listAdminUsers"],
          exact: true,
        });
        queryClient.invalidateQueries({ queryKey: ["staff"], exact: true });
        queryClient.invalidateQueries({
          queryKey: ["employeesPerCompanyList"],
          exact: true,
        });
        openNotificationWithIcon(
          "success",
          `An invitation was sent to ${data.name} ${data.lastName}!`
        );
      } catch (error) {
        openNotificationWithIcon(
          "error",
          "Please try later. If error persists, please contact administrator."
        );
      }
    };

    const checkingIfStaffWouldBeAdded = async (data) => {
      if (!checkingStaffInfo[0].company) {
        await newStaffMemberCreated(data);
      } else {
        return;
      }
    };

    const handleNewStaffMember = async (data) => {
      try {
        setLoadingStatus(true);
        await checkingIfStaffWouldBeAdded(data);
        if (String(roleSelected).toLowerCase() === "administrator") {
          const result = [
            ...event.staff.adminUser,
            {
              firstName: data.name,
              lastName: data.lastName,
              email: data.email,
            },
          ];
          const response = await devitrakApi.patch(
            `/event/edit-event/${event.id}`,
            {
              staff: {
                adminUser: result,
                headsetAttendees: event.staff.headsetAttendees,
              },
            }
          );
          dispatch(onAddEventData(response.data.event));
          dispatch(onAddEventStaff(response.data.event.staff));
        } else {
          const result = [
            ...event.staff.headsetAttendees,
            {
              firstName: data.name,
              lastName: data.lastName,
              email: data.email,
            },
          ];
          const response = await devitrakApi.patch(
            `/event/edit-event/${event.id}`,
            {
              staff: {
                adminUser: event.staff.adminUser,
                headsetAttendees: result,
              },
            }
          );
          dispatch(onAddEventData(response.data.event));
          dispatch(onAddEventStaff(response.data.event.staff));
        }
        queryClient.invalidateQueries({
          queryKey: ["staffEvent"],
          exact: true,
        });
        await devitrakApi.post("/nodemailer/staff_internal_notification", {
          staff: data.email,
          subject: `Invitation to Join ${event.eventInfoDetail.eventName} as a Staff Member`,
          company: event.company,
          staffMember: `${data.name} ${data.lastName}`,
          eventInfo:{
            eventName:event.eventInfoDetail.eventName,
            address:event.eventInfoDetail.address,
            dateBegin:event.eventInfoDetail.dateBegin
          },
          contactInfo:{
            name:event.contactInfo.name,
            email:event.contactInfo.email
          }
        });

        setLoadingStatus(false);
        openNotificationWithIcon("success", "Staff member added to event.");
        await closeModal();
      } catch (error) {
        console.log("🚀 ~ handleNewStaffMember ~ error:", error);
        setLoadingStatus(false);
      }
    };
    return (
      <Modal
        open={editingStaff}
        onCancel={() => closeModal()}
        centered
        width={1000}
        footer={[]}
      >
        {contextHolder}
        <Grid container>
          <Grid padding={"0 25px 0 0"} item xs={10} sm={10} md={12} lg={12}>
            <form
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                width: "100%",
              }}
              onSubmit={handleSubmit(handleNewStaffMember)}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <OutlinedInput
                  placeholder="Email"
                  {...register("email")}
                  style={{ ...OutlinedInputStyle, width: "100%" }}
                />
                {}
                <Select
                  style={{ ...AntSelectorStyle, width: "60%" }}
                  onChange={handleChange}
                  options={[
                    {
                      value: "administrator",
                      label: "Event administrator",
                    },
                    {
                      value: "headsetAttendee",
                      label: "Event headset Attendees",
                    },
                    {
                      value: "eventStaffOnly",
                      label: "Event staff only",
                    },
                  ]}
                ></Select>
              </div>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    ...Subtitle,
                    color: "var(--danger-action)",
                    cursor: "pointer",
                    display: `${
                      checkingStaffInfo[0]?.company ? "none" : "flex"
                    }`,
                  }}
                >
                  Staff members are not initially assigned to the company as
                  employees. By clicking the &quot;Add Staff&quot; button, a
                  staff member will be added to the company as an employee at{" "}
                  {event.company}.
                </p>
              </div>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <OutlinedInput
                  placeholder="First name"
                  style={{ ...OutlinedInputStyle, width: "100%" }}
                  {...register("name", { required: true })}
                />
                <OutlinedInput
                  placeholder="Last name"
                  style={{ ...OutlinedInputStyle, width: "100%" }}
                  {...register("lastName", { required: true })}
                />
              </div>
              <Button
                style={{ ...BlueButton, width: "100%" }}
                loading={loadingStatus}
                htmlType="submit"
              >
                <Typography style={BlueButtonText}>Add staff</Typography>
              </Button>
            </form>
            <Divider />
            <Grid item xs={12} sm={12} md={12} lg={12}>
              <Space size={[8, 16]} wrap>
                {[...result.values()].map((member) => {
                  return (
                    <Card
                      title={member.role}
                      key={member.id}
                      extra={[
                        <Popconfirm
                          title="Are you sure you want to remove this member from event?"
                          key={member.id}
                          onConfirm={() => removeStaff(member)}
                        >
                          <Button style={GrayButton}>
                            <Typography
                              textTransform={"uppercase"}
                              style={GrayButtonText}
                            >
                              x
                            </Typography>
                          </Button>
                        </Popconfirm>,
                      ]}
                      style={{ ...CardStyle, alignSelf: "flex-start" }}
                    >
                      <Grid container>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                          {member.name}
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                          {member.email}
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
              </Space>
            </Grid>
          </Grid>
        </Grid>
      </Modal>
    );
  }
};

export default EditingStaff;

EditingStaff.propTypes = {
  editingStaff: PropTypes.bool.isRequired,
  setEditingStaff: PropTypes.func,
};
