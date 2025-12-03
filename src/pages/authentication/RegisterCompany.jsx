import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { notification } from "antd";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import { convertToBase64 } from "../../components/utils/convertToBase64";
import {
  onAddErrorMessage,
  onLogin,
  onLogout,
} from "../../store/slices/adminSlice";
import { AntSelectorStyle } from "../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import consultingCompanyInSqDb from "./actions/consultingCompanyInSqDb";
import consultingUserMemberInSqlDb from "./actions/consultingUserMemberInSqlDb";
import createCompany from "./actions/createCompany";
import createStripeAccount from "./actions/createStripeAccount";
import DevitrakTermsAndConditions, {
  agreedAgreement,
} from "./actions/DevitrakTermsAndConditions";
import insertingNewCompanyInSqlDb from "./actions/insertingNewCompanyInSqlDb";
import insertingStripeAccountInSqlDb from "./actions/insertingStripeAccountInSqlDb";
import insertingUserMemberInSqlBd from "./actions/insertingUserMemberInSqlBd";
import userRegistrationProcess from "./actions/userRegistrationProcess";
import CompanyRegistration from "./ux/CompanyRegistration";
const RegisterCompany = () => {
  const isSmallDevice = useMediaQuery("only screen abd (max-width: 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width: 769px) and (max-width:992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen abd (min-width: 1201px)"
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
  const matchCompany = useCallback(() => {
    const foundCompany = companies()?.find(
      (company) =>
        String(company).toLowerCase() === String(companyValue).toLowerCase()
    );
    if (foundCompany) {
      openNotificationWithIcon(
        "error",
        "Company exists!",
        "Company already exists in our records.",
        0
      );
      return true;
    }
    return false;
  }, [companyValue]);
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
  const ref = useRef({});
  const agreementTermsAndConditions = async () => {
    const closingModal = () => null;
    return agreedAgreement({
      staffMember: `${user.name} ${user.lastName}`,
      company_id: ref.current.companyData.id,
      setOpen: closingModal,
      setIsLoading: setLoadingStatus,
    });
  };
  const onSubmitRegister = async (data) => {
    let base64 = "";
    if (locationList.length < 1) {
      return alert(
        "Please provide at least one location. Go to locations field, type a location where your inventory will be located and then click button Add, then you can proceed to complete the registration process."
      );
    } else {
      if (data.photo.length > 0 && data.photo[0].size > 1048576) {
        setLoadingStatus(false);
        return alert(
          "Image is bigger than allow. Please resize the image or select a new one."
        );
      } else if (data.photo.length > 0) {
        setLoadingStatus(true);
        base64 = await convertToBase64(data.photo[0]);
      }
      try {
        setLoadingStatus(true);
        openNotificationWithIcon(
          "info",
          "Processing",
          "We're processing your request",
          0
        );
        if (user.existing) {
          await createStripeAccount({ companyValue, user, ref });
          await createCompany({
            props: { ...data, company_logo: base64 },
            ref,
            companyValue,
            locationList,
            websiteUrl,
            industry,
            user,
          });
          await insertingNewCompanyInSqlDb({
            props: { ...data },
            companyValue,
            ref,
            industry,
            websiteUrl,
          });
          await insertingStripeAccountInSqlDb(ref);
          await consultingUserMemberInSqlDb({ ref, user });
          await consultingCompanyInSqDb(ref);
          await agreementTermsAndConditions();
          queryClient.clear();
          setLoadingStatus(false);
          api.destroy();
          dispatch(
            onLogin({
              ...ref.current.userRegistration,
              companyData: { ...ref.current.companyData },
              sqlMemberInfo: { ...ref.current.sqlMemberInfo },
              sqlInfo: { ...ref.current.sqlInfo },
            })
          );
          openNotificationWithIcon(
            "success",
            "Account created.",
            "Your new account was created. Please log in.",
            3
          );
          return navigate("/register/connected-account");
        } else {
          await createStripeAccount({ companyValue, user, ref });
          await userRegistrationProcess({ user, companyValue, ref });
          await createCompany({
            props: { ...data, company_logo: base64 },
            ref,
            companyValue,
            locationList,
            websiteUrl,
            industry,
            user,
          });
          await insertingNewCompanyInSqlDb({
            props: { ...data },
            companyValue,
            ref,
            industry,
            websiteUrl,
          });
          await insertingStripeAccountInSqlDb(ref);
          await insertingUserMemberInSqlBd({ props: { ...data }, user, ref });
          await consultingUserMemberInSqlDb({ ref, user });
          await consultingCompanyInSqDb(ref);
          await agreementTermsAndConditions();
          dispatch(
            onLogin({
              ...ref.current.userRegistration,
              companyData: { ...ref.current.companyData },
              sqlMemberInfo: { ...ref.current.sqlMemberInfo },
              sqlInfo: { ...ref.current.sqlInfo },
            })
          );
          queryClient.clear();
          setLoadingStatus(false);
          api.destroy();
          openNotificationWithIcon(
            "success",
            "Account created.",
            "Your new account was created. Please log in.",
            3
          );
          return navigate("/register/connected-account");
        }
      } catch (error) {
        notification.destroy("info");
        // console.log(error);
        openNotificationWithIcon(
          "error",
          "Action failed",
          `Please try again later. ${error}`,
          3
        );
        dispatch(onAddErrorMessage(error));
        setLoadingStatus(false);
      }
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
        matchCompany={matchCompany}
        retrieveIndustryOptions={retrieveIndustryOptions}
        OutlinedInputStyle={OutlinedInputStyle}
        register={register}
        AntSelectorStyle={AntSelectorStyle}
        BlueButton={BlueButton}
        CenteringGrid={CenteringGrid}
        BlueButtonText={BlueButtonText}
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
