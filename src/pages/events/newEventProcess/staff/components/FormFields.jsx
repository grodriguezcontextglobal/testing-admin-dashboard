import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { Card, Space } from "antd";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import { EmailIcon } from "../../../../../components/icons/EmailIcon";
import { ProfileIcon } from "../../../../../components/icons/ProfileIcon";
import { RectangleBluePlusIcon } from "../../../../../components/icons/RectangleBluePlusIcon";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { dicStaff } from "./dictionary";

const FormFields = ({
  // staff,
  // subscription,
  addNewMember,
  adminStaff,
  cardBackgroundStyles,
  checkAdminSpots,
  checkAssistantsSpots,
  companyEmployees,
  continueButton,
  currentRole, // NEW: receive current role
  handleDeleteMember,
  handleEventInfo,
  handleHeadsetAttendeeDeleteMember,
  handleSubmit,
  headsetAttendeesStaff,
  isAddingNewMember,
  isEmployeeAlreadyAssigned,
  // navigate,
  onSelectEmployee,
  register,
  selectedEmployee,
  tagStyles,
}) => {
  return (
    <form
      style={{
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "center",
        textAlign: "left",
      }}
      onSubmit={handleSubmit(handleEventInfo)}
    >
      <Grid /* card wrapper */ container rowSpacing={2}>
        <Grid /* row */ item xs={12} sm={12} md={12} lg={12}>
          {/* Employee selector using _id and schema's 'user' field */}
          <Grid item xs={12}>
            <InputLabel>Employee</InputLabel>
            <FormControl fullWidth>
              <Select
                className="custom-autocomplete"
                style={{ ...AntSelectorStyle, background: "#fff" }}
                value={
                  selectedEmployee?._id ?? (isAddingNewMember ? "__new__" : "")
                }
                onChange={(e) => onSelectEmployee(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <Typography>Select company employee</Typography>
                </MenuItem>
                {companyEmployees?.map((emp) => {
                  const isAssigned = isEmployeeAlreadyAssigned(emp);
                  return (
                    <MenuItem
                      key={emp?._id}
                      value={emp?._id}
                      disabled={isAssigned}
                      style={{
                        opacity: isAssigned ? 0.5 : 1,
                        backgroundColor: isAssigned ? "#f5f5f5" : "transparent",
                      }}
                    >
                      <Typography
                        style={{ color: isAssigned ? "#999" : "inherit" }}
                      >
                        {emp?.firstName} {emp?.lastName} - {emp?.user}
                        {isAssigned && " (Already assigned)"}
                      </Typography>
                    </MenuItem>
                  );
                })}
                <MenuItem value={"__new__"}>
                  <Typography>Add new staff (not in company)</Typography>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Role selection remains manual */}
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <InputLabel>Role *</InputLabel>
          <FormControl fullWidth>
            <Select
              className="custom-autocomplete"
              style={{ ...AntSelectorStyle, background: "#fff" }}
              {...register("role")}
              value={currentRole ?? ""} // NEW: controlled value from form
              displayEmpty // NEW: show placeholder when empty
              renderValue={
                (selected) =>
                  selected && selected.length > 0
                    ? dicStaff[selected]
                    : "Select role" // NEW: UX placeholder
              }
            >
              <MenuItem value="" disabled>
                <Typography>Select role</Typography>
              </MenuItem>
              {/* {checkAdminSpots() === subscription?.adminUser ? null : ( */}
                <MenuItem value={"Administrator"}>
                  <Typography>Administrator</Typography>
                </MenuItem>
              {/* )} */}
              <MenuItem value={"headsetAttendees"}>
                <Typography>Assistant</Typography>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid rowSpacing={2} item xs={12} sm={12} md={12} lg={12}>
          {/* Name fields auto-filled and disabled unless adding new */}
          <Grid
            /* name row item xs={12} sm={12} md={12} lg={12}*/ container
            spacing={2}
          >
            <Grid item xs={12} sm={12} md={6} lg={6}>
              <InputLabel fullWidth>First Name *</InputLabel>
              <OutlinedInput
                {...register("firstName")}
                style={OutlinedInputStyle}
                placeholder="First name"
                fullWidth
                disabled={!!selectedEmployee && !isAddingNewMember}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={6}>
              <InputLabel fullWidth>Last Name *</InputLabel>
              <OutlinedInput
                {...register("lastName")}
                style={OutlinedInputStyle}
                placeholder="Last name"
                fullWidth
                disabled={!!selectedEmployee && !isAddingNewMember}
              />
            </Grid>
          </Grid>

          {/* Email field uses employee.user and is disabled unless adding new */}
        </Grid>
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <InputLabel fullWidth>Email *</InputLabel>
          <OutlinedInput
            {...register("email")}
            style={OutlinedInputStyle}
            type="email"
            placeholder="Email"
            fullWidth
            disabled={!!selectedEmployee && !isAddingNewMember}
          />
        </Grid>
        <Grid display={"flex"} justifyContent={"flex-end"} item xs={12} sm={12} md={12} lg={12}>
          <LightBlueButtonComponent
            title={"Save and add more staff"}
            buttonType="button"
            func={(e) => addNewMember(e)}
            styles={{ width: "50%", margin: "0.5rem 0" }}
            icon={<RectangleBluePlusIcon />}
          />
        </Grid>
      </Grid>

      <div
        style={{
          margin: "1rem auto 0.3rem",
          color: "transparent",
          backgroundColor: "transparent",
        }}
      ></div>
      <Grid
        display={"flex"}
        flexDirection={"column"}
        alignItems={"flex-start"}
        alignSelf={"stretch"}
        gap={"24px"}
        style={{
          ...cardBackgroundStyles,
          width: "100%",
        }}
        item
        xs={12}
      >
        <InputLabel
          fullWidth
          style={{
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          Admin staff &nbsp;
          <Typography>Admin spots {checkAdminSpots()}</Typography>
        </InputLabel>
        <Space size={[8, 16]} wrap>
          {adminStaff?.map((member, index) => {
            return (
              <Card key={member.email}>
                <label>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <ProfileIcon /> {member.firstName} {member.lastName}
                    </div>{" "}
                    <button
                      type="button"
                      style={tagStyles}
                      onClick={() => handleDeleteMember(index)}
                    >
                      X
                    </button>
                  </div>
                  <EmailIcon /> {member.email}
                </label>
              </Card>
            );
          })}
        </Space>
      </Grid>
      <div
        style={{
          margin: "0.3rem auto",
          color: "transparent",
          backgroundColor: "transparent",
        }}
      ></div>
      <Grid
        display={"flex"}
        flexDirection={"column"}
        alignItems={"flex-start"}
        alignSelf={"stretch"}
        gap={"24px"}
        style={{
          ...cardBackgroundStyles,
          width: "100%",
        }}
        item
        xs={12}
      >
        <InputLabel
          fullWidth
          style={{
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          Assistant staff&nbsp;
          <Typography>Assistant spots {checkAssistantsSpots()}</Typography>
        </InputLabel>
        <Space size={[8, 16]} wrap>
          {headsetAttendeesStaff?.map((member, index) => {
            return (
              <Card style={{ padding: "4px 2px" }} key={member.email}>
                <label>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <ProfileIcon /> {member.firstName} {member.lastName}
                    </div>{" "}
                    <button
                      type="button"
                      style={tagStyles}
                      onClick={() => handleHeadsetAttendeeDeleteMember(index)}
                    >
                      x
                    </button>
                  </div>
                  <EmailIcon /> {member.email}
                </label>
              </Card>
            );
          })}
        </Space>
      </Grid>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
          margin: "1rem 0",
        }}
      >
        {/* <BlueButtonComponent
          title={
            staff?.adminUser.length > 0
              ? "Save changes to continue"
              : "Save and continue"
          }
          buttonType="submit"
          styles={{ width: "50%" }}
          icon={<WhiteCirclePlusIcon />}
        /> */}
        <BlueButtonComponent
          title="Continue"
          buttonType="button"
          styles={{ width: "100%" }}
          func={continueButton}
        />
      </div>
    </form>
  );
};

export default FormFields;
