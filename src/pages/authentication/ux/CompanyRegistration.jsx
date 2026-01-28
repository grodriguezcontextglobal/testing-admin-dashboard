import { Icon } from "@iconify/react/dist/iconify.js";
import { FormLabel, Grid, Typography } from "@mui/material";
import { AutoComplete, Avatar, Space, Tooltip } from "antd";
import { Link } from "react-router-dom";
import FooterComponent from "../../../components/general/FooterComponent";
import { CompanyIcon } from "../../../components/icons/CompanyIcon";
import InfrmationCard from "../components/InfrmationCard";
import Input from "../../../components/UX/inputs/Input";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import Chip from "../../../components/UX/Chip/Chip";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";

const CompanyRegistration = ({
  isSmallDevice,
  isMediumDevice,
  handleSubmit,
  onSubmitRegister,
  adjustingFormWidth,
  user,
  companyValue,
  setCompanyValue,
  websiteUrl,
  setWebsiteUrl,
  industry,
  setIndustry,
  loadingStatus,
  locationList,
  newlocation,
  setNewlocation,
  handleAddLocation,
  handleDeleteLocation,
  matchCompany,
  retrieveIndustryOptions,
  register,
  Subtitle,
  dispatch,
  onLogout,
}) => {
  return (
    <Grid
      style={{
        backgroundColor: "var(--basewhite)",
        height: "100dvh",
        margin: 0,
        width: "100vw",
      }}
      container
    >
      <Grid item xs={12} sm={12} md={6} lg={6}>
        <Grid
          container
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"space-around"}
          alignItems={"center"}
          overflow={"auto"}
          paddingBottom={0}
          style={{
            overflow: "auto",
          }}
        >
          <Grid
            marginX={0}
            className="register-container"
            style={{
              padding: `${isSmallDevice ? "1rem" : "0 2rem"}`,
              margin: "4dvh auto 0",
            }}
            container
          >
            <form
              className="register-form-container"
              onSubmit={handleSubmit(onSubmitRegister)}
              style={{
                width: adjustingFormWidth("90vw", "90vw", "45vw", "90vw"),
              }}
            >
              <Typography
                style={{
                  color: "var(--gray900, #101828)",
                  fontSize: "30px",
                  fontFamily: "Inter",
                  fontWeight: "600",
                  lineHeight: "38px",
                  marginBottom: "1rem",
                }}
              >
                Register your company
              </Typography>
              <Typography
                style={{
                  color: "var(--gray-500, #667085)",
                  fontSize: "16px",
                  fontFamily: "Inter",
                  lineHeight: "24px",
                }}
              >
                To set up a new company please complete the steps below.
              </Typography>
              <Grid margin={"2rem auto"} item xs={12} sm={12} md={12} lg={12}>
                <InfrmationCard props={user} />
              </Grid>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                item
                xs={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem" }}>
                  Company name <span style={{ fontWeight: 800 }}>*</span>
                </FormLabel>
                <Grid
                  item
                  xs={12}
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                >
                  <Input
                    required
                    type="text"
                    value={companyValue}
                    onChange={(e) => setCompanyValue(e.target.value)}
                    placeholder="Enter your company name"
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem" }}>
                  Main phone number <span style={{ fontWeight: 800 }}>*</span>
                  <Input
                    required
                    disabled={loadingStatus || matchCompany()}
                    {...register("main_phone", { required: true })}
                    placeholder="+1 (123) 456-7890"
                    type="text"
                    fullWidth
                  />
                </FormLabel>
              </Grid>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem" }}>
                  Alternative phone number{" "}
                  <span style={{ fontWeight: 800 }}></span>
                </FormLabel>
                <Input
                  disabled={loadingStatus || matchCompany()}
                  {...register("alternative_phone", { required: false })}
                  placeholder=""
                  type="text"
                  fullWidth
                />
              </Grid>
              <Grid marginX={0} textAlign={"left"} item xs={12}>
                <FormLabel style={{ marginBottom: "0.5rem" }}>
                  Website <span style={{ fontWeight: 800 }}>*</span>
                </FormLabel>
                <Input
                  required
                  disabled={loadingStatus || matchCompany()}
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder=""
                  type="text"
                  fullWidth
                />
              </Grid>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                display={"flex"}
                flexDirection={"column"}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                  Country <span style={{ fontWeight: 800 }}>*</span>
                  <Input
                    required
                    disabled={loadingStatus || matchCompany()}
                    {...register("country", { required: true })}
                    placeholder="Country name"
                    type="text"
                    fullWidth
                  />
                </FormLabel>
              </Grid>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                display={"flex"}
                flexDirection={"column"}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                  Address for company headquarters{" "}
                  <span style={{ fontWeight: 800 }}>*</span>
                  <Input
                    required
                    disabled={loadingStatus || matchCompany()}
                    {...register("street", { required: true })}
                    style={{ margin: "0 0 20px" }}
                    placeholder="Address line 1"
                    type="text"
                    fullWidth
                  />
                  <Input
                    disabled={loadingStatus || matchCompany()}
                    {...register("street2")}
                    placeholder="Address line 2"
                    type="text"
                    fullWidth
                  />
                </FormLabel>
              </Grid>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                gap={1}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                  City <span style={{ fontWeight: 800 }}>*</span>
                  <Input
                    required
                    disabled={loadingStatus || matchCompany()}
                    {...register("city", { required: true })}
                    placeholder="City name"
                    type="text"
                    fullWidth
                  />
                </FormLabel>
              </Grid>

              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                gap={1}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                {" "}
                <FormLabel style={{ marginBottom: "0.5rem", width: "50%" }}>
                  State <span style={{ fontWeight: 800 }}>*</span>
                  <Input
                    required
                    disabled={loadingStatus || matchCompany()}
                    {...register("state", { required: true })}
                    placeholder=""
                    type="text"
                    fullWidth
                  />
                </FormLabel>
                <FormLabel style={{ marginBottom: "0.5rem", width: "50%" }}>
                  Zip code <span style={{ fontWeight: 800 }}>*</span>
                  <Input
                    required
                    disabled={loadingStatus || matchCompany()}
                    {...register("postal_code", { required: true })}
                    placeholder=""
                    type="text"
                    fullWidth
                  />
                </FormLabel>
              </Grid>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                gap={1}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <FormLabel
                  style={{
                    marginBottom: "0.5rem",
                    borderRadius: "8px",
                    width: "100%",
                  }}
                >
                  Industry <span style={{ fontWeight: 800 }}>*</span>
                  <AutoComplete
                    className="custom-autocomplete" // Add a custom className here
                    disabled={loadingStatus || matchCompany()}
                    variant="outlined"
                    style={{
                      ...AntSelectorStyle,
                      border: "solid 0.3 var(--gray600)",
                      fontFamily: "Inter",
                      fontSize: "14px",
                      width: "100%",
                    }}
                    value={industry}
                    onChange={(value) => setIndustry(value)}
                    options={retrieveIndustryOptions().map((item) => {
                      return { value: item };
                    })}
                    placeholder="Type your industry area"
                    filterOption={(inputValue, option) =>
                      option.value
                        .toUpperCase()
                        .indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </FormLabel>
              </Grid>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                item
                xs={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem" }}>
                  Your company locations{" "}
                  <span style={{ fontWeight: 800 }}>*</span>
                </FormLabel>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Tooltip
                    style={{ width: "95%" }}
                    title="Please click the 'Add' button to include your location. Otherwise, it will not be added."
                  >
                    <Input
                      name="newLocation"
                      value={newlocation}
                      onChange={(e) => setNewlocation(e.target.value)}
                      fullWidth
                    />
                  </Tooltip>
                  <BlueButtonComponent
                    buttonType="button"
                    func={() => handleAddLocation()}
                    disabled={matchCompany()}
                    title="Add"
                    styles={{
                      background: `${
                        matchCompany()
                          ? "var(--disabled-blue-button)"
                          : "var(--blue-dark-600)"
                      }`,
                    }}
                  />
                </div>
              </Grid>
              <Grid
                marginY={"20px"}
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                item
                xs
              >
                <Space size={[8, 16]} wrap>
                  {locationList.map((location) => {
                    return (
                      <Chip
                        key={location}
                        label={`${location}`}
                        onDelete={() => handleDeleteLocation(location)}
                      />
                    );
                  })}
                </Space>
              </Grid>
              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                display={"flex"}
                flexDirection={"column"}
                justifyContent={"space-between"}
                alignItems={"center"}
                gap={1}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                  Upload your company logo
                </FormLabel>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  gap={1}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <Grid
                    display={"flex"}
                    justifyContent={"flex-start"}
                    alignSelf={"stretch"}
                    marginY={0}
                    gap={2}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                  >
                    <Grid
                      display={"flex"}
                      justifyContent={"flex-start"}
                      alignSelf={"stretch"}
                      marginY={0}
                      gap={2}
                      item
                      xs={4}
                      sm={4}
                      md={4}
                    >
                      <Avatar
                        size={{
                          xs: 24,
                          sm: 32,
                          md: 40,
                          lg: 64,
                          xl: 80,
                          xxl: 100,
                        }}
                        src={
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CompanyIcon />
                          </div>
                        }
                        style={{
                          background: "var(--Gray-100, #F2F4F7)",
                        }}
                      />
                    </Grid>
                    <Grid
                      display={"flex"}
                      flexDirection={"column"}
                      justifyContent={"center"}
                      alignItems={"center"}
                      marginBottom={2}
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        border: "1px solid var(--gray-200, #EAECF0)",
                        background: "var(--base-white, #FFF)",
                      }}
                      item
                      xs={12}
                    >
                      <Grid
                        display={"flex"}
                        justifyContent={"center"}
                        alignItems={"center"}
                        marginTop={2}
                        item
                        xs={12}
                        style={{
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <Avatar
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            border: "6px solid var(--gray-50, #F9FAFB)",
                            background: "6px solid var(--gray-50, #F9FAFB)",
                            borderRadius: "28px",
                          }}
                        >
                          {" "}
                          <Icon
                            icon="tabler:cloud-upload"
                            color="#475467"
                            width={20}
                            height={20}
                          />
                        </Avatar>
                      </Grid>
                      <Grid
                        display={"flex"}
                        justifyContent={"center"}
                        alignItems={"center"}
                        item
                        xs={12}
                        sm={10}
                      >
                        <Input
                          {...register("photo")}
                          id="file-upload"
                          type="file"
                          className="photo_input"
                          inputProps={{
                            accept: ".jpeg, .png, .jpg",
                          }}
                          style={{
                            outline: "none",
                            border: "transparent",
                          }}
                        />
                      </Grid>
                      <Grid
                        display={"flex"}
                        justifyContent={"center"}
                        alignItems={"center"}
                        marginBottom={2}
                        item
                        xs={12}
                      >
                        <p style={{ ...Subtitle, fontWeight: 400 }}>
                          SVG, PNG, JPG or GIF (max. 1MB)
                        </p>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Grid
                marginY={"20px"}
                marginX={0}
                textAlign={"left"}
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                item
                xs={12}
              >
                <BlueButtonComponent
                  loadingState={loadingStatus}
                  disabled={loadingStatus || matchCompany()}
                  buttonType="submit"
                  title={!loadingStatus ? "Register" : "Loading"}
                  styles={{
                    width: "100%",
                    background: `${
                      matchCompany()
                        ? "var(--disabled-blue-button)"
                        : "var(--blue-dark-600)"
                    }`,
                  }}
                />
              </Grid>
              <Grid
                item
                xs={12}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <p
                  style={{
                    color: "var(--gray-600, #475467)",
                    fontSize: "14px",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                  }}
                >
                  Do you have an account already?{" "}
                  <Link to="/login">
                    <button
                      onClick={() => dispatch(onLogout())}
                      style={{
                        backgroundColor: "transparent",
                        outline: "none",
                        padding: 0,
                        color: "#004EEB",
                        fontSize: "14px",
                        fontFamily: "Inter",
                        fontWeight: "600",
                        lineHeight: "20px",
                        cursor: "pointer",
                      }}
                    >
                      Sign in
                    </button>
                  </Link>
                </p>
              </Grid>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  width: "100%",
                  margin: "0 0 0px -20px",
                }}
              >
                <FooterComponent />
              </div>
            </form>
          </Grid>
        </Grid>
      </Grid>
      <Grid
        display={(isSmallDevice || isMediumDevice) && "none"}
        id="section-img-login-component"
        item
        xs={6}
        sm={6}
      ></Grid>
    </Grid>
  );
};

export default CompanyRegistration;
