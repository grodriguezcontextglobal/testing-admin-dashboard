import { useMediaQuery, useTheme } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import ImageUploaderFormat from "../../../../classes/imageCloudinaryFormat";
import { onLogin, onLogout } from "../../../../store/slices/adminSlice";
import CardSearchStaffFound from "../../../search/utils/CardSearchStaffFound";
import "./Body.css";
import BodyForm from "./BodyForm";
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
    industry: user.companyData.industry,
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
  const { register, handleSubmit, watch, control } = useForm({
    defaultValues: {
      companyName: user.companyData.company_name,
      mainPhoneNumber: user.companyData.phone.main,
      alternativePhoneNumber: user.companyData.phone.alternative,
      street: user.companyData.address.street,
      city: user.companyData.address.city,
      state: user.companyData.address.state,
      zipCode: user.companyData.address.postal_code,
      website: user.companyData.website,
      industry: user.companyData.industry,
      email: user.companyData.main_email,
      employees: user.companyData.employees,
    },
  });

  const checkIfOriginalDataHasChange = (props) => {
    if (
      originalDataRef[props] !== "" &&
      originalDataRef[props] !== watch(`${props}`)
    ) {
      api.destroy();
      return openNotificationWithIcon(
        "Please save updates before leave this tab.",
        2
      );
    }
  };

  const industryListOptions = useQuery({
    queryKey: ["existingRegisteredIndustryOptions"],
    queryFn: () => devitrakApi.post("/db_company/industry"),
    refetchOnMount: false,
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
    {
      title: "Industry",
      id: 5,
      object: false,
      array: false,
      logo: false,
      name: "industry",
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
    industryListOptions.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const [industryOptionStored, setIndustryOptionStored] = useState([]);

  useEffect(() => {
    if (industryListOptions.data) {
      setIndustryOptionStored(industryListOptions.data.data.industry);
    }
  }, [industryListOptions.data]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (eventsCompany.data && industryListOptions.data) {
    const updatingAllEventsRelatedCompany = async (props) => {
      const eventsData = eventsCompany?.data?.data?.list;
      await devitrakApi.patch("/event/update-events", {
        ids: [...eventsData.map((item) => item.id)],
        newValues: {
          company: props,
        },
      });
      // if (eventsData.length > 0) {
      //   for (let data of eventsData) {
      //     await devitrakApi.patch(`/event/edit-event/${data.id}`, {
      //       ...data,
      //       company: props,
      //     });
      //   }
      // }
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
            const fileBase64 = await convertToBase64(data.companyLogo[0]);
            const imageUploader = new ImageUploaderFormat(
              fileBase64,
              user.companyData.id,
              "",
              "",
              "",
              "",
              "",
              "",
              ""
            );
            const uploadingCompanyLogo = await devitrakApi.post(
              "cloudinary/upload-image",
              imageUploader.company_uploader()
            );
            if (uploadingCompanyLogo.data) {
              base64 = uploadingCompanyLogo.data.imageUploaded.secure_url;
            }
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
              industry: data.industry,
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
              industry: data.industry,
              email_company: data.email,
              company_id: user.sqlInfo.company_id,
            });
            if (data.companyName !== user.companyData.company_name) {
              await updatingAllEventsRelatedCompany(data.companyName);
            }
            setLoading(false);
            openNotificationWithIcon("Information updated", 3);
            dispatch(onLogout());
            return window.location.reload(true);
          }
        }
      } catch (error) {
        alert("Something went wrong. Please try again.");
        return setLoading(false);
      }
    };

    const removingCompanyLogo = async () => {
      setLoading(true);
      const resp = await devitrakApi.patch(
        `/company/update-company/${user.companyData.id}`,
        {
          company_logo: "",
        }
      );
      api.destroy();
      if (resp.data.ok) {
        setLoading(false);
        dispatch(
          onLogin({
            ...user,
            companyData: {
              ...user.companyData,
              company_logo: "",
            },
          })
        );
        return openNotificationWithIcon(
          "Company logo removed. Please log out and log in to see the changes.",
          3
        );
      }
    };
    return (
      <>
        {contextHolder}
        <BodyForm
          handleUpdatePersonalInfo={handleUpdatePersonalInfo}
          handleSubmit={handleSubmit}
          isMobile={isMobile}
          loading={loading}
          features={features}
          user={user}
          checkIfOriginalDataHasChange={checkIfOriginalDataHasChange}
          removingCompanyLogo={removingCompanyLogo}
          register={register}
          CardSearchStaffFound={CardSearchStaffFound}
          control={control}
          industryListOptions={industryOptionStored}
        />
      </>
    );
  }
};

export default Body;
