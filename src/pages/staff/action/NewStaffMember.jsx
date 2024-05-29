/* eslint-disable react/prop-types */
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, message } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import * as yup from "yup";
import { devitrakApi } from "../../../api/devitrakApi";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import dicRole from "../../../components/general/dicRole";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
  role: yup.string().required("Role is required"),
});

// const roles = ["Administrator", "Approver", "Editor"];
const roles = [0,1,2,3,4];

export const NewStaffMember = ({ modalState, setModalState }) => {
  const [loadingStatus, setLoadingStatus] = useState(false)
  const { user } = useSelector((state) => state.admin);
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  function closeModal() {
    setModalState(false);
  }
  const queryClient = useQueryClient()

  const allStaffSavedQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
    enabled: false,
    refetchOnMount: false
  });

  const companiesQuery = useQuery({
    queryKey: ['companyListQuery'],
    queryFn: () => devitrakApi.post('/company/search-company', {
      company_name: user.company
    }),
    enabled: false,
    refetchOnMount: false
  })
  const [messageApi, contextHolder] = message.useMessage();
  const warning = (type, content) => {
    messageApi.open({
      type: type,
      content: content,
      onClose: () => setValue("email", ""),
    });
  };
  useEffect(() => {
    const controller = new AbortController()
    allStaffSavedQuery.refetch()
    companiesQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [user.company])

  if (allStaffSavedQuery.data) {
    const onSubmitRegister = async (data) => {
      try {
        setLoadingStatus(true)
        const templateNewUser = {
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          question: "company name",
          answer: user.company,
          role: data.role,
          company: user.company,
        }
        await devitrakApi.patch(`/company/update-company/${companiesQuery.data.data.company[0].id}`, {
          employees: [
            ...companiesQuery.data.data.company[0].employees,
            {
              user: templateNewUser.email,
              firstName: templateNewUser.name,
              lastName: templateNewUser.lastName,
              status: "Pending",
              super_user: false,
              role: templateNewUser.role
            }
          ]
        })

        await devitrakApi.post('/nodemailer/new_invitation', {
          consumer: templateNewUser.email,
          subject: "Invitation",
          company: user.company,
          link: `https://admin.devitrak.net/invitation?first=${templateNewUser.name}&last=${templateNewUser.lastName}&email=${templateNewUser.email}&question=${templateNewUser.question}&answer=${templateNewUser.answer}&role=${templateNewUser.role}&company=${templateNewUser.company}`
        })
        queryClient.invalidateQueries({ queryKey: ['listAdminUsers'], exact: true })
        queryClient.invalidateQueries({ queryKey: ['staff'], exact: true })
        queryClient.invalidateQueries({ queryKey: ['employeesPerCompanyList'], exact: true })
        warning('success', `An invitation was sent to ${data.name} ${data.lastName}!`)
        await setTimeout(() => {
          return closeModal()
        }, 3500);
      } catch (error) {
        warning('error', 'Please try later. If error persists, please contact administrator.')
        setLoadingStatus(false)
      }

    };
    const renderTitle = () => {
      return (
        <Typography
          textTransform={"none"}
          lineHeight={"38px"}
          color={"var(--gray-900, #101828)"}
          textAlign={"center"}
          fontWeight={600}
          fontFamily={"Inter"}
          fontSize={"30px"}
        >
          New staff
        </Typography>
      );
    };
    return (
      <>
        {contextHolder}
        <Modal
          title={renderTitle()}
          centered
          open={modalState}
          onOk={() => closeModal()}
          onCancel={() => closeModal()}
          footer={[]}
          width={1000}
          maskClosable={false}
        >
          <form onSubmit={handleSubmit(onSubmitRegister)}>
            <Grid
              marginY={"20px"}
              marginX={0}
              textAlign={"center"}
              item
              xs={12}
            >
              <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>Name</InputLabel>
              <OutlinedInput
                type="text"
                {...register("name", { required: true })}
                aria-invalid={errors.name ? true : false}
                style={OutlinedInputStyle}
                placeholder="Enter your name"
                fullWidth
              />
              {errors?.name?.message}
            </Grid>
            <Grid
              marginY={"20px"}
              marginX={0}
              textAlign={"center"}
              item
              xs={12}
            >
              <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
                Last name
              </InputLabel>
              <OutlinedInput
                type="text"
                {...register("lastName", { required: true })}
                aria-invalid={errors.lastName ? true : false}
                style={OutlinedInputStyle}
                placeholder="Enter your last name"
                fullWidth
              />
              {errors?.lastName?.message}
            </Grid>
            <Grid
              marginY={"20px"}
              marginX={0}
              textAlign={"center"}
              item
              xs={12}
            >
              <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>Email</InputLabel>
              <OutlinedInput
                {...register("email", { required: true, minLength: 6 })}
                style={OutlinedInputStyle}
                placeholder="Enter your email"
                type="text"
                fullWidth
              />
              {errors?.email?.message}
            </Grid>
            <Grid
              marginY={"20px"}
              marginX={0}
              textAlign={"center"}
              item
              xs={12}
            >
              <InputLabel style={{ marginTop: "0.5rem", marginBottom: "0px", width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
                Role
              </InputLabel>
              <Grid
                item
                xs={12}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Select
                  {...register("role")}
                  displayEmpty
                  fullWidth
                  style={AntSelectorStyle}
                >
                  {roles.map((company) => {
                    return (
                      <MenuItem key={company} value={company}>
                        {dicRole[company]}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Grid>
              {errors?.role?.message}
            </Grid>

            <Grid
              marginY={"20px"}
              marginX={0}
              textAlign={"center"}
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              gap={1}
              item
              xs={12} sm={12} md={12} lg={12}
            >
              <Button
                disabled={loadingStatus}
                onClick={closeModal}
                style={{ ...GrayButton, width: "100%" }}
                htmlType="reset"
              >
                <Typography
                  textTransform={"none"}
                  style={GrayButtonText}
                >
                  Cancel
                </Typography>
              </Button>
              <Button
                disabled={loadingStatus}
                style={{ ...BlueButton, width: "100%" }}
                htmlType="submit"
              >
                <Typography
                  textTransform={"none"}
                  style={BlueButtonText}
                >
                  Save
                </Typography>
              </Button>
            </Grid>
          </form>
        </Modal >
      </>
    );
  }
};
