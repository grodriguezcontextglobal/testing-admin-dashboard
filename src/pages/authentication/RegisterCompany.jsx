import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { notification } from "antd";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import ImageUploaderFormat from "../../classes/imageCloudinaryFormat";
import { convertToBase64 } from "../../components/utils/convertToBase64";
import {
  onAddErrorMessage,
  onLogin,
  onLogout,
} from "../../store/slices/adminSlice";
import { Subtitle } from "../../styles/global/Subtitle";
import createStripeAccount from "./actions/createStripeAccount";
import DevitrakTermsAndConditions, {
  agreedAgreement,
} from "./actions/DevitrakTermsAndConditions";
import CompanyRegistration from "./ux/CompanyRegistration";
const RegisterCompany = () => {
  const isSmallDevice = useMediaQuery("only screen abd (max-width: 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width: 769px) and (max-width:992px)",
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)",
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen abd (min-width: 1201px)",
  );
  const adjustingFormWidth = (arg1, arg2, arg3, arg4) => {
    if (isSmallDevice) return arg1; //"90vw";
    if (isMediumDevice) return arg2; //"50vw";
    if (isLargeDevice) return arg3; //"40vw";
    if (isExtraLargeDevice) return arg4; //"50vw";
  };
  const { user } = useSelector((state) => state.admin);
  const [listCompany, setListCompany] = useState([]);
  const [companyValue, setCompanyValue] = useState();
  const [companyExists, setCompanyExists] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [locationList, setLocationList] = useState([]);
  const [newlocation, setNewlocation] = useState("");
  const [triggerModal, setTriggerModal] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, title, msg, time) => {
    api.open({
      message: title,
      description: msg,
      duration: time,
      key: `${type}`,
    });
  };

  const industryListQuery = useQuery({
    queryKey: ["companyInfoList"],
    queryFn: () => devitrakApi.post("/db_company/industry"),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    industryListQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  const callAPiUserCompany = useCallback(async () => {
    const resp = await devitrakApi.post("/company/companies");
    if (resp) {
      return setListCompany(resp.data.company);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    callAPiUserCompany();
    return () => {
      controller.abort();
    };
  }, [listCompany.length, callAPiUserCompany]);
  const companies = useCallback(() => {
    let result = new Set();

    for (let data of listCompany) {
      result.add(data.company_name);
    }
    return Array.from(result);
  }, [listCompany]);
  companies();
  useEffect(() => {
    if (!companyValue) { setCompanyExists(false); return; }
    const found = listCompany.some(
      (c) => String(c.company_name).toLowerCase() === String(companyValue).toLowerCase(),
    );
    if (found) {
      setCompanyExists(true);
      openNotificationWithIcon("error", "Company exists!", "Company already exists in our records.", 5);
    } else {
      setCompanyExists(false);
    }
  }, [companyValue, listCompany.length]);
  const retrieveIndustryOptions = () => {
    const result = new Set();
    if (industryListQuery.data) {
      const industryData = industryListQuery.data.data.industry;
      for (let data of industryData) {
        result.add(data);
      }
    }
    return Array.from(result);
  };
  const handleAddLocation = async () => {
    if (newlocation.length > 0) {
      let result = [...locationList, newlocation];
      setLocationList(result);
      setNewlocation("");
      return null;
    }
  };
  const handleDeleteLocation = (location) => {
    const result = locationList.filter((element) => element !== location);
    return setLocationList(result);
  };
  const onSubmitRegister = async (data) => {
    if (companyExists) return;
    if (locationList.length < 1) {
      return alert(
        "Please provide at least one location. Go to locations field, type a location where your inventory will be located and then click button Add, then you can proceed to complete the registration process.",
      );
    }
    if (data.photo.length > 0 && data.photo[0].size > 1048576) {
      return alert("Image is bigger than allow. Please resize the image or select a new one.");
    }

    setLoadingStatus(true);
    openNotificationWithIcon("info", "Processing", "We're processing your request", 0);

    try {
      // 1. Upload company logo to Cloudinary if provided
      let companyLogoUrl = "";
      if (data.photo.length > 0) {
        const base64Logo = await convertToBase64(data.photo[0]);
        const logoUploadPayload = new ImageUploaderFormat(
          base64Logo, companyValue, "", "", "", "", "", "", "",
        );
        const logoResp = await devitrakApi.post(
          "/cloudinary/upload-image",
          logoUploadPayload.company_uploader(),
        );
        companyLogoUrl = logoResp.data?.secure_url ?? "";
      }

      // 2. Create Stripe customer
      const stripeRef = { current: {} };
      await createStripeAccount({ companyValue, user, ref: stripeRef });
      const stripeID = stripeRef.current.stripeAccount?.stripeID ?? "";

      // 3. Build shared company payload
      const companyPayload = {
        company_name: companyValue,
        phone: {
          main: data.main_phone,
          alternative: data.alternative_phone ?? "",
        },
        website: websiteUrl,
        main_email: user.email,
        industry,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
        },
        location: locationList,
        company_logo: companyLogoUrl,
        stripe_customer_id: stripeID,
      };

      let apiResponse;

      if (user.existing) {
        // Camino B: usuario existente + empresa nueva
        const resp = await devitrakApi.post("/registration/add-company", {
          user: { userId: user.userID },
          company: companyPayload,
        });
        apiResponse = resp.data;
      } else {
        // Camino A: nuevo usuario + empresa nueva
        const resp = await devitrakApi.post("/registration/new", {
          user: {
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            phone: user.data?.phone ?? "000-000-0000",
            imageProfile: "",
          },
          company: companyPayload,
        });
        apiResponse = resp.data;

        // 4. Upload profile photo con el UID recibido (opcional — no bloquea)
        if (user.imageProfile && apiResponse.user?.uid) {
          try {
            const profilePayload = new ImageUploaderFormat(
              user.imageProfile, "", "", "",
              user.name, user.lastName,
              apiResponse.user.uid,
              "", "",
            );
            const profileResp = await devitrakApi.post(
              "/cloudinary/upload-image",
              profilePayload.staff_uploader(),
            );
            if (profileResp.data?.secure_url) {
              await devitrakApi.patch(`/staff/edit-admin/${apiResponse.user.uid}`, {
                imageProfile: profileResp.data.secure_url,
              });
              apiResponse.user.imageProfile = profileResp.data.secure_url;
            }
          } catch {
            // No bloquear el registro si la foto falla
          }
        }
      }

      // 5. Registrar aceptación de T&C (fire-and-forget)
      agreedAgreement({
        staffMember: `${user.name} ${user.lastName}`,
        staffEmail: user.email,
        setOpen: () => {},
        setIsLoading: () => {},
      }).catch(() => {});

      // 6. Actualizar Redux con los datos del servidor
      dispatch(
        onLogin({
          data: apiResponse.user,
          uid: apiResponse.user.uid,
          name: apiResponse.user.name,
          lastName: apiResponse.user.lastName,
          email: apiResponse.user.email,
          phone: apiResponse.user.phone ?? "",
          role: String(apiResponse.user.role ?? "0"),
          imageProfile: apiResponse.user.imageProfile ?? "",
          sqlStaffId: apiResponse.user.sqlStaffId,
          companyData: {
            ...apiResponse.company,
            id: apiResponse.company._id,
          },
          sqlInfo: {
            company_id: apiResponse.company.sql_id,
            company_name: apiResponse.company.company_name,
          },
          sqlMemberInfo: {
            staff_id: apiResponse.user.sqlStaffId,
            email: apiResponse.user.email,
          },
        }),
      );

      queryClient.clear();
      setLoadingStatus(false);
      api.destroy();
      openNotificationWithIcon("success", "Account created.", "Your new account was created. Please log in.", 3);
      navigate("/register/connected-account");
    } catch (error) {
      notification.destroy("info");
      openNotificationWithIcon("error", "Action failed", `Please try again later. ${error}`, 3);
      dispatch(onAddErrorMessage(error?.message ?? String(error)));
      setLoadingStatus(false);
    }
  };
  return (
    <>
      {contextHolder}
      <DevitrakTermsAndConditions
        open={triggerModal}
        setOpen={() => setTriggerModal(false)}
        navigate={() => navigate("/register")}
        staffMember={`${user.name} ${user.lastName}`}
        action={() => {
          setTriggerModal(false);
        }}
      />
      <CompanyRegistration
        isSmallDevice={isSmallDevice}
        isMediumDevice={isMediumDevice}
        handleSubmit={handleSubmit}
        onSubmitRegister={onSubmitRegister}
        adjustingFormWidth={adjustingFormWidth}
        user={user}
        companyValue={companyValue}
        setCompanyValue={setCompanyValue}
        websiteUrl={websiteUrl}
        setWebsiteUrl={setWebsiteUrl}
        industry={industry}
        setIndustry={setIndustry}
        loadingStatus={loadingStatus}
        locationList={locationList}
        newlocation={newlocation}
        setNewlocation={setNewlocation}
        handleAddLocation={handleAddLocation}
        handleDeleteLocation={handleDeleteLocation}
        companyExists={companyExists}
        retrieveIndustryOptions={retrieveIndustryOptions}
        register={register}
        Subtitle={Subtitle}
        dispatch={dispatch}
        onLogout={onLogout}
      />
    </>
  );
};

RegisterCompany.propTypes = {
  street: PropTypes.string,
  street2: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  postal_code: PropTypes.string,
  main_phone: PropTypes.string,
  alternative_phone: PropTypes.string,
  company_logo: PropTypes.string,
};
export default RegisterCompany;
