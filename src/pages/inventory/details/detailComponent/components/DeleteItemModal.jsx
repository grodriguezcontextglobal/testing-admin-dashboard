import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, Modal, notification } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { QuestionIcon } from "../../../../../components/icons/QuestionIcon";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../../styles/global/Subtitle";

const DeleteItemModal = ({
  dataFound,
  openDeleteItemModal,
  setOpenDeleteItemModal,
}) => {
  const companiesQuery = useQuery({
    queryKey: ["locationOptionsPerCompany"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    refetchOnMount: false,
  });
  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInfoInStockCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        item_id: dataFound[0].item_id,
      }),
    refetchOnMount: false,
  });
  const companyInfoQuery = useQuery({
    queryKey: ["companyInfo_employees"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    refetchOnMount: false,
  });
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };
  const [loadingStatus, setLoadingStatus] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      category_name: dataFound[0].category_name,
      cost: dataFound[0].cost,
      brand: dataFound[0].brand,
      descript_item: dataFound[0].descript_item,
      serial_number: dataFound[0].serial_number,
      location: dataFound[0].location,
      main_warehouse: dataFound[0].main_warehouse,
      item_group: dataFound[0].item_group,
      ownership: dataFound[0].ownership,
    },
  });
  useEffect(() => {
    const controller = new AbortController();
    companiesQuery.refetch();
    itemsInInventoryQuery.refetch();
    companyInfoQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [dataFound[0].item_id, openDeleteItemModal]);

  const retrieveItemInfoForEdit = useCallback(() => {
    if (itemsInInventoryQuery.data) {
      setValue(
        "category_name",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.category_name}`
      );
      setValue("cost", `${itemsInInventoryQuery?.data?.data?.items[0]?.cost}`);
      setValue(
        "brand",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.brand}`
      );
      setValue(
        "descript_item",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.descript_item}`
      );
      setValue(
        "serial_number",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.serial_number}`
      );
      setValue(
        "ownership",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.ownership}`
      );
      setValue(
        "main_warehouse",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.main_warehouse}`
      );
      setValue(
        "location",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.location}`
      );
    }
  }, [itemsInInventoryQuery.data]);

  useEffect(() => {
    const controller = new AbortController();
    retrieveItemInfoForEdit();
    return () => {
      controller.abort();
    };
  }, [itemsInInventoryQuery.data]);

  const handleDeleteItem = async () => {
    setLoadingStatus(true);
    try {
      const device_id = itemsInInventoryQuery?.data?.data?.items[0]?.item_id;
      const respAfterDelete = await devitrakApi.post(`/db_item/delete-item`, {
        item_id: device_id,
      });
      if (respAfterDelete.data) {
        const employees = user.companyData.employees;
        for (let data of employees) {
          if (Number(data.role) < 2) {
            const emailNotificationProfile = {
              staff: data.user,
              subject: "Device deleted in company records.",
              message: `The device with serial number ${
                itemsInInventoryQuery?.data?.data?.items[0]?.serial_number
              } was deleted for staff member ${user.name} ${
                user.lastName
              } at Date ${new Date().toString()}`,
              company: user.company,
            };
            await devitrakApi.post(
              "/nodemailer/internal-single-email-notification",
              emailNotificationProfile
            );
          }
        }
        openNotificationWithIcon("Success", "Device was deleted.");
        navigate("/inventory");
      }
    } catch (error) {
      setLoadingStatus(false);
      openNotificationWithIcon("error", "Please try again later.");
    }
  };

  const closeModal = () => {
    setValue("category_name", "");
    setValue("item_group", "");
    setValue("cost", "");
    setValue("brand", "");
    setValue("descript_item", "");
    setValue("ownership", "");
    setValue("serial_number", "");
    return setOpenDeleteItemModal(false);
  };
  const renderTitle = () => {
    return (
      <>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            style={TextFontSize30LineHeight38}
            color={"var(--gray-600, #475467)"}
          >
            Delete one device
          </Typography>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            textTransform={"none"}
            style={TextFontSize20LineHeight30}
            color={"var(--gray-600, #475467)"}
          >
            You will delete this device from your company record. This action
            can not be reversed.
          </Typography>
        </InputLabel>
      </>
    );
  };
  return (
    <Modal
      key={dataFound[0].item_id}
      open={openDeleteItemModal}
      onCancel={() => closeModal()}
      style={{ top: "20dv", zIndex: 30 }}
      width={1000}
      footer={[]}
    >
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        container
      >
        {contextHolder}
        {renderTitle()}
        <form
          style={{
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            display: "flex",
            padding: "24px",
            flexDirection: "column",
            gap: "24px",
            alignSelf: "stretch",
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--gray-100, #F2F4F7)",
          }}
          onSubmit={handleSubmit(handleDeleteItem)}
          className="form"
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "6px", width: "100%" }}>
                <Typography
                  style={{ ...Subtitle, fontWeight: 500 }}
                  fontWeight={500}
                >
                  Category
                </Typography>
              </InputLabel>
              <OutlinedInput
                required
                disabled
                {...register("category_name")}
                style={OutlinedInputStyle}
                fullWidth
              />
              <div
                style={{
                  textAlign: "left",
                  width: "50%",
                }}
              ></div>
            </div>
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  style={{ ...Subtitle, fontWeight: 500 }}
                  fontWeight={500}
                >
                  Device name
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled
                {...register("item_group")}
                style={OutlinedInputStyle}
                fullWidth
              />
            </div>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  style={{ ...Subtitle, fontWeight: 500 }}
                  fontWeight={500}
                >
                  Brand
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled
                {...register("brand")}
                style={OutlinedInputStyle}
                fullWidth
              />
            </div>
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  style={{ ...Subtitle, fontWeight: 500 }}
                  fontWeight={500}
                >
                  Taxable location
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled
                {...register("main_warehouse")}
                style={OutlinedInputStyle}
                fullWidth
              />
            </div>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  style={{ ...Subtitle, fontWeight: 500 }}
                  fontWeight={500}
                >
                  Cost of replace device
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled
                {...register("cost", { disabled: true })}
                style={OutlinedInputStyle}
                startAdornment={
                  <InputAdornment position="start">
                    <Typography
                      style={{ ...Subtitle, fontWeight: 400 }}
                      fontWeight={500}
                    >
                      $
                    </Typography>
                  </InputAdornment>
                }
                fullWidth
              />
            </div>
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  style={{ ...Subtitle, fontWeight: 500 }}
                  fontWeight={500}
                >
                  Serial number
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled
                {...register("serial_number", { disabled: true })}
                style={OutlinedInputStyle}
                fullWidth
              />
            </div>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
            }}
          >
            <InputLabel style={{ width: "100%", marginBottom: "6px" }}>
              <Typography
                style={{ ...Subtitle, fontWeight: 500 }}
                fontWeight={500}
              >
                Description of the device
              </Typography>
            </InputLabel>
            <OutlinedInput
              disabled
              multiline
              minRows={5}
              {...register("descript_item", { disabled: true })}
              fullWidth
              style={{
                borderRadius: "8px",
                backgroundColor: "#fff",
                color: "#000",
                verticalAlign: "center",
                boxShadow: "1px 1px 2px rgba(16, 24, 40, 0.05)",
                outline: "none",
              }}
            />
          </div>
          <Divider />
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ width: "100%" }}>
              <InputLabel style={{ marginBottom: "6px", width: "100%" }}>
                <Typography
                  style={{ ...Subtitle, fontWeight: 500 }}
                  fontWeight={500}
                >
                  Ownership status of item
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled
                {...register("ownership")}
                style={OutlinedInputStyle}
                fullWidth
              />
            </div>
            <div style={{ width: "100%" }}>
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  style={{ ...Subtitle, fontWeight: 500 }}
                  fontWeight={500}
                >
                  Location{" "}
                  <Tooltip title="Where the item is location physically.">
                    <QuestionIcon />
                  </Tooltip>
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled
                {...register("location")}
                style={OutlinedInputStyle}
                fullWidth
              />
            </div>
          </div>
          <Divider />
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <Link to="/inventory">
                <Button
                  onClick={() => closeModal()}
                  disabled={loadingStatus}
                  style={{
                    ...GrayButton,
                    ...CenteringGrid,
                    width: "100%",
                  }}
                >
                  <Icon
                    icon="ri:arrow-go-back-line"
                    color="#344054"
                    width={20}
                    height={20}
                  />
                  &nbsp;
                  <Typography
                    textTransform={"none"}
                    style={{
                      ...GrayButtonText,
                    }}
                  >
                    Go back
                  </Typography>
                </Button>
              </Link>
            </div>
            <div
              style={{
                textAlign: "right",
                width: "50%",
              }}
            >
              <Button
                disabled={loadingStatus}
                type="submit"
                style={{
                  width: "100%",
                  border: `1px solid ${
                    loadingStatus
                      ? "var(--disabled-blue-button)"
                      : "var(--blue-dark-600)"
                  }`,
                  borderRadius: "8px",
                  background: `${
                    loadingStatus
                      ? "var(--disabled-blue-button)"
                      : "var(--blue-dark-600)"
                  }`,
                  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                }}
              >
                <Typography
                  textTransform={"none"}
                  style={{
                    ...DangerButtonText,
                  }}
                >
                  Delete item
                </Typography>
              </Button>
            </div>
          </div>
        </form>
      </Grid>
    </Modal>
  );
};

export default DeleteItemModal;
