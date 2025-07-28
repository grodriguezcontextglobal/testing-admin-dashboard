import { Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Divider, notification, Select } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import Loading from "../../../../../../components/animation/Loading";
import { checkArray } from "../../../../../../components/utils/checkArray";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../../styles/global/TextFontSize30LineHeight38";
import { formatDate } from "../../../../../inventory/utils/dateFormat";
import LegalDocumentModal from "./components/legalDOcuments/LegalDocumentModal";
const AssignmentFromExistingInventory = () => {
  const { register, watch, handleSubmit, setValue } = useForm({
    defaultValues: {
      quantity: 1,
    },
  });
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [addContracts, setAddContracts] = useState(false);
  const [contractList, setContractList] = useState([]);
  console.log(contractList);
  const [selectedItem, setSelectedItem] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const newEventInfo = {};
  let dataFound = useRef([]);
  const navigate = useNavigate();
  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        warehouse: true,
      }),
    refetchOnMount: false,
  });
  const staffMemberQuery = useQuery({
    queryKey: ["staffMemberInfo"],
    queryFn: () =>
      devitrakApi.post("/db_staff/consulting-member", {
        email: profile.email,
      }),
    refetchOnMount: false,
  });
  const queryClient = useQueryClient();
  useEffect(() => {
    const controller = new AbortController();
    itemsInInventoryQuery.refetch();
    staffMemberQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    return () => {
      controller.abort();
    };
  }, [itemsInInventoryQuery.data, dataFound.current?.length]);
  dataFound.current = itemsInInventoryQuery?.data?.data?.items;
  const optionsToRenderInSelector = () => {
    const checkLocation = new Map();
    const dataToIterate = dataFound.current ?? [];
    const groupingByCategories = groupBy(dataToIterate, "category_name");
    for (let [key, value] of Object.entries(groupingByCategories)) {
      groupingByCategories[key] = groupBy(value, "item_group");
      for (let [key2, value2] of Object.entries(groupingByCategories[key])) {
        const groupingByLocaiton = groupBy(value2, "location");
        for (let [key3, value3] of Object.entries(groupingByLocaiton)) {
          checkLocation.set(`${key}-${key2}-${key3}`, {
            category_name: key,
            item_group: key2,
            location: key3,
            total: value3.length,
            data: JSON.stringify(value3),
          });
        }
      }
    }
    const result = new Set();
    for (let [, value] of checkLocation) {
      result.add(value);
    }
    return Array.from(result);
  };
  const onChange = (value) => {
    const optionRendering = JSON.parse(value);
    setValueItemSelected(optionRendering);
  };
  const substractingRangesSelectedItem = () => {
    const gettingValues = new Set();
    if (valueItemSelected.length > 0) {
      for (let data of valueItemSelected) {
        gettingValues.add(String(data.serial_number));
      }
      const toArray = Array.from(gettingValues);
      return {
        min: toArray[0],
        max: toArray.at(-1),
      };
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
  const handleAddingNewItemToInventoryEvent = (data) => {
    setSelectedItem([
      ...selectedItem,
      { ...data, item_group: valueItemSelected[0].item_group },
    ]);
    setValue("startingNumber", "");
    setValue("quantity", 1);
    return null;
  };
  const updateDeviceInWarehouse = async (props) => {
    await devitrakApi.post("/db_item/item-out-warehouse", {
      warehouse: 0,
      company_id: user.sqlInfo.company_id,
      item_group: props.item_group,
      category_name: props.category_name,
      data: props.data,
    });
  };
  const createNewLease = async (props) => {
    const staffMember = staffMemberQuery.data.data.member;
    for (let data of props.deviceInfo) {
      await devitrakApi.post("/db_lease/new-lease", {
        staff_admin_id: user.sqlMemberInfo.staff_id,
        company_id: user.sqlInfo.company_id,
        subscription_expected_return_data: formatDate(new Date()),
        location: `${props.street} ${props.city} ${props.state} ${props.zip}`,
        staff_member_id: staffMember.at(-1).staff_id,
        device_id: data.item_id,
      });
    }
  };
  const createEvent = async (props) => {
    try {
      const respoNewEvent = await devitrakApi.post("/db_event/new_event", {
        event_name: `${profile.firstName} ${profile.lastName} / ${
          profile.email
        } / ${new Date().toLocaleDateString()}`,
        venue_name: `${profile.firstName} ${profile.lastName} / ${
          profile.email
        } / ${new Date().toLocaleDateString()}`,
        street_address: props.street,
        city_address: props.city,
        state_address: props.state,
        zip_address: props.zip,
        email_company: profile.email,
        phone_number: profile.adminUserInfo.phone,
        company_assigned_event_id: user.sqlInfo.company_id,
        contact_name: `${user.name} ${user.lastName}`,
      });
      if (respoNewEvent.data) {
        return (newEventInfo.insertId = respoNewEvent.data.consumer.insertId);
      }
    } catch (error) {
      return null;
    }
  };

  const createDeviceRecordInNoSQLDatabase = async (props) => {
    const db = props.deviceInfo;
    let items = [];
    for (let index = 0; index < db.length; index++) {
      await devitrakApi.post("/receiver/receivers-pool", {
        device: db[index].serial_number,
        status: "Operational",
        activity: true,
        comment: "No comment",
        eventSelected: `${profile.firstName} ${profile.lastName} / ${
          profile.email
        } / ${new Date().toLocaleDateString()}`,
        provider: user.company,
        type: db[index].item_group,
        company: user.companyData.id,
      });
      items.push({
        serial_number: db[index].serial_number,
        type: db[index].item_group,
      });
    }
    {
      addContracts &&
        (await emailContractToStaffMember({
          company_name: user.companyData.name,
          emailAdmin: user.email,
          staff: {
            name: profile.name,
            email: profile.email,
          },
          contractList: props.addContracts,
          items: items,
        }));
    }
    return null;
  };

  const addDeviceToEvent = async (props) => {
    for (let data of props) {
      for (let item of data.selectedList) {
        await devitrakApi.post("/db_event/event_device_directly", {
          event_id: newEventInfo.insertId,
          item_id: item.item_id,
        });
      }
    }
    queryClient.invalidateQueries({
      queryKey: ["staffMemberInfo"],
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: ["imagePerItemList"],
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: ["ItemsInventoryCheckingQuery"],
      exact: true,
    });
  };

  const createEventNoSQL = async (props) => {
    const eventName = `${profile.firstName} ${profile.lastName} / ${
      profile.email
    } / ${new Date().toLocaleDateString()}`;
    const leasedTime = new Date();
    leasedTime.setFullYear(leasedTime.getFullYear() + 2);
    const eventLink = eventName.replace(/ /g, "%20");
    const eventFormat = {
      user: user.email,
      company: user.company,
      subscription: [],
      eventInfoDetail: {
        eventName: eventName,
        eventLocation: `${props.state}, ${props.zip}`,
        address: `${props.street}, ${props.city} ${props.state}, ${props.zip}`,
        building: eventName,
        floor: "",
        merchant: false,
        dateBegin: new Date().toString(),
        dateEnd: leasedTime.toString(),
        dateBeginTime: new Date().getTime(),
      },
      staff: {
        adminUser: [
          {
            firstName: user.name,
            lastName: user.lastName,
            email: user.email,
            role: "Administrator",
          },
        ],
        headsetAttendees: [],
      },
      deviceSetup: [
        {
          category: props.deviceInfo[0].category_name,
          group: props.deviceInfo[0].item_group,
          value: props.deviceInfo[0].cost,
          description: props.deviceInfo[0].descript_item,
          company: props.deviceInfo[0].company_id,
          ownership: props.deviceInfo[0].ownership,
          createdBy: user.email,
          key: props.deviceInfo[0].item_id,
          dateCreated: props.deviceInfo[0].create_at,
          resume: props.deviceInfo[0].descript_item,
          existing: true,
          quantity: props.quantity,
          consumerUses: false,
          startingNumber: props.deviceInfo[0].serial_number,
          endingNumber: props.deviceInfo.at(-1).serial_number,
        },
      ],
      extraServicesNeeded: false,
      extraServices: [],
      active: true,
      contactInfo: {
        name: `${user.name} ${user.lastName}`,
        phone: [user.phone],
        email: user.email,
      },
      qrCodeLink: `https://app.devitrak.net/?event=${eventLink}&company=${user.companyData.id}`,
      type: "lease",
      company_id: user.companyData.id,
    };
    const newEventInfo = await devitrakApi.post(
      "/event/create-event",
      eventFormat
    );
    if (newEventInfo.data.ok) {
      const eventId = checkArray(newEventInfo.data.event);
      await devitrakApi.patch(`/event/edit-event/${eventId.id}`, {
        qrCodeLink: `https://app.devitrak.net/?event=${eventId.id}&company=${user.companyData.id}`,
      });
      await createDeviceRecordInNoSQLDatabase({
        deviceInfo: props.deviceInfo,
        event_id: eventId.id,
      });
    }
  };

  const option1 = async (props) => {
    await createEvent(props.template);
    const deviceInfo = props.selectedData; //*array of existing devices in sql db
    if (newEventInfo.insertId && deviceInfo.length > 0) {
      await updateDeviceInWarehouse({
        item_group: deviceInfo[0].item_group,
        category_name: deviceInfo[0].category_name,
        data: [...deviceInfo.map((item) => item.serial_number)],
      });
      await createNewLease({ ...props.template, deviceInfo });
      await createEventNoSQL({
        ...props.template,
        quantity: props.quantity,
        deviceInfo,
      });
      await addDeviceToEvent([
        {
          item_group: deviceInfo[0].item_group,
          category_name: deviceInfo[0].category_name,
          min_serial_number: deviceInfo.at(-1).serial_number,
          quantity: props.quantity,
          selectedList: deviceInfo,
        },
      ]);
      openNotificationWithIcon("Equipment assigned to staff member.");
      setLoadingStatus(false);
      navigate(`/staff/${profile.adminUserInfo._id}/main`);
    }
  };

  const emailContractToStaffMember = async (props) => {
    await devitrakApi.post("/nodemailer/liability-contract-email-notification", {
      company_name: props.company_name,
      email_admin: props.emailAdmin,
      staff: {
        name: props.staff.name,
        email: props.staff.email,
      },
      contract_list: props.contractList,
      subject: "Device Liability Contract",
      items: props.items,
    });
  };
  const assignDeviceToStaffMember = async () => {
    const template = {
      street: watch("street"),
      city: watch("city"),
      state: watch("state"),
      zip: watch("zip"),
    };
    setLoadingStatus(true);
    const groupingType = groupBy(dataFound.current, "item_group");
    if (selectedItem.length === 0 && watch("startingNumber")?.length > 0) {
      const data = groupingType[valueItemSelected[0]?.item_group];
      if (data.length > 0) {
        const index = data.findIndex(
          (item) => item.serial_number === watch("startingNumber")
        );
        if (index > -1) {
          const selectedData = data.slice(
            index,
            index + Number(watch("quantity"))
          );
          await option1({
            groupingType: groupingType,
            template: template,
            quantity: watch("quantity"),
            selectedData,
          });
        }
      }
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
            Assign a device to staff member from existing inventory.
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

  return (
    <>
      {itemsInInventoryQuery.isLoading || staffMemberQuery.isLoading ? (
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
              <p style={Subtitle}>Location where device is going to be used.</p>
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
              profile={profile}
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
            <form
              onSubmit={handleSubmit(handleAddingNewItemToInventoryEvent)}
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
                            <span style={{ textAlign: "right", width: "20%" }}>
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
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
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
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p style={Subtitle}>Starting serial number</p>
                  </InputLabel>
                  <OutlinedInput
                    disabled={loadingStatus}
                    required
                    {...register("startingNumber")}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    placeholder={`Selected category serial numbers start: ${
                      substractingRangesSelectedItem()?.min
                    } end: ${substractingRangesSelectedItem()?.max}`}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </form>
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
              onClick={() =>
                navigate(`/staff/${profile.adminUserInfo.id}/main`)
              }
              style={{ ...GrayButton, ...CenteringGrid, width: "100%" }}
            >
              <p style={{ ...GrayButtonText, textTransform: "none" }}>
                Go back
              </p>
            </Button>
            <Button
              Loading={loadingStatus}
              onClick={() => assignDeviceToStaffMember()}
              style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
            >
              <p style={BlueButtonText}>Assign equipment</p>
            </Button>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default AssignmentFromExistingInventory;

AssignmentFromExistingInventory.propTypes = {
  item_group: PropTypes.string,
  startingNumber: PropTypes.string,
  quantity: PropTypes.string,
  deviceInfo: PropTypes.string,
  street: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  zip: PropTypes.string,
  template: PropTypes.object,
  groupingType: PropTypes.string,
};
