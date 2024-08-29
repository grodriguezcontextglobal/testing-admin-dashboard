import { Icon } from "@iconify/react";
import {
  Grid,
  InputLabel,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Button, Divider, Space, notification } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { CompanyIcon } from "../../../../components/icons/Icons";
import { onLogout } from "../../../../store/slices/adminSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import CardSearchStaffFound from "../../../search/utils/CardSearchStaffFound";
import "./Body.css";
const Body = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const openNotificationWithIcon = (msg, time) => {
    api.open({
      message: msg,
      duration: time,
    });
  };
  const originalDataRef = {
    companyName: user.companyData.company_name,
    mainPhoneNumber: user.companyData.phone.main,
    alternativePhoneNumber: user.companyData.phone.alternative,
    street: user.companyData.address.street,
    city: user.companyData.address.city,
    state: user.companyData.address.state,
    zipCode: user.companyData.address.postal_code,
    website: user.companyData.website,
    email: user.companyData.main_email,
    employees: user.companyData.employees,
    companyLogo: user.companyData.company_logo,
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
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      companyName: user.companyData.company_name,
      mainPhoneNumber: user.companyData.phone.main,
      alternativePhoneNumber: user.companyData.phone.alternative,
      street: user.companyData.address.street,
      city: user.companyData.address.city,
      state: user.companyData.address.state,
      zipCode: user.companyData.address.postal_code,
      website: user.companyData.website,
      email: user.companyData.main_email,
      employees: user.companyData.employees,
    },
  });
  const checkIfOriginalDataHasChange = (props) => {
    if (originalDataRef[props] !== "" && originalDataRef[props] !== watch(`${props}`)) {
      return openNotificationWithIcon(
        "Please save updates before leave this tab.",
        0
      );
    }
  };
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

  const eventsCompany = useQuery({
    queryKey: ["allEventsRelatedCompany"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.companyData.company_name,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    eventsCompany.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  if (eventsCompany.data) {
    const updatingAllEventsRelatedCompany = async (props) => {
      const eventsData = eventsCompany?.data?.data?.list;
      if (eventsData.length > 0) {
        for (let data of eventsData) {
          await devitrakApi.patch(`/event/edit-event/${data.id}`, {
            ...data,
            company: props,
          });
        }
      }
    };

    const handleUpdatePersonalInfo = async (data) => {
      let base64;
      setLoading(true);
      try {
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
          if (resp.data) {
            await devitrakApi.post("/db_company/update_company", {
              company_name: data.companyName,
              street_address: data.street,
              city_address: data.city,
              state_address: data.state,
              zip_address: data.zipCode,
              phone_number: data.mainPhoneNumber,
              email_company: data.email,
              company_id: user.sqlInfo.company_id,
            });
            await updatingAllEventsRelatedCompany(data.companyName);
            setLoading(false);
            openNotificationWithIcon("Information updated", 3);
            dispatch(onLogout());
            return window.location.reload(true);
          }
        }
      } catch (error) {
        console.log(error);
        alert("Something went wrong. Please try again.");
        setLoading(false);
      }
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
                    key={item.title}
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
                    key={item.name}
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
                      <div
                        style={{ width: "100%", display: "flex", gap: "10px" }}
                      >
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
                      <div
                        style={{ width: "100%", display: "flex", gap: "10px" }}
                      >
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
                  {checkIfOriginalDataHasChange('companyLogo')}
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
                htmlType="submit"
                loading={loading}
                style={{ ...BlueButton, width: "fit-content" }}
              >
                <Typography textTransform={"none"} style={BlueButtonText}>
                  Save and log out.
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </form>{" "}
      </>
    );
  }
};

export default Body;
