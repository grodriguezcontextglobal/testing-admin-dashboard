import { Grid, InputLabel, OutlinedInput, TextField, Typography } from "@mui/material";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { Avatar, Button, Divider, Space } from "antd";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { Icon } from "@iconify/react/dist/iconify.js";
import { CompanyIcon } from "../../../../components/icons/CompanyIcon";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import Header from "../../components/Header";

const BodyForm = ({
    handleUpdatePersonalInfo,
    handleSubmit,
    isMobile,
    loading,
    features,
    user,
    checkIfOriginalDataHasChange,
    removingCompanyLogo,
    register,
    CardSearchStaffFound,
}) => {
  return (
    <form
      onSubmit={handleSubmit(handleUpdatePersonalInfo)}
      style={{
        width: "100%",
        padding: isMobile ? "16px" : 0,
        margin: 0,
      }}
    >
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"flex-start"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Grid item xs={12} sm={12} md={6} lg={6}>
          <Header
            title={"Company info"}
            description={"Update your company info."}
          />
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
        >
          <Button
            htmlType="submit"
            loading={loading}
            style={{ ...BlueButton, width: "fit-content" }}
          >
            <Typography textTransform={"none"} style={BlueButtonText}>
              Save and log out
            </Typography>
          </Button>
        </Grid>
      </Grid>
      <Divider />
      <Grid
        style={{
          padding: "5px",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
        container
      >
        {features.map((item) => {
          if (!item.object) {
            return (
              <>
                <Grid
                  key={item.title}
                  display={"flex"}
                  flexDirection={"column"}
                  alignSelf={"stretch"}
                  marginY={0}
                  item
                  xs={12}
                  sm={12}
                  md={4}
                  lg={4}
                >
                  <InputLabel style={{ width: "100%" }}>
                    <Typography
                      textTransform={"none"}
                      style={{ ...Subtitle, fontWeight: 500 }}
                    >
                      {item.title}
                    </Typography>
                  </InputLabel>
                </Grid>
                <Grid
                  key={item.name}
                  display={"flex"}
                  justifyContent={"flex-start"}
                  alignItems={"center"}
                  marginY={0}
                  gap={2}
                  item
                  xs={12}
                  sm={12}
                  md={8}
                  lg={8}
                >
                  {checkIfOriginalDataHasChange(item.name)}
                  <OutlinedInput
                    style={{ ...OutlinedInputStyle }}
                    fullWidth
                    {...register(`${item.name}`)}
                  />
                </Grid>
                <Divider />
              </>
            );
          } else if (item.object) {
            return (
              <>
                <Grid
                  display={"flex"}
                  flexDirection={"column"}
                  alignSelf={"stretch"}
                  marginY={0}
                  item
                  xs={4}
                  sm={4}
                  md={4}
                >
                  <InputLabel style={{ width: "100%" }}>
                    <Typography
                      textTransform={"none"}
                      style={{ ...Subtitle, fontWeight: 500 }}
                    >
                      {item.title}
                    </Typography>
                  </InputLabel>
                </Grid>
                <Grid
                  display={"flex"}
                  flexDirection={"column"}
                  justifyContent={"flex-start"}
                  alignItems={"center"}
                  marginY={0}
                  gap={2}
                  item
                  xs={6}
                  sm={6}
                  md={6}
                >
                  <div style={{ width: "100%", display: "flex", gap: "10px" }}>
                    {" "}
                    {checkIfOriginalDataHasChange(item.children[0].name)}
                    <OutlinedInput
                      style={{ ...OutlinedInputStyle, width: "70%" }}
                      fullWidth
                      {...register(`${item.children[0].name}`)}
                    />
                    {checkIfOriginalDataHasChange(item.children[1].name)}
                    <OutlinedInput
                      style={{ ...OutlinedInputStyle, width: "30%" }}
                      fullWidth
                      {...register(`${item.children[1].name}`)}
                    />
                  </div>
                  <div style={{ width: "100%", display: "flex", gap: "10px" }}>
                    {" "}
                    {checkIfOriginalDataHasChange(item.children[2].name)}
                    <OutlinedInput
                      style={{ ...OutlinedInputStyle }}
                      fullWidth
                      {...register(`${item.children[2].name}`)} // value={item.children[0].value}
                    />
                    {checkIfOriginalDataHasChange(item.children[3].name)}
                    <OutlinedInput
                      style={{ ...OutlinedInputStyle }}
                      fullWidth
                      {...register(`${item.children[3].name}`)} // value={item.children[0].value}
                    />
                  </div>
                </Grid>
                <Divider />
              </>
            );
          }
        })}
        <Grid
          display={"flex"}
          flexDirection={"column"}
          alignSelf={"stretch"}
          marginY={0}
          item
          xs={4}
          sm={4}
          md={4}
        >
          <InputLabel style={{ width: "100%" }}>
            <Typography style={{ ...Subtitle, fontWeight: 500 }}>
              Company logo
            </Typography>
          </InputLabel>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          marginY={0}
          gap={2}
          item
          xs={6}
          sm={6}
          md={6}
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
            {String(user.companyData.company_logo).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
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
                    <img
                      src={user?.companyData?.company_logo}
                      alt="company_logo"
                    />
                  }
                />
                <br />
                <button
                  type="button"
                  onClick={() => removingCompanyLogo()}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    margin: 0,
                    padding: 0,
                  }}
                >
                  <p
                    style={{
                      textDecoration: "underline",
                      color: "var(--danger-action)",
                    }}
                  >
                    remove
                  </p>
                </button>
              </div>
            ) : (
              <Avatar
                style={{
                  xs: 24,
                  sm: 32,
                  md: 40,
                  lg: 64,
                  xl: 80,
                  xxl: 100,
                  padding: "40px",
                }}
              >
                <CompanyIcon />{" "}
              </Avatar>
            )}
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
            >
              {checkIfOriginalDataHasChange("companyLogo")}
              <TextField
                {...register(`companyLogo`)}
                id="file-upload"
                type="file"
                className="photo_input"
                accept=".jpeg, .png, .jpg"
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
              <Typography style={{ ...Subtitle, fontWeight: 400 }}>
                SVG, PNG, JPG or GIF (max. 1MB)
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Divider />
        <details
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <summary>
            <p
              style={{
                ...Subtitle,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              Employees
            </p>
          </summary>
          <Divider />
          <Grid container>
            <Grid
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
              }}
            >
              <Space size={[8, 16]} wrap>
                {user.companyData.employees.map((employee) => {
                  return (
                    <CardSearchStaffFound
                      key={employee.user}
                      props={{
                        status: employee.status,
                        name: employee.firstName,
                        lastName: employee.lastName,
                        email: employee.user,
                        phoneNumber: "",
                      }}
                      fn={null}
                    />
                  );
                })}
              </Space>
            </Grid>
          </Grid>
        </details>
        <Divider />
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Button
            htmlType="submit"
            loading={loading}
            style={{ ...BlueButton, width: "fit-content" }}
          >
            <Typography textTransform={"none"} style={BlueButtonText}>
              Save and log out
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default BodyForm;
