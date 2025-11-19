import {
  Chip,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Avatar, Button, Divider, Space } from "antd";
import ImageUploaderUX from "../../../../components/utils/UX/ImageUploaderUX";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import Header from "../../components/Header";

const BodyRendering = ({
  checkIfOriginalDataHasChange,
  handleSubmit,
  handleUpdatePersonalInfo,
  listOfEvents,
  loading,
  register,
  setImageUploadedValue,
  user,
  removeUploadedProfileImage,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <form
      onSubmit={handleSubmit(handleUpdatePersonalInfo)}
      style={{
        width: "100%",
        padding: isMobile ? "16px" : "24px 0",
      }}
    >
      <Grid container>
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Header
              title={"Personal Info"}
              description={"Update your photo and personal details."}
            />
            <BlueButtonComponent
              buttonType="submit"
              loadingState={loading}
              title={"Save and log out"}
              style={{
                width: "fit-content",
              }}
            />
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Form Fields Container */}
        <Grid container item xs={12} spacing={2}>
          {/* Name Section */}
          <Grid item xs={12} sm={4} md={4}>
            <InputLabel>
              <Typography style={{ ...Subtitle, fontWeight: 500 }}>
                Name
              </Typography>
            </InputLabel>
          </Grid>
          <Grid item xs={12} sm={8} md={8} container spacing={2}>
            <Grid item xs={12} sm={6}>
              {checkIfOriginalDataHasChange("name")}
              <OutlinedInput
                style={{ ...OutlinedInputStyle }}
                {...register("name", { required: true })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {checkIfOriginalDataHasChange("lastName")}
              <OutlinedInput
                style={{ ...OutlinedInputStyle }}
                {...register("lastName", { required: true })}
                fullWidth
              />
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Phone Section */}
          <Grid item xs={12} sm={4} md={4}>
            <InputLabel>
              <Typography style={{ ...Subtitle, fontWeight: 500 }}>
                Phone number
              </Typography>
            </InputLabel>
          </Grid>
          <Grid item xs={12} sm={8} md={8}>
            {checkIfOriginalDataHasChange("phone")}
            <OutlinedInput
              style={{ ...OutlinedInputStyle }}
              {...register("phone", { required: true })}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Email Section */}
          <Grid item xs={12} sm={4} md={4}>
            <InputLabel>
              <Typography style={{ ...Subtitle, fontWeight: 500 }}>
                Email address
              </Typography>
            </InputLabel>
          </Grid>
          <Grid item xs={12} sm={8} md={8}>
            {checkIfOriginalDataHasChange("email")}
            <OutlinedInput
              style={{ ...OutlinedInputStyle }}
              {...register("email", { required: true })}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Photo Section */}
          <Grid item xs={12} sm={4} md={4}>
            <InputLabel>
              <Typography style={{ ...Subtitle, fontWeight: 500 }}>
                Your photo
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            item
            xs={12}
            sm={8}
            md={8}
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "center", sm: "flex-start" },
              gap: 2,
            }}
          >
            <Grid item xs={12} sm={12} md={5} lg={5}>
              <>
                {user?.data?.imageProfile ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                      width: "100%",
                      aspectRatio: "1/1",
                    }}
                  >
                    <Avatar
                      size={"large"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        borderRadius: "50%",
                      }}
                      src={
                        <img
                          src={user?.data?.imageProfile}
                          alt="profile"
                          width={"100%"}
                          style={{ aspectRatio: "1/1" }}
                        />
                      }
                    />
                    <Button
                      style={GrayButton}
                      onClick={removeUploadedProfileImage}
                    >
                      <p style={GrayButtonText}>Remove</p>
                    </Button>
                  </div>
                ) : (
                  <Avatar
                    size={"large"}
                    style={{
                      width: "100%",
                      height: "100%",
                      aspectRatio: "1/1",
                      objectFit: "cover",
                      objectPosition: "center",
                      borderRadius: "50%",
                    }}
                  >
                    {user?.name[0]}
                    {user?.lastName[0]}
                  </Avatar>
                )}
              </>
            </Grid>
            <Grid item xs={12} sm={12} md={7} lg={7}>
              <ImageUploaderUX setImageUploadedValue={setImageUploadedValue} />
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Role Section */}
          <Grid item xs={12} sm={4} md={4}>
            <InputLabel>
              <Typography style={{ ...Subtitle, fontWeight: 500 }}>
                Role
              </Typography>
            </InputLabel>
          </Grid>
          <Grid item xs={12} sm={8} md={8}>
            {checkIfOriginalDataHasChange("role")}
            <OutlinedInput
              readOnly
              style={{ ...OutlinedInputStyle }}
              {...register("role")}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Events Section */}
          <Grid item xs={12}>
            <details
              style={{
                width: "100%",
              }}
            >
              <summary
                style={{
                  marginBottom: isMobile ? "16px" : "24px",
                  cursor: "pointer",
                }}
              >
                <Typography style={{ ...Subtitle, fontWeight: 500 }}>
                  Events
                </Typography>
              </summary>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Space
                    size={[8, 16]}
                    wrap
                    style={{
                      justifyContent: isMobile ? "center" : "flex-start",
                    }}
                  >
                    {listOfEvents().map((event) => (
                      <Chip
                        key={event?.eventInfoDetail?.eventName}
                        label={event?.eventInfoDetail?.eventName}
                        variant="outlined"
                        style={{
                          ...OutlinedInputStyle,
                          margin: isMobile ? "4px" : "8px",
                        }}
                      />
                    ))}
                  </Space>
                </Grid>
              </Grid>
            </details>
          </Grid>
        </Grid>

        {/* Bottom Save Button */}
        <Grid
          item
          xs={12}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 2,
          }}
        >
          <BlueButtonComponent
            buttonType="submit"
            loadingState={loading}
            title={"Save and log out"}
            style={{
              width: "fit-content",
            }}
          />
        </Grid>
      </Grid>
    </form>
  );
};

export default BodyRendering;
