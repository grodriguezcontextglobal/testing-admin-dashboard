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
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";

const FormFields = ({
  handleSubmit,
  handleEventInfo,
  register,
  adminStaff,
  headsetAttendeesStaff,
  checkAdminSpots,
  checkAssistantsSpots,
  cardBackgroundStyles,
  tagStyles,
  subscription,
  staff,
  addNewMember,
  handleDeleteMember,
  handleHeadsetAttendeeDeleteMember,
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
      className="form"
    >
      <Grid
        display={"flex"}
        flexDirection={"column"}
        alignItems={"flex-start"}
        alignSelf={"stretch"}
        gap={"24px"}
        style={cardBackgroundStyles}
        item
        xs={12}
      >
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"flex-start"}
          alignSelf={"stretch"}
          gap={"24px"}
          item
          xs={12}
        >
          <Grid item xs={12}>
            <InputLabel>Role</InputLabel>
            <FormControl fullWidth>
              <Select
                className="custom-autocomplete"
                style={{ ...AntSelectorStyle, background: "#fff" }}
                {...register("role")}
              >
                <MenuItem defaultChecked defaultValue={"Select role"} disabled>
                  <Typography>Select role</Typography>
                </MenuItem>
                {checkAdminSpots() === subscription?.adminUser ? null : (
                  <MenuItem value={"Administrator"}>
                    <Typography>Administrator</Typography>
                  </MenuItem>
                )}
                <MenuItem value={"HeadsetAttendees"}>
                  <Typography>Assistant</Typography>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"flex-start"}
          alignSelf={"stretch"}
          gap={"24px"}
          item
          xs={12}
        >
          <Grid item xs={6}>
            <InputLabel fullWidth>First Name</InputLabel>
            <OutlinedInput
              {...register("firstName")}
              style={OutlinedInputStyle}
              placeholder="First name"
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <InputLabel fullWidth>Last Name</InputLabel>
            <OutlinedInput
              {...register("lastName")}
              style={OutlinedInputStyle}
              placeholder="Last name"
              fullWidth
            />
          </Grid>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"flex-start"}
          alignSelf={"stretch"}
          gap={"24px"}
          item
          xs={12}
        >
          <Grid item xs={12}>
            <InputLabel fullWidth>Email</InputLabel>
            <OutlinedInput
              {...register("email")}
              style={OutlinedInputStyle}
              type="email"
              placeholder="Email"
              fullWidth
            />
          </Grid>
        </Grid>
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
      <div style={{ display: "flex",flexDirection: "column", gap: "1rem", margin: "1rem 0" }}>
        <LightBlueButtonComponent
          title={"Save and add more staff"}
          buttonType="button"
          func={(e) => addNewMember(e)}
          styles={{ width: "100%" }}
          icon={<RectangleBluePlusIcon />}
        />
        <BlueButtonComponent
          title={
            staff?.adminUser.length > 0
              ? "Save changes to continue"
              : "Save and continue"
          }
          buttonType="submit"
          styles={{ width: "100%" }}
          icon={<WhiteCirclePlusIcon />}
        />
      </div>
    </form>
  );
};

export default FormFields;
