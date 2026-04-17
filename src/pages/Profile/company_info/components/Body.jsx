import { useMediaQuery, useTheme } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import ImageUploaderFormat from "../../../../classes/imageCloudinaryFormat";
import { onLogout } from "../../../../store/slices/adminSlice";
import CardSearchStaffFound from "../../../search/utils/CardSearchStaffFound";
import "./Body.css";
import BodyForm from "./BodyForm";
const Body = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
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
    enabled: !!user.companyData.company_name,
  });
  const eventsCompany = useQuery({
    queryKey: ["allEventsRelatedCompany"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company_id: user.companyData.id,
      }),
    enabled: !!user.companyData.company_name,
  });
  const [industryOptionStored, setIndustryOptionStored] = useState([]);
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
  useEffect(() => {
    if (industryListOptions.data) {
      setIndustryOptionStored(industryListOptions.data.data.industry);
    }
  }, [industryListOptions.data]);

  const updateCompanyInfoMutation = useMutation({
    mutationFn: async (data) => {
      let base64 = user.companyData.company_logo;
      if (data.companyLogo[0]) {
        if (data.companyLogo[0].size > 1048576) {
          throw new Error(
            "Image is bigger than 1mb. Please resize the image or select a new one."
          );
        }
        const fileBase64 = await convertToBase64(data.companyLogo[0]);
        const imageUploader = new ImageUploaderFormat(
          fileBase64,
          user.companyData.id
        );
        const uploadingCompanyLogo = await devitrakApi.post(
          "cloudinary/upload-image",
          imageUploader.company_uploader()
        );
        if (uploadingCompanyLogo.data) {
          base64 = uploadingCompanyLogo.data.imageUploaded.secure_url;
        }
      }

      const companyUpdatePayload = {
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
        employees: data.employees,
      };
      const dbCompanyUpdatePayload = {
        company_name: data.companyName,
        street_address: data.street,
        city_address: data.city,
        state_address: data.state,
        zip_address: data.zipCode,
        phone_number: data.mainPhoneNumber,
        industry: data.industry,
        email_company: data.email,
        company_id: user.sqlInfo.company_id,
      };
      const updatePromises = [
        devitrakApi.patch(
          `/company/update-company/${user.companyData.id}`,
          companyUpdatePayload
        ),
        devitrakApi.post("/db_company/update_company", dbCompanyUpdatePayload),
      ];

      const stripeAccount = user.companyData.stripe_connected_account;
      if (stripeAccount && (stripeAccount.live || stripeAccount.test)) {
        const stripeUpdateData = {
          company_email: data.email,
          company_name: data.companyName,
          company_phone: data.mainPhoneNumber,
          website: data.website,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            postal_code: data.zipCode,
          },
        };

        if (stripeAccount.test) {
          updatePromises.push(
            devitrakApi.post("/stripe/company-account-stripe/update", {
              ...stripeUpdateData,
              connectedAccountId: stripeAccount.test,
            })
          );
        }
        if (stripeAccount.live) {
          updatePromises.push(
            devitrakApi.post("/stripe/company-account-stripe/update", {
              ...stripeUpdateData,
              connectedAccountId: stripeAccount.live,
            })
          );
        }
      }
      const promiseResults = await Promise.all(updatePromises);
      const companyUpdateResult = promiseResults[0];
      const dbCompanyUpdateResult = promiseResults[1];
      if (data.companyName !== user.companyData.company_name) {
        const eventsData = eventsCompany?.data?.data?.list;
        if (eventsData && eventsData.length > 0) {
          await devitrakApi.patch("/event/update-events", {
            ids: [...eventsData.map((item) => item.id)],
            newValues: {
              company: data.companyName,
            },
          });
        }
      }
      // dispatch(onLogout());
      return {
        companyUpdateResult,
        dbCompanyUpdateResult,
        companyUpdatePayload,
      };
    },
    onSuccess: () => {
      openNotificationWithIcon(
        "Company information updated successfully",
        3000
      );
      dispatch(onLogout());
    },
  });

  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      return devitrakApi.patch(
        `/company/update-company/${user.companyData.id}`,
        {
          company_logo: "",
        }
      );
    },
    onSuccess: () => {
      openNotificationWithIcon(
        "Company logo removed successfully",
        3000
      );
    },
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (eventsCompany.data && industryListOptions.data) {
    const handleUpdate = (data) => {
      updateCompanyInfoMutation.mutate(data);
    };

    const removingCompanyLogo = () => {
      removeLogoMutation.mutate();
    };
    return (
      <>
        {contextHolder}
        <BodyForm
          handleUpdatePersonalInfo={handleUpdate}
          handleSubmit={handleSubmit}
          isMobile={isMobile}
          loading={
            updateCompanyInfoMutation.isLoading || removeLogoMutation.isLoading
          }
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