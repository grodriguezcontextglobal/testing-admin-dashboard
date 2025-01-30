import { Grid } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal, Select, Spin, notification } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import dicRole from "../../../components/general/dicRole";
import { ProfileIcon } from "../../../components/icons/ProfileIcon";
import {
  clearErrorMessage,
  onAddErrorMessage,
  onLogin,
  onLogout,
} from "../../../store/slices/adminSlice";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";

const ModalMultipleCompanies = ({
  openMultipleCompanies,
  setOpenMultipleCompanies,
  data: dataPassed,
}) => {
  const closeModal = () => {
    return setOpenMultipleCompanies(false);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [selection, setSelection] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
      duration: 0,
    });
  };
  const queryClient = useQueryClient();
  const findingCompanyInfoBasedOnSelection = (props) => {
    const result = dataPassed.company_data.find(
      (element) => element.company_name === props
    );
    return result;
  };

  const loginIntoOneCompanyAccount = async () => {
    try {
      setIsLoading(true);
      localStorage.setItem("admin-token", dataPassed.respo.token);
      await devitrakApiAdmin.patch(`/profile/${dataPassed.respo.uid}`, {
        online: true,
      });
      const respoFindMemberInfo = await devitrakApi.post(
        "/db_staff/consulting-member",
        {
          email: dataPassed.email,
        }
      );
      const companyInfoTable = await devitrakApi.post(
        "/db_company/consulting-company",
        {
          company_name: selection,
        }
      );
      const stripeSQL = await devitrakApi.post("/db_stripe/consulting-stripe", {
        company_id: companyInfoTable.data.company.at(-1).company_id,
      });

      const employeeRoleBasedOnCompany = findingCompanyInfoBasedOnSelection(
        selection
      ).employees.find((item) => item.user === dataPassed.respo.email).role;

      dispatch(
        onLogin({
          data: {
            ...dataPassed.respo.entire,
            online: true,
          },
          name: dataPassed.respo.name,
          lastName: dataPassed.respo.lastName,
          uid: dataPassed.respo.uid,
          email: dataPassed.respo.email,
          role: employeeRoleBasedOnCompany,
          phone: dataPassed.respo.phone,
          company: selection,
          companyData: findingCompanyInfoBasedOnSelection(selection),
          token: dataPassed.respo.token,
          online: true,
          sqlMemberInfo: respoFindMemberInfo.data.member.at(-1),
          sqlInfo: {
            ...companyInfoTable.data.company.at(-1),
            stripeID: stripeSQL.data.stripe.at(-1),
          },
        })
      );
      setIsLoading(false);
      dispatch(clearErrorMessage());
      queryClient.clear();
      openNotificationWithIcon("Success", "User logged in.");
      navigate(`${Number(employeeRoleBasedOnCompany) === 4 ? "/events" : "/"}`);
      // }
    } catch (error) {
      openNotificationWithIcon("error", `${error.response.data.msg}`);
      dispatch(onLogout("Incorrect credentials"));
      dispatch(onAddErrorMessage(error?.response?.data?.msg));
      throw error;
    }
  };

  const handleChange = (value) => {
    return setSelection(value);
  };

  const renderingExtraCompanyInfo = (props) => {
    const result = dataPassed.company_data.filter(
      (item) => item.company_name === props
    );
    const employeeRoleInCompany = result[0]?.employees.find(
      (item) => item.user === dataPassed.respo.email
    );
    return {
      company_logo: result[0]?.company_logo,
      employeeRoleInCompany: employeeRoleInCompany?.role,
    };
  };

  return (
    <Modal
      open={openMultipleCompanies}
      onCancel={() => closeModal()}
      centered
      footer={[]}
      style={{ zIndex: 30 }}
    >
      {contextHolder}
      <Grid container>
        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"flex-start"}
          alignSelf={"flex-start"}
          margin={"20px 0px 0px"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                margin: "0 20px 0 0",
              }}
            >
              {dataPassed.respo.entire.imageProfile.length > 0 ? (
                <img
                  src={dataPassed.respo.entire.imageProfile}
                  alt="profile"
                  style={{
                    verticalAlign: "middle",
                    objectFit: "cover",
                    overflow: "hidden",
                    borderRadius: "50%",
                  }}
                  width={"100%"}
                  height={"100%"}
                />
              ) : (
                <ProfileIcon />
              )}
            </div>
            <h1
              style={{
                ...TextFontSize14LineHeight20,
                textWrap: "pretty",
                margin: "0px 0px 10px 0px",
              }}
            >
              Welcome back, {dataPassed.respo.entire.name}{" "}
              {dataPassed.respo.entire.lastName}!
            </h1>
          </div>
          <p
            style={{
              ...TextFontsize18LineHeight28,
              textWrap: "balance",
              width: "100%",
              margin: "15px 0",
            }}
          >
            Select the account
          </p>

          <p
            style={{
              ...TextFontSize14LineHeight20,
              textWrap: "pretty",
              margin:0
            }}
          >
            Because you have access to more than one account using Devitrak, you
            must select the account you want to log in to from the menu below.
          </p>
        </Grid>
        <p
          style={{
            ...TextFontSize14LineHeight20,
            fontWeight: 500,
            textWrap: "pretty",
            margin:"10px 0px 5px"
          }}
        >
          Companies you have access to:
        </p>
        <Select
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            height: "2.5rem",
          }}
          onChange={handleChange}
          options={[
            ...dataPassed.companyInfo.map((item) => ({
              value: item.company,
              label: (
                <p
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    padding: "5px 5px 5px 0px",
                  }}
                >
                  <img
                    width={30}
                    height={30}
                    style={{
                      objectFit: "scale-down",
                      objectPosition: "center",
                    }}
                    src={
                      renderingExtraCompanyInfo(item.company).company_logo
                        .length > 0
                        ? renderingExtraCompanyInfo(item.company).company_logo
                        : "https://res.cloudinary.com/dsuynhcgd/image/upload/c_thumb,w_200,g_face/v1738169822/material-symbols--enterprise-outline_vmmi7y.svg"
                    }
                  />{" "}
                  {/* <Avatar
                    size={"large"}
                    shape="circle"
                    src={renderingExtraCompanyInfo(item.company).company_logo}
                  >
                    {item.company}
                  </Avatar> */}
                  &nbsp;
                  <span
                    style={{
                      ...TextFontSize20LineHeight30,
                      fontSize: "16px",
                      fontWeight: 500,
                      lineHeight: "24px",
                      textTransform: "capitalize",
                    }}
                  >
                    {item.company} -
                  </span>
                  &nbsp;
                  <span
                    style={{
                      ...Subtitle,
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "24px",
                    }}
                  >
                    {
                      dicRole[
                        renderingExtraCompanyInfo(item.company)
                          .employeeRoleInCompany
                      ]
                    }
                  </span>
                </p>
              ),
            })),
          ]}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            width: "100%",
            gap: "10px",
          }}
        >
          <Button
            loading={isLoading}
            onClick={() => {
              localStorage.removeItem("admin-token");
              setOpenMultipleCompanies(false);
            }}
            style={{ ...GrayButton, width: "100%", margin: "20px 0px" }}
          >
            <p style={GrayButtonText}>Cancel</p>
          </Button>
          <Button
            loading={isLoading}
            onClick={() => loginIntoOneCompanyAccount()}
            style={{ ...BlueButton, width: "100%", margin: "20px 0px" }}
          >
            <p style={BlueButtonText}>Enter account</p>
          </Button>
        </div>

        {isLoading && <Spin indicator={<Loading />} fullscreen />}
      </Grid>
    </Modal>
  );
};

export default ModalMultipleCompanies;
