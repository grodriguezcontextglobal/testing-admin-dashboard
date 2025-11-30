import {
  Button,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Divider, notification, Select } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import Loading from "../../../../components/animation/Loading";
import { BorderedCloseIcon } from "../../../../components/icons/BorderedCloseIcon";
import { CheckIcon } from "../../../../components/icons/CheckIcon";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import "../../../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import "../../../../styles/global/ant-select.css";
import "../../../../styles/global/reactInput.css";
import LegalDocumentModal from "../../../staff/detail/components/equipment_components/assingmentComponents/components/legalDOcuments/LegalDocumentModal";
import {
  addDeviceToEvent,
  createEvent,
  createEventNoSQL,
  createNewLease,
  transactionDeviceAdded,
  updateDeviceInWarehouse,
  verificationContractStaffMember,
} from "./actions";
import "./style.css";

const AssignmentFromExistingInventory = ({ consumerInfoSqlDb, closeModal }) => {
  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      quantity: 1,
    },
  });
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [checkingSerialNumberInputted, setCheckingSerialNumberInputted] =
    useState(false);
  const [addContracts, setAddContracts] = useState(false);
  const [contractList, setContractList] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const verificationInfo = {};
  const newEventInfo = {};
  // const dateToUse = useMemo(() => formatDate(new Date()), []);
  let dataFound = useRef([]);
  const stampTime = useMemo(() => new Date().toISOString(), []);
  const timeReferenceForEventName = useMemo(() => new Date().toLocaleString(), []);
  const itemsInInventoryQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-group-location-quantity", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        enableAssignFeature: 1,
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 1 * 60 * 100, // 1 minutes
  });
  const queryClient = useQueryClient();

  dataFound.current = itemsInInventoryQuery?.data?.data;
  const optionsToRenderInSelector = () => {
    const result = [];
    const groupedInventory = dataFound.current?.groupedInventory ?? {};

    // Iterate through categories (Category1, Category2, etc.)
    for (const [categoryName, categoryData] of Object.entries(
      groupedInventory
    )) {
      // Iterate through items within each category (Item1, Item2, etc.)
      for (const [itemGroup, itemData] of Object.entries(categoryData)) {
        // Iterate through locations within each item
        for (const [location, quantity] of Object.entries(itemData)) {
          result.push({
            category_name: categoryName,
            item_group: itemGroup,
            location: location,
            total: quantity,
            data: JSON.stringify({
              category_name: categoryName,
              item_group: itemGroup,
              location: location,
              quantity: quantity,
            }),
          });
        }
      }
    }

    return result;
  };
  const onChange = async (value) => {
    const optionRendering = JSON.parse(value);
    const fetchSelectedItem = await devitrakApi.post(
      "/db_event/inventory-based-on-submitted-parameters",
      {
        query: `SELECT 
        serial_number
        FROM item_inv 
        WHERE item_group = ? AND category_name = ? AND company_id = ? And location = ? And warehouse = ?
        ORDER BY serial_number ASC`,
        values: [
          optionRendering.item_group,
          optionRendering.category_name,
          user.sqlInfo.company_id,
          optionRendering.location,
          1,
        ],
      }
    );
    if (fetchSelectedItem.data) {
      if (fetchSelectedItem.data.result.length === 1) {
        setValue(
          "startingNumber",
          fetchSelectedItem.data.result[0].serial_number
        );
        return setValueItemSelected({
          ...optionRendering,
          min_serial_number: fetchSelectedItem.data.result[0].serial_number,
          max_serial_number: fetchSelectedItem.data.result.at(-1).serial_number,
          data: JSON.stringify(fetchSelectedItem.data.result),
          quantity: 0,
        });
      }
      setValue(
        "startingNumber",
        fetchSelectedItem.data.result[0].serial_number
      );
      return setValueItemSelected({
        ...optionRendering,
        min_serial_number: fetchSelectedItem.data.result[0].serial_number,
        max_serial_number: fetchSelectedItem.data.result.at(-1).serial_number,
        data: JSON.stringify(fetchSelectedItem.data.result),
        quantity: 0,
      });
    }
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = useCallback(
    (msg) => {
      api.open({
        message: msg,
      });
    },
    [api]
  );
  const reference = useRef(null);

  const option1 = async (props) => {
    try {
      await createEvent({
        template: props.template,
        user,
        consumerInfoSqlDb,
        newEventInfo,
        customer,
        timeReferenceForEventName,
      });
      const deviceInfo = props.selectedData; //*array of existing devices in sql db
      if (newEventInfo.insertId && deviceInfo.length > 0) {
        await updateDeviceInWarehouse({
          item_group: deviceInfo[0].item_group,
          category_name: deviceInfo[0].category_name,
          data: [...deviceInfo.map((item) => item.serial_number)],
          user,
        });
        await verificationContractStaffMember({
          customer,
          user,
          contractList,
          stampTime,
          verificationInfo,
        });
        await createNewLease({
          template: props.template,
          deviceInfo,
          user,
          consumerInfoSqlDb,
          verification_id: verificationInfo._id,
          timeReferenceForEventName
        }); 
        await createEventNoSQL({
          template: props.template,
          deviceInfo: deviceInfo,
          quantity: props.quantity,
          customer,
          user,
          verificationInfo,
          contractList,
          addContracts,
          stampTime,
          timeReferenceForEventName
        });
        await addDeviceToEvent({
          item_group: deviceInfo[0].item_group,
          category_name: deviceInfo[0].category_name,
          min_serial_number: deviceInfo.at(-1).serial_number,
          quantity: props.quantity,
          selectedList: deviceInfo,
          newEventInfo,
          queryClient,
          timeReferenceForEventName
        });
        
        await transactionDeviceAdded({
          deviceInfo: deviceInfo,
          event_id: newEventInfo.insertId,
          qty: props.quantity,
          nanoid,
          reference,
          customer,
          verificationInfo,
          user,
          timeReferenceForEventName
        });
        openNotificationWithIcon("Equipment assigned to consumer.");
        return closeModal();
      }
    } catch (error) {
      alert("Error assigning equipment to consumer. Please try again later.");
    }
  };
  const assignDeviceToStaffMember = async (data) => {
    try {
      const template = {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
      };
      setLoadingStatus(true);
      if (data.startingNumber?.length > 0) {
        const data_serial_numbers = JSON.parse(valueItemSelected.data);
        if (data_serial_numbers.length > 0) {
          const index = data_serial_numbers.findIndex(
            (item) => item.serial_number === data.startingNumber
          );
          if (index > -1) {
            const selectedData = data_serial_numbers.slice(
              index,
              index + Number(data.quantity)
            );
            const gettingAllInfo = await devitrakApi.post(
              "/db_event/inventory-based-on-submitted-parameters",
              {
                query: `SELECT * FROM item_inv 
              WHERE item_group = ? AND category_name = ? AND company_id = ? And location = ? AND warehouse = ? And serial_number in (${selectedData
                .map((item) => `'${item.serial_number}'`)
                .join(",")})
              `,
                values: [
                  valueItemSelected.item_group,
                  valueItemSelected.category_name,
                  user.sqlInfo.company_id,
                  valueItemSelected.location,
                  1,
                ],
              }
            );
            await option1({
              groupingType: valueItemSelected.item_group,
              template: template,
              quantity: data.quantity,
              selectedData: gettingAllInfo.data.result,
            });
          }
        }
      }
    } catch (error) {
      openNotificationWithIcon(`${error.message}`);
    } finally {
      setLoadingStatus(false);
    }
  };
  const renderTitle = () => {
    return (
      <>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <p
            style={{
              ...TextFontSize30LineHeight38,
              textAlign: "left",
              color: "var(--gray600, #475467)",
            }}
          >
            Assign a device to consumer from existing inventory.
          </p>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              color: "var(--gray600, #475467)",
              textAlign: "left",
              textTransform: "none",
            }}
          >
            You can enter all the details manually or use a scanner to enter the
            serial number.
          </p>
        </InputLabel>
      </>
    );
  };
  useEffect(() => {
    const checkingSerialNumberInputted = async () => {
      const data = JSON.parse(valueItemSelected?.data);
      if (watch("startingNumber").length === data[0].serial_number.length) {
        setCheckingSerialNumberInputted(
          data.some((item) => item.serial_number === watch("startingNumber"))
        );
      }
    };
    checkingSerialNumberInputted();
  }, [watch("startingNumber"), valueItemSelected]);

  return (
    <>
      {itemsInInventoryQuery.isLoading ? (
        <div style={CenteringGrid}>
          <Loading />
        </div>
      ) : (
        <Grid
          container
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          marginY={2}
          key={"settingUp-deviceList-event"}
        >
          {contextHolder}
          {renderTitle()}
          <form
            style={{ width: "100%" }}
            onSubmit={handleSubmit(assignDeviceToStaffMember)}
          >
            <Grid
              style={{
                borderRadius: "8px",
                border: "1px solid var(--gray-300, #D0D5DD)",
                background: "var(--gray-100, #F2F4F7)",
                padding: "24px",
                width: "100%",
              }}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <InputLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                <p style={Subtitle}>
                  Location where device is going to be used.
                </p>
              </InputLabel>
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                  margin: "0 0 20px 0",
                  gap: "1rem",
                }}
              >
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>Street</p>
                  </InputLabel>
                  <OutlinedInput
                    {...register("street")}
                    disabled={loadingStatus}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    fullWidth
                    required
                  />
                </div>
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>City</p>
                  </InputLabel>
                  <OutlinedInput
                    disabled={loadingStatus}
                    {...register("city")}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    required
                    fullWidth
                  />
                </div>
              </div>
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                  margin: "0 0 20px 0",
                  gap: "1rem",
                }}
              >
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>State</p>
                  </InputLabel>
                  <OutlinedInput
                    {...register("state")}
                    disabled={loadingStatus}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    required
                    fullWidth
                  />
                </div>
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>Zip</p>
                  </InputLabel>
                  <OutlinedInput
                    disabled={loadingStatus}
                    {...register("zip")}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    required
                    fullWidth
                  />
                </div>
              </div>
              <LegalDocumentModal
                addContracts={addContracts}
                setAddContracts={setAddContracts}
                setValue={setValue}
                register={register}
                loadingStatus={loadingStatus}
                profile={customer}
                selectedDocuments={contractList}
                setSelectedDocuments={setContractList}
              />
              <Divider />
              <InputLabel
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    ...TextFontSize20LineHeight30,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Device
                </p>
              </InputLabel>
              <div
                style={{
                  width: "100%",
                }}
              >
                <Grid
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  marginY={2}
                  gap={2}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <Grid
                    style={{ alignSelf: "baseline" }}
                    item
                    xs={6}
                    sm={6}
                    md={11}
                    lg={11}
                  >
                    <InputLabel
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      <p
                        style={{
                          ...TextFontSize20LineHeight30,
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#000",
                          textTransform: "none",
                        }}
                      >
                        Select from existing category
                      </p>
                    </InputLabel>
                    <Select
                      className="custom-autocomplete"
                      showSearch
                      placeholder="Search item to add to inventory."
                      optionFilterProp="children"
                      style={{ ...AntSelectorStyle, width: "100%" }}
                      onChange={onChange}
                      options={optionsToRenderInSelector().map((item) => {
                        return {
                          label: (
                            <Typography
                              textTransform={"capitalize"}
                              style={{
                                ...Subtitle,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <span style={{ width: "50%" }}>
                                <span style={{ fontWeight: 700 }}>
                                  {item.category_name}
                                </span>{" "}
                                {item.item_group}
                              </span>
                              <span style={{ textAlign: "left", width: "30%" }}>
                                Location:{" "}
                                <span style={{ fontWeight: 700 }}>
                                  {item.location}
                                </span>
                              </span>
                              <span
                                style={{ textAlign: "right", width: "20%" }}
                              >
                                Total available: {item.total}
                              </span>
                            </Typography>
                          ),
                          value: item.data,
                        };
                      })}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={6}
                    sm={6}
                    md={1}
                    lg={1}
                    style={{ alignSelf: "baseline" }}
                  >
                    <InputLabel
                      style={{ marginBottom: "0.2rem", width: "100%" }}
                    >
                      <p style={Subtitle}>Quantity</p>
                    </InputLabel>
                    <OutlinedInput
                      disabled={loadingStatus}
                      required
                      {...register("quantity")}
                      style={{
                        ...OutlinedInputStyle,
                        width: "100%",
                      }}
                      placeholder="e.g. 0"
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Grid
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  marginY={2}
                  gap={2}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                    style={{ alignSelf: "baseline" }}
                  >
                    <InputLabel
                      style={{ marginBottom: "0.2rem", width: "100%" }}
                    >
                      <p style={Subtitle}>
                        Starting serial number | Current range{" "}
                        <strong>
                          (starting: {valueItemSelected.min_serial_number ?? 0}{" "}
                          ending: {valueItemSelected.max_serial_number ?? 0})
                        </strong>
                      </p>
                    </InputLabel>
                    <OutlinedInput
                      disabled={
                        loadingStatus ||
                        valueItemSelected.max_serial_number ===
                          valueItemSelected.min_serial_number
                      }
                      required
                      {...register("startingNumber", {
                        required: true,
                        message: "Starting serial number is required",
                      })}
                      style={{
                        ...OutlinedInputStyle,
                        width: "100%",
                      }}
                      placeholder={`Selected category serial numbers start: ${valueItemSelected.min_serial_number} end: ${valueItemSelected.max_serial_number}`}
                      fullWidth
                      endAdornment={
                        <InputAdornment position="end">
                          {checkingSerialNumberInputted ? (
                            <CheckIcon />
                          ) : (
                            <BorderedCloseIcon />
                          )}
                        </InputAdornment>
                      }
                    />
                  </Grid>
                </Grid>
              </div>
            </Grid>
            <Grid
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
              }}
              marginY={"0.5rem"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <Button
                onClick={() => closeModal()}
                style={{ ...GrayButton, ...CenteringGrid, width: "100%" }}
              >
                <p style={{ ...GrayButtonText, textTransform: "none" }}>
                  Go back
                </p>
              </Button>
              <BlueButtonComponent
                disabled={
                  watch("startingNumber")?.length === 0 ||
                  !watch("startingNumber") ||
                  loadingStatus ||
                  !checkingSerialNumberInputted
                }
                buttonType="submit"
                loadingState={loadingStatus}
                title={"Assign equipment"}
                func={() => null}
                styles={{ ...CenteringGrid, width: "100%" }}
              />
            </Grid>
          </form>
        </Grid>
      )}
    </>
  );
};

export default AssignmentFromExistingInventory;
