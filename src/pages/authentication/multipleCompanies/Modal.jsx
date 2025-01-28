import { Grid } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Modal, Select, Spin, notification } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../../api/devitrakApi";
import { useState } from "react";
import Loading from "../../../components/animation/Loading";
import { ProfileIcon } from "../../../components/icons/ProfileIcon";
import {
  clearErrorMessage,
  onAddErrorMessage,
  onLogin,
  onLogout,
} from "../../../store/slices/adminSlice";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";

const ModalMultipleCompanies = ({
  openMultipleCompanies,
  setOpenMultipleCompanies,
  data: dataPassed,
}) => {
  const closeModal = () => {
    return setOpenMultipleCompanies(false);
  };
  const [isLoading, setIsLoading] = useState(false);
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

  const loginIntoOneCompanyAccount = async (props) => {
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
          company_name: props,
        }
      );
      const stripeSQL = await devitrakApi.post("/db_stripe/consulting-stripe", {
        company_id: companyInfoTable.data.company.at(-1).company_id,
      });
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
          role: findingCompanyInfoBasedOnSelection(props).employees.find(
            (item) => item.user === dataPassed.respo.email
          ).role,
          phone: dataPassed.respo.phone,
          company: props,
          companyData: findingCompanyInfoBasedOnSelection(props),
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
      navigate(`${Number(props.role) === 4 ? "/events" : "/"}`);
      // }
    } catch (error) {
      console.log(error);
      openNotificationWithIcon("error", `${error.response.data.msg}`);
      dispatch(onLogout("Incorrect credentials"));
      dispatch(onAddErrorMessage(error?.response?.data?.msg));
      throw error;
    }
  };

  const handleChange = (value) => {
    loginIntoOneCompanyAccount(value);
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
          flexDirection={'column'}
          justifyContent={"flex-start"}
          alignSelf={"flex-start"}
          margin={"20px 0px"}
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
              alignSelf: "flex-start",
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "80px",
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
                ...TextFontSize30LineHeight38,
                textWrap: "pretty",
                margin: "0px 0px 10px 0px",
              }}
            >
              Welcome back {dataPassed.respo.entire.name}{" "}
              {dataPassed.respo.entire.lastName}!
            </h1>
          </div>
          <p
            style={{
              ...TextFontSize20LineHeight30,
              textWrap: "balance",
              fontWeight: 500,
              width: "100%",
              margin:"15px 0"
            }}
          >
            You have access to multiple companies. Please select the company you
            wish to log in to from the options below.
          </p>

        </Grid>
        <Select
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
          onChange={handleChange}
          options={[
            ...dataPassed.companyInfo.map((item) => ({
              value: item.company,
              label: (
                <span
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    padding: "10px 10px 10px 0px",
                  }}
                >
                  <Avatar
                    src={
                      dataPassed.company_data.filter(
                        (item) => item.company_name === item.company
                      )[0]?.company_logo
                    }
                  ></Avatar>
                  &nbsp;{item.company}
                </span>
              ),
            })),
          ]}
        />
        <Button
          loading={isLoading}
          onClick={() => {
            localStorage.removeItem("admin-token");
            setOpenMultipleCompanies(false);
          }}
          style={{ ...DangerButton, width: "100%", margin: "20px 0px" }}
        >
          <p style={DangerButtonText}>Log out</p>
        </Button>
        {isLoading && <Spin indicator={<Loading />} fullscreen />}
      </Grid>
    </Modal>
  );
};

export default ModalMultipleCompanies;
