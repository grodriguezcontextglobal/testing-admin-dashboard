import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputLabel,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { Avatar, Divider, Space, notification } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { CompanyIcon } from "../../../../components/icons/Icons";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import "./Body.css";
import CardSearchStaffFound from "../../../search/utils/CardSearchStaffFound";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onLogin } from "../../../../store/slices/adminSlice";
const Body = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = () => {
    api.open({
      message: "Information updated",
    });
  };
  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }
  const { register, handleSubmit } = useForm({
    defaultValues: {
      companyName: user.companyData.company_name,
      mainPhoneNumber: user.companyData.phone.main,
      alternativePhoneNumber: user.companyData.phone.alternative,
      street: user.companyData.address.street,
      city: user.companyData.address.city,
      state: user.companyData.address.state,
      zipCode: user.companyData.address.postal_code,
      website: user.companyData.website,
      // companyLogo: user.companyData.company_logo,
      email: user.companyData.main_email,
      employees: user.companyData.employees,
    },
  });

  const features = [
    {
      title: "Company name",
      id: 0,
      object: false,
      array: false,
      logo: false,
      name: "companyName",
    },
    {
      title: "Main phone number",
      id: 1,
      name: "mainPhoneNumber",
      object: false,
      array: false,
      logo: false,
    },

    {
      title: "Alternative phone number",
      id: 2,
      object: false,
      array: false,
      logo: false,
      name: "alternativePhoneNumber",
    },
    {
      title: "Address",
      id: 3,
      object: true,
      array: false,
      logo: false,
      children: [
        {
          name: "street",
        },
        {
          name: "city",
        },
        {
          name: "state",
        },
        {
          name: "zipCode",
        },
      ],
    },
    {
      title: "Website",
      id: 4,
      object: false,
      array: false,
      logo: false,
      name: "website",
    },
  ];
  const handleUpdatePersonalInfo = async (data) => {
    let base64;
    if (data.companyLogo[0] && data.companyLogo[0].size > 1048576) {
      return alert(
        "Image is bigger than 1mb. Please resize the image or select a new one."
      );
    } else {
      if (data.companyLogo[0]) {
        base64 = await convertToBase64(data.companyLogo[0]);
      } else {
        base64 = user.companyData.company_logo;
      }
      const resp = await devitrakApi.patch(
        `/company/update-company/${user.companyData.id}`,
        {
          phone: {
            main: data.mainPhoneNumber,
            alternative: data.alternativePhoneNumber,
            fax: "unknown",
          },
          company_name: data.companyName,
          company_logo: base64,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            postal_code: data.zipCode,
          },
          website: data.website,
          main_email: data.email,
        }
      );
      if (resp) {
        dispatch(
          onLogin({
            ...user,
            companyData: {
              ...user.companyData,
              phone: {
                main: data.mainPhoneNumber,
                alternative: data.alternativePhoneNumber,
                fax: "unknown",
              },
              company_name: data.companyName,
              company_logo: base64,
              address: {
                street: data.street,
                city: data.city,
                state: data.state,
                postal_code: data.zipCode,
              },
              website: data.website,
              main_email: data.email,
            },
          })
        );
        openNotificationWithIcon();
        return;
      }
    }
    // else {
    // const resp = await devitrakApi.patch(
    // `/company/update-company/${user.companyData.id}`,
    // {
    // phone: {
    // main: data.mainPhoneNumber,
    // alternative: data.alternativePhoneNumber,
    // fax: "unknown",
    // },
    // company_name: data.companyName,
    // company_logo: base64,
    // address: {
    // street: data.street,
    // city: data.city,
    // state: data.state,
    // postal_code: data.zipCode,
    // },
    // website: data.website,
    // main_email: data.email,
    // }
    // );
    // if (resp) {
    // dispatch(
    // onLogin({
    // ...user,
    // companyData: {
    // ...user.companyData,
    // phone: {
    // main: data.mainPhoneNumber,
    // alternative: data.alternativePhoneNumber,
    // fax: "unknown",
    // },
    // company_name: data.companyName,
    // company_logo: base64,
    // address: {
    // street: data.street,
    // city: data.city,
    // state: data.state,
    // postal_code: data.zipCode,
    // },
    // website: data.website,
    // main_email: data.email,
    // },
    // })
    // );
    // openNotificationWithIcon();
    // return;
    // }
    // }
  };
  return (
    <>
      {contextHolder}
      <form
        onSubmit={handleSubmit(handleUpdatePersonalInfo)}
        style={{
          width: "100%",
        }}
      >
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
                    justifyContent={"flex-start"}
                    alignItems={"center"}
                    marginY={0}
                    gap={2}
                    item
                    xs={6}
                    sm={6}
                    md={6}
                  >
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
                    <div
                      style={{ width: "100%", display: "flex", gap: "10px" }}
                    >
                      {" "}
                      <OutlinedInput
                        style={{ ...OutlinedInputStyle, width: "70%" }}
                        fullWidth
                        {...register(`${item.children[0].name}`)}
                      />
                      <OutlinedInput
                        style={{ ...OutlinedInputStyle, width: "30%" }}
                        fullWidth
                        {...register(`${item.children[1].name}`)}
                      />
                    </div>
                    <div
                      style={{ width: "100%", display: "flex", gap: "10px" }}
                    >
                      {" "}
                      <OutlinedInput
                        style={{ ...OutlinedInputStyle }}
                        fullWidth
                        {...register(`${item.children[2].name}`)} // value={item.children[0].value}
                      />
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
                <Avatar
                  size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 }}
                  src={
                    <img
                      src={user?.companyData?.company_logo}
                      alt="company_logo"
                    />
                  }
                />
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
                <TextField
                  {...register(`companyLogo`)}
                  id="file-upload"
                  type="file"
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
                Employees
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
            <Space size={[16, 24]} wrap>
              {user.companyData.employees.map((employee) => {
                return (
                  <Grid
                    key={employee.user}
                    display={"flex"}
                    justifyContent={"flex-start"}
                    alignItems={"center"}
                    padding={"5px"}
                    item
                    xs={12}
                    sm={12}
                    md={4}
                    lg={2}
                  >
                    <CardSearchStaffFound
                      props={{
                        status: employee.status,
                        name: employee.firstName,
                        lastName: employee.lastName,
                        email: employee.user,
                        phoneNumber: "",
                      }}
                      fn={null}
                    />
                  </Grid>
                );
              })}
            </Space>
          </Grid>
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
              type="submit"
              style={{ ...BlueButton, width: "fit-content" }}
            >
              <Typography textTransform={"none"} style={BlueButtonText}>
                Save
              </Typography>
            </Button>
          </Grid>
        </Grid>
      </form>{" "}
    </>
  );
};

export default Body;
