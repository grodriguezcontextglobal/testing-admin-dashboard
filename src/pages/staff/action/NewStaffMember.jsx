/* eslint-disable react/prop-types */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Button,
  Select,
  MenuItem,
  Typography,
  Grid,
  OutlinedInput,
  InputLabel,
} from "@mui/material";
import { Modal, message } from "antd";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import _ from 'lodash'
import { devitrakApi, devitrakApiAdmin } from "../../../api/devitrakApi";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
  password: yup
    .string()
    .min(6)
    .max(20)
    .required("Password is required"),
  password2: yup.string().oneOf([yup.ref("password"), null]),
  role: yup.string().required("Role is required"),
  question: yup.string().required("One question must be selected"),
  answer: yup.string().required("Answer is required"),
});

const roles = ["Administrator", "Approver", "Editor"];
export const NewStaffMember = ({ modalState, setModalState }) => {
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const [assignToEvent, setAssignToEvent] = useState({})
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const queryClient = useQueryClient()
  function closeModal() {
    setModalState(false);
  }

  const allStaffSavedQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
  });

  const [messageApi, contextHolder] = message.useMessage();
  const warning = (type, content) => {
    messageApi.open({
      type: type,
      content: content,
      onClose: () => setValue("email", ""),
    });
  };

  const renderListOfEvents = () => {
    const events = new Set()
    if (eventsPerAdmin.active) {
      for (let data of eventsPerAdmin.active) {
        events.add(data)
      }
    }
    return Array.from(events)
  }

  const handleChange = (event) => {
    const selection = {}
    for (let data of renderListOfEvents()) {
      if (!selection[data.eventInfoDetail.eventName]) {
        selection[data.eventInfoDetail.eventName] = data
      }
    }
    if (selection[event.target.value]) return setAssignToEvent({ ...selection[event.target.value] });

  };
  if (allStaffSavedQuery.data) {
    const groupStaffByEmail = _.groupBy(
      allStaffSavedQuery.data.data.adminUsers,
      "email"
    );
    const onSubmitRegister = async (data) => {
      const resp = await devitrakApiAdmin.post("/new_admin_user", {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        question: "company name",
        answer: user.company,
        role: data.role,
        company: user.company,
      });
      if (resp) {
        const respUpdateStaffInEvent = await devitrakApi.patch(`/event/edit-event/${assignToEvent.id}`, {
          staff: {
            adminUser: [...assignToEvent.staff.adminUser],
            headsetAttendees: [...assignToEvent.staff.headsetAttendees, data.email]
          }
        })
        if (respUpdateStaffInEvent.data.ok) {
          warning('success', `${data.name} ${data.lastName} was created and added to event successfully!`)
          queryClient.invalidateQueries(['staff', 'listOfAdminUsers', 'events'])
          closeModal();
        }

      }
    };
    const renderTitle = () => {
      return (
        <Typography
          textTransform={"none"}
          lineHeight={"38px"}
          color={"var(--gray-900, #101828)"}
          textAlign={"center"}
          fontWeight={600}
          fontFamily={"Inter"}
          fontSize={"30px"}
        >
          New staff
        </Typography>
      );
    };
    return (
      <>
        {contextHolder}
        <Modal
          title={renderTitle()}
          centered
          open={modalState}
          onOk={() => closeModal()}
          onCancel={() => closeModal()}
          footer={[]}
          width={1000}
          maskClosable={false}
        >
          <form onSubmit={handleSubmit(onSubmitRegister)}>
            <Grid
              marginY={"20px"}
              marginX={0}
              textAlign={"center"}
              item
              xs={12}
            >
              <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>Name</InputLabel>
              <OutlinedInput
                type="text"
                {...register("name", { required: true })}
                aria-invalid={errors.name ? true : false}
                style={OutlinedInputStyle}
                placeholder="Enter your name"
                fullWidth
              />
              {errors?.name?.message}
            </Grid>
            <Grid
              marginY={"20px"}
              marginX={0}
              textAlign={"center"}
              item
              xs={12}
            >
              <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
                Last name
              </InputLabel>
              <OutlinedInput
                type="text"
                {...register("lastName", { required: true })}
                aria-invalid={errors.lastName ? true : false}
                style={OutlinedInputStyle}
                placeholder="Enter your last name"
                fullWidth
              />
              {errors?.lastName?.message}
            </Grid>
            <Grid
              marginY={"20px"}
              marginX={0}
              textAlign={"center"}
              item
              xs={12}
            >
              <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>Email</InputLabel>
              <OutlinedInput
                {...register("email", { required: true, minLength: 6 })}
                style={OutlinedInputStyle}
                placeholder="Enter your email"
                type="text"
                fullWidth
              />
              {errors?.email?.message}
              {groupStaffByEmail[watch("email")] && warning('warning', `${`${watch("email")} already exists!`}`)}
            </Grid>
            {!groupStaffByEmail[watch("email")] && (
              <>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"center"}
                  item
                  xs={12}
                >
                  <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
                    Password
                  </InputLabel>
                  <OutlinedInput
                    {...register("password", {
                      required: true,
                      minLength: 6,
                    })}
                    style={OutlinedInputStyle}
                    placeholder="Type password"
                    type="password"
                    fullWidth
                  />
                  {errors?.password?.message}
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"center"}
                  item
                  xs={12}
                >
                  <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
                    Repeat password
                  </InputLabel>
                  <OutlinedInput
                    {...register("password2")}
                    style={OutlinedInputStyle}
                    placeholder="Repeat password"
                    type="password"
                    fullWidth
                  />
                  {errors?.password2 && <p>Password must match</p>}
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"center"}
                  item
                  xs={12}
                >
                  <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
                    Role
                  </InputLabel>
                  <Grid
                    item
                    xs={12}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                  >
                    <Select
                      {...register("role")}
                      displayEmpty
                      fullWidth
                      style={AntSelectorStyle}
                    // placeholder="Select a role"
                    >
                      {roles.map((company) => {
                        return (
                          <MenuItem key={company} value={company}>
                            {company}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </Grid>
                  {errors?.role?.message}
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"center"}
                  item
                  xs={12}
                >
                  <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
                    Assigning new staff to an event
                  </InputLabel>
                  <Select
                    value={assignToEvent?.eventInfoDetail?.eventName}
                    onChange={handleChange}
                    style={AntSelectorStyle}
                    fullWidth>
                    {renderListOfEvents()?.map(option => {
                      return (
                        <MenuItem key={option.eventInfoDetail.eventName} value={option.eventInfoDetail.eventName}>
                          {option.eventInfoDetail.eventName}
                        </MenuItem>
                      )
                    })}
                  </Select>
                  {errors?.answer?.message}
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"center"}
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  gap={1}
                  item
                  xs={12} sm={12} md={12} lg={12}
                >
                  <Button
                    onClick={closeModal}
                    style={{ ...GrayButton, width: "100%" }}
                  >
                    <Typography
                      textTransform={"none"}
                      style={GrayButtonText}
                    >
                      Cancel
                    </Typography>
                  </Button>
                  <Button
                    style={{ ...BlueButton, width: "100%" }}
                    type="submit"
                  >
                    <Typography
                      textTransform={"none"}
                      style={BlueButtonText}
                    >
                      Save
                    </Typography>
                  </Button>
                </Grid>
              </>
            )}
          </form>
          {/* </Grid> */}
        </Modal>
      </>
    );
  }
};
