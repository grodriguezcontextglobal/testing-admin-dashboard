import {
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Divider } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
  notifyStatus,
  useStatusNotification,
} from "../../../../../components/notification/alerts/useStatusNotification";
import { QuestionIcon } from "../../../../../components/icons/QuestionIcon";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import ReusableCard from "../../../../../components/UX/cards/ReusableCard";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import { deviceProfileKeys } from "../../deviceProfile/hooks/useDeviceProfile";
import {
  inventoryCacheKeys,
  invalidateInventoryQueries,
} from "../../../utils/inventoryQueryKeys";

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
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();
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
        `${itemsInInventoryQuery?.data?.data?.items[0]?.category_name}`,
      );
      setValue("cost", `${itemsInInventoryQuery?.data?.data?.items[0]?.cost}`);
      setValue(
        "brand",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.brand}`,
      );
      setValue(
        "descript_item",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.descript_item}`,
      );
      setValue(
        "serial_number",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.serial_number}`,
      );
      setValue(
        "ownership",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.ownership}`,
      );
      setValue(
        "main_warehouse",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.main_warehouse}`,
      );
      setValue(
        "location",
        `${itemsInInventoryQuery?.data?.data?.items[0]?.location}`,
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

  /**
   * Everything that still holds the deleted item.
   *
   * This step did not exist: the modal deleted the item and navigated straight
   * to /inventory, which renders from cache. `companyHasInventoryQuery` caches
   * for five minutes and decides both the tab and the total, so the item stayed
   * on the page — with the old count beside it — until the cache expired. The
   * backend response cache is cleared first: invalidating the client queries
   * while the server still answers from its own cache only re-reads the item
   * that was just deleted.
   */
  const refreshInventoryAfterDelete = async (itemId) => {
    try {
      await Promise.all(
        inventoryCacheKeys({ companyMongoId: user.companyData.id }).map((key) =>
          clearCacheMemory(key),
        ),
      );
      await invalidateInventoryQueries(queryClient, {
        companyId: user.sqlInfo.company_id,
      });
      // The item is gone, so its profile queries are dropped rather than marked
      // stale — there is nothing left to refetch.
      queryClient.removeQueries({
        queryKey: deviceProfileKeys.tracking(itemId),
        exact: true,
      });
      queryClient.removeQueries({
        queryKey: deviceProfileKeys.item(itemId),
        exact: true,
      });
      queryClient.removeQueries({
        queryKey: ["ItemsInfoInStockCheckingQuery"],
        exact: true,
      });
    } catch (error) {
      // The item is already deleted. A failed cache refresh must not be
      // reported as a failed delete.
    }
  };

  const notifyStaffOfDeletion = async (item) => {
    try {
      // Legacy numeric role, kept as-is: changing who gets the email is not a
      // cache fix. Worth migrating to resolveRoleType separately.
      const employees = user.companyData.employees ?? [];
      await Promise.all(
        employees
          .filter((data) => Number(data.role) < 2)
          .map((data) =>
            devitrakApi.post("/nodemailer/internal-single-email-notification", {
              staff: data.user,
              subject: "Device deleted in company records.",
              message: `The device with serial number ${
                item?.serial_number
              } was deleted for staff member ${user.name} ${
                user.lastName
              } at Date ${new Date().toString()}`,
              company: user.company,
            }),
          ),
      );
    } catch (error) {
      // Same reasoning: the record is gone whether or not the notice sent. This
      // used to throw into the delete handler's catch, so a bounced internal
      // email reported the deletion as failed.
    }
  };

  const handleDeleteItem = async () => {
    const item = itemsInInventoryQuery?.data?.data?.items?.[0];
    const device_id = item?.item_id ?? dataFound[0].item_id;

    if (!device_id) {
      return notify("error", "This item record is incomplete. Refresh and try again.");
    }

    setLoadingStatus(true);
    try {
      const respAfterDelete = await devitrakApi.post(`/db_item/delete-item`, {
        item_id: device_id,
        company_id: user.sqlInfo.company_id,
      });

      // Was `if (respAfterDelete.data)`, which is true for any 200 body — a
      // rejected delete still said "Device was deleted." and navigated away,
      // which is indistinguishable from a stale cache.
      if (respAfterDelete.data?.ok === false) {
        return notify(
          "error",
          respAfterDelete.data?.msg ?? "The item was not deleted.",
        );
      }

      await refreshInventoryAfterDelete(device_id);
      await notifyStaffOfDeletion(item ?? dataFound[0]);

      // Static notification: `notify` renders through this modal's
      // contextHolder, and navigating away unmounts it before it can be read.
      notifyStatus("success", "Device was deleted.");
      return navigate("/inventory");
    } catch (error) {
      notify("error", "The item was not deleted. Please try again later.");
    } finally {
      setLoadingStatus(false);
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
  const modalBodyUI = () => {
    return (
      <ReusableCard>
        {
          <>
            {contextHolder}
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
                <GrayButtonComponent
                  title="Go back"
                  buttonType="button"
                  func={() => closeModal()}
                  styles={{ width: "100%" }}
                />
                <BlueButtonComponent
                  buttonType="submit"
                  title="Delete item"
                  loadingState={loadingStatus}
                  styles={{ width: "100%" }}
                />
              </div>
            </form>
          </>
        }
      </ReusableCard>
    );
  };
  return (
    <ModalUX
      key={dataFound[0].item_id}
      title={renderTitle()}
      body={modalBodyUI()}
      openDialog={openDeleteItemModal}
      closeModal={() => closeModal()}
      width={1000}
    />
    // <Modal
    //   key={dataFound[0].item_id}
    //   open={openDeleteItemModal}
    //   onCancel={() => closeModal()}
    //   style={{ top: "20dv", zIndex: 30 }}
    //   width={1000}
    //   footer={[]}
    // >
    //   <Grid
    //     display={"flex"}
    //     justifyContent={"center"}
    //     alignItems={"center"}
    //     container
    //   ></Grid>
    // </Modal>
  );
};

export default DeleteItemModal;
