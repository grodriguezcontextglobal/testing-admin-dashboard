import { Button, Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Select, Space, Tag, notification } from "antd";
import _ from 'lodash';
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { CheckIcon, PlusIcon } from "../../../../../components/icons/Icons";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import "../../../../../styles/global/ant-select.css";
import { formatDate } from "../../../../inventory/utils/dateFormat";
const Assignment = () => {
    const {
        register,
        watch,
        handleSubmit,
        setValue,
    } = useForm({
        defaultValues: {
            quantity: 1,
        }
    });
    const { user } = useSelector((state) => state.admin);
    const { profile } = useSelector((state) => state.staffDetail);
    const [valueItemSelected, setValueItemSelected] = useState({});
    const [selectedItem, setSelectedItem] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const newEventInfo = {}
    let dataFound = useRef([])
    const navigate = useNavigate()
    const itemsInInventoryQuery = useQuery({
        queryKey: ['ItemsInventoryCheckingQuery'],
        queryFn: () => devitrakApi.post("/db_item/consulting-item", {
            company: user.company,
            warehouse: true
        }),
        enabled: false,
        refetchOnMount: false
    })
    const staffMemberQuery = useQuery({
        queryKey: ['staffMemberInfo'],
        queryFn: () => devitrakApi.post("/db_staff/consulting-member", {
            email: profile.email
        }),
        enabled: false,
        refetchOnMount: false
    })

    useEffect(() => {
        const controller = new AbortController()
        itemsInInventoryQuery.refetch()
        staffMemberQuery.refetch()
        return () => {
            controller.abort()
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        return () => {
            controller.abort()
        }
    }, [itemsInInventoryQuery.data, dataFound.current?.length])
    dataFound.current = itemsInInventoryQuery?.data?.data?.items

    const groupingItemByCategoriesToRenderThemInSelector = () => {
        const result = new Map()
        const dataToIterate = dataFound.current ?? []
        for (let data of dataToIterate) {
            if (!result.has(data.category_name)) {
                result.set(data.category_name, [data])
            } else {
                result.set(data.category_name, [...result.get(data.category_name), data])
            }
        }
        return result
    }
    const optionsToRenderInSelector = () => {
        const result = new Set()
        for (let [, value] of groupingItemByCategoriesToRenderThemInSelector()) {
            result.add(value)
        }
        const checkLocation = new Map()
        for (let data of Array.from(result)) {
            for (let item of data) {
                if (!checkLocation.has(`${item.category_name}-${item.item_group}-${item.location}`)) {
                    checkLocation.set(`${item.category_name}-${item.item_group}-${item.location}`, [item])
                } else {
                    checkLocation.set(`${item.category_name}-${item.item_group}-${item.location}`, [...checkLocation.get(`${item.category_name}-${item.item_group}-${item.location}`), item])
                }
            }
        }
        let finalResultAfterSortValueByLocation = []
        for (const [, value] of checkLocation) {
            finalResultAfterSortValueByLocation = [...finalResultAfterSortValueByLocation, value]
        }
        return finalResultAfterSortValueByLocation
    }

    const onChange = (value) => {
        const optionRendering = JSON.parse(value);
        setValueItemSelected(optionRendering);
    };

    const substractingRangesSelectedItem = () => {
        const gettingValues = new Set()
        if (valueItemSelected.length > 0) {
            for (let data of valueItemSelected) {
                gettingValues.add(Number(data.serial_number))
            }
            const toArray = Array.from(gettingValues)
            const maxRange = Math.max(...toArray)
            const minRange = Math.min(...toArray)
            return {
                min: String(minRange).padStart(valueItemSelected[0].serial_number?.length, '0') ?? 0,
                max: String(maxRange).padStart(valueItemSelected[0].serial_number?.length, '0') ?? 0
            }
        }
    }

    const removeItemSelected = (item) => {
        const filter = selectedItem.filter((_, index) => index !== item);
        return setSelectedItem(filter);
    };
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (msg) => {
        api.open({
            message: msg,
        });
    };
    const handleAddingNewItemToInventoryEvent = (data) => {
        setSelectedItem([...selectedItem, { ...data, item_group: valueItemSelected[0].item_group }])
        setValue('startingNumber', '')
        setValue('quantity', 1)
        return null;
    }
    const updateDeviceInWarehouse = async (props) => {
        await devitrakApi.post('/db_item/item-out-warehouse', {
            warehouse: false,
            company: user.company,
            item_group: props.item_group,
            min_serial_number: props.startingNumber,
            max_serial_number: props.endingNumber
        })
    }

    const createNewLease = async (props) => {
        const staffMember = staffMemberQuery.data.data.member
        for (let data of props.deviceInfo) {
            await devitrakApi.post('/db_lease/new-lease', {
                staff_admin_id: user.sqlMemberInfo.staff_id,
                company_id: user.sqlInfo.company_id,
                subscription_expected_return_data: formatDate(new Date()),
                location: `${props.street} ${props.city} ${props.state} ${props.zip}`,
                staff_member_id: staffMember.at(-1).staff_id,
                device_id: data.item_id
            })
        }
    }
    const createEvent = async (props) => {
        try {
            const respoNewEvent = await devitrakApi.post('/db_event/new_event', {
                event_name: `Leased equipment: ${profile.firstName} ${profile.lastName} / email:${profile.email} / ${new Date().toLocaleDateString()}`,
                venue_name: `Leased equipment: ${profile.firstName} ${profile.lastName} / email:${profile.email} / ${new Date().toLocaleDateString()}`,
                street_address: props.street,
                city_address: props.city,
                state_address: props.state,
                zip_address: props.zip,
                email_company: profile.email,
                phone_number: profile.adminUserInfo.phone,
                company_assigned_event_id: user.sqlInfo.company_id,
                contact_name: `${user.name} ${user.lastName}`
            })
            if (respoNewEvent.data) {
                return newEventInfo.insertId = respoNewEvent.data.consumer.insertId
            }
        } catch (error) {
            console.log("🚀 ~ createEvent ~ error:", error)
        }
    }

    const addDeviceToEvent = async (props) => {
        for (let data of props) {
            await devitrakApi.post('/db_event/event_device', {
                event_id: newEventInfo.insertId, item_group: data.item_group, category_name: data.category_name, min_serial_number: data.min_serial_number, max_serial_number: data.max_serial_number
            })
        }
    }

    const option1 = async (props) => {
        await createEvent(props.template)
        const indexStart = props.groupingType[valueItemSelected[0]?.item_group].findIndex(element => element.serial_number == watch('startingNumber'))
        const indexEnd = indexStart + (Number(watch('quantity')))
        const data = props.groupingType[valueItemSelected[0]?.item_group]?.slice(indexStart, indexEnd)
        const deviceInfo = data //*array of existing devices in sql db
        if (newEventInfo.insertId) {
            await updateDeviceInWarehouse({ item_group: deviceInfo[0].item_group, startingNumber: deviceInfo[0].serial_number, endingNumber: deviceInfo.at(-1).serial_number })
            await createNewLease({ ...props.template, deviceInfo })
            await addDeviceToEvent([{
                item_group: deviceInfo[0].item_group, category_name: deviceInfo[0].category_name, min_serial_number: deviceInfo.at(-1).serial_number, max_serial_number: deviceInfo[0].serial_number
            }])
            await navigate(`/staff/${profile.adminUserInfo._id}/equipment`)

        }
        openNotificationWithIcon("Equipment assigned to staff member.")
        setLoadingStatus(false)
    }
    const option2 = async (props) => {
        let newProps = []
        const finalList = [...selectedItem, {
            item_group: valueItemSelected[0].item_group,
            quantity: watch('quantity'),
            startingNumber: watch("startingNumber"),
        }]
        await createEvent(props.template)
        const groupingByType = _.groupBy(finalList, 'item_group')
        for (let [key, value] of Object.entries(groupingByType)) {
            for (let data of value) {
                const indexStart = props.groupingType[data.item_group].findIndex(element => element.serial_number == data.startingNumber)
                const indexEnd = indexStart + (Number(data.quantity))
                const dataFound = props.groupingType[key]?.slice(indexStart, indexEnd)
                const deviceInfo = dataFound //*array of existing devices in sql db
                newProps = [...newProps, deviceInfo]
                await updateDeviceInWarehouse({
                    item_group: key,
                    startingNumber: data.startingNumber,
                    endingNumber: deviceInfo.at(-1).serial_number,
                })
                await addDeviceToEvent([
                    {
                        item_group: deviceInfo[0].item_group, category_name: deviceInfo[0].category_name, min_serial_number: deviceInfo.at(-1).serial_number, max_serial_number: deviceInfo[0].serial_number
                    }
                ])
            }
        }
        await createNewLease({ deviceInfo: newProps.flat(), street: props.template.street, city: props.template.city, state: props.template.state, zip: props.template.zip })
        openNotificationWithIcon("Equipment assigned to staff member.")
        setLoadingStatus(false)
    }

    const option3 = async (props) => {
        await createEvent(props.template)
        let newProps = []
        const groupingByType = _.groupBy(selectedItem, 'item_group')
        for (let [key, value] of Object.entries(groupingByType)) {
            for (let data of value) {
                const indexStart = props.groupingType[data.item_group].findIndex(element => element.serial_number == data.startingNumber)
                const indexEnd = indexStart + (Number(data.quantity))
                const dataFound = props.groupingType[key]?.slice(indexStart, indexEnd)
                const deviceInfo = dataFound //*array of existing devices in sql db
                newProps = [...newProps, deviceInfo]
                await updateDeviceInWarehouse({
                    item_group: key,
                    startingNumber: deviceInfo[0].serial_number,
                    endingNumber: deviceInfo.at(-1).serial_number,
                })
                await addDeviceToEvent([
                    {
                        item_group: deviceInfo[0].item_group, category_name: deviceInfo[0].category_name, min_serial_number: deviceInfo.at(-1).serial_number, max_serial_number: deviceInfo[0].serial_number
                    }
                ])
            }
        }
        await createNewLease({ deviceInfo: newProps.flat(), street: props.template.street, city: props.template.city, state: props.template.state, zip: props.template.zip })
        openNotificationWithIcon("Equipment assigned to staff member.")
        setLoadingStatus(false)
    }

    const assignDeviceToStaffMember = async () => {
        const template = {
            street: watch("street"),
            city: watch("city"),
            state: watch("state"),
            zip: watch("zip"),
        }
        setLoadingStatus(true)
        const groupingType = _.groupBy(dataFound.current, 'item_group')
        if (selectedItem.length === 0 && watch('startingNumber')?.length > 0) {
            await option1({ groupingType: groupingType, template: template })
        }
        if (selectedItem.length > 0 && watch('startingNumber')?.length > 0) {
            await option2({ groupingType: groupingType, template: template })
        }
        if (selectedItem.length > 0 && watch('startingNumber')?.length === 0) {
            await option3({ groupingType: groupingType, template: template })
        }
    }
    return (
        <Grid
            container
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            marginY={2}
            key={"settingUp-deviceList-event"}
        >
            {contextHolder}
            <Typography
                textTransform="none"
                textAlign="justify"
                fontFamily="Inter"
                fontSize="14px"
                fontStyle="normal"
                fontWeight={400}
                lineHeight="20px"
                color="var(--gray-600, #475467)"
                margin={'0.2rem auto 0.5rem'}
                style={{
                    wordWrap: "break-word",
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                You can select groups of devices from existing inventory in your database and assign to this event. When assigning, you can choose the whole group of devices, or only a range of serial numbers per group. You will see the groups selected as small tags below.
            </Typography>
            <Grid
                style={{
                    borderRadius: "8px",
                    border: "1px solid var(--gray-300, #D0D5DD)",
                    background: "var(--gray-100, #F2F4F7)",
                    padding: "24px",
                    width: "100%",
                }} item xs={12} sm={12} md={12} lg={12}>
                <InputLabel
                    style={{ marginBottom: "0.5rem", width: "100%" }}
                >
                    <Typography
                        style={Subtitle}
                    >
                        Location
                    </Typography>
                </InputLabel>
                <div style={{ ...CenteringGrid, justifyContent: "space-between", margin: '0 0 20px 0', gap: "1rem" }}>
                    <div style={{ width: "50%" }}>
                        <InputLabel
                            style={{ marginBottom: "0.2rem", width: "100%" }}
                        >
                            <Typography
                                style={Subtitle}
                            >
                                Street
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            {...register('street')}
                            disabled={loadingStatus}
                            style={{
                                ...OutlinedInputStyle,
                                width: "100%",
                            }}
                            fullWidth
                        /></div>
                    <div style={{ width: "50%" }}>
                        <InputLabel
                            style={{ marginBottom: "0.2rem", width: "100%" }}
                        >
                            <Typography
                                style={Subtitle}
                            >
                                City
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            disabled={loadingStatus}
                            {...register('city')}
                            style={{
                                ...OutlinedInputStyle,
                                width: "100%",
                            }}
                            fullWidth
                        /></div>
                </div>
                <div style={{ ...CenteringGrid, justifyContent: "space-between", margin: '0 0 20px 0', gap: "1rem" }}>
                    <div style={{ width: "50%" }}>
                        <InputLabel
                            style={{ marginBottom: "0.2rem", width: "100%" }}
                        >
                            <Typography
                                style={Subtitle}
                            >
                                State
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            {...register('state')}
                            disabled={loadingStatus}
                            style={{
                                ...OutlinedInputStyle,
                                width: "100%",
                            }}
                            fullWidth
                        /></div>
                    <div style={{ width: "50%" }}>
                        <InputLabel
                            style={{ marginBottom: "0.2rem", width: "100%" }}
                        >
                            <Typography
                                style={Subtitle}
                            >
                                Zip
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            disabled={loadingStatus}
                            {...register('zip')}
                            style={{
                                ...OutlinedInputStyle,
                                width: "100%",
                            }}
                            fullWidth
                        /></div>
                </div>


                <InputLabel
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}
                >
                    <Typography
                        textTransform="none"
                        style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
                    >
                        Device
                    </Typography>
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
                        <Grid style={{ alignSelf: "baseline" }} item xs={6} sm={6} md={6} lg={6}>
                            <InputLabel
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                }}
                            >
                                <Typography
                                    textTransform="none"
                                    style={{ ...TextFontSize20LineHeight30, fontWeight: 600, fontSize: "14px", color: "#000" }}
                                >
                                    Select from existing category
                                </Typography>
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
                                        label:
                                            <Typography textTransform={'capitalize'} style={{ ...Subtitle, display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                                <span><span style={{ fontWeight: 700 }}>{item[0].category_name}</span> {item[0].item_group}</span>
                                                <span style={{ textAlign: "left" }}>Location: <span style={{ fontWeight: 700 }}>{item[0].location}</span></span>
                                                <span>Total available: {item.length}</span>
                                            </Typography>, //renderOptionAsNeededFormat(JSON.stringify(option))
                                        value: JSON.stringify(item),
                                    };
                                })}
                            />
                        </Grid>
                        <Grid item xs={6} sm={6} md={6} lg={6}>
                            <InputLabel
                                style={{ marginBottom: "0.2rem", width: "100%" }}
                            >
                                <Typography
                                    style={Subtitle}
                                >
                                    Quantity
                                </Typography>
                            </InputLabel>
                            <OutlinedInput
                                disabled={loadingStatus}
                                required
                                {...register('quantity')}
                                style={{
                                    ...OutlinedInputStyle,
                                    width: "100%",
                                }}
                                placeholder='e.g. 0'
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

                        <Grid item xs={6} sm={6} md={6} lg={6}>
                            <InputLabel
                                style={{ marginBottom: "0.2rem", width: "100%" }}
                            >
                                <Typography
                                    style={Subtitle}
                                >
                                    Start serial number
                                </Typography>
                            </InputLabel>
                            <OutlinedInput
                                disabled={loadingStatus}
                                required
                                {...register('startingNumber')}
                                style={{
                                    ...OutlinedInputStyle,
                                    width: "100%",
                                }}
                                placeholder={`Selected category serial numbers start: ${substractingRangesSelectedItem()?.min} end: ${substractingRangesSelectedItem()?.max}`}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={6} sm={6} md={6} lg={6}>
                            <InputLabel
                                style={{ marginBottom: "0.2rem", width: "100%" }}
                            >
                                <Typography
                                    style={{ ...Subtitle, color: "transparent" }}
                                >
                                    Quantity
                                </Typography>
                            </InputLabel>
                            <Button
                                type="submit"
                                style={{ ...LightBlueButton, ...CenteringGrid, width: "100%", }}
                            >
                                <PlusIcon /><Typography
                                    textTransform="none"
                                    style={{ ...LightBlueButtonText, border: "transparent" }}
                                >
                                    Add item
                                </Typography>
                            </Button>
                        </Grid>
                    </Grid>
                </form>

                <Grid item xs={12}>
                    <InputLabel
                        style={{ marginBottom: "0.2rem", width: "100%" }}
                    >
                        <Typography
                            textTransform={"none"}
                            textAlign={"left"}
                            fontFamily={"Inter"}
                            fontSize={"14px"}
                            fontStyle={"normal"}
                            fontWeight={500}
                            lineHeight={"20px"}
                            color={"var(--gray-700, #344054)"}
                        >
                            Groups selected
                        </Typography>
                    </InputLabel>
                    <Space
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                        size={[0, "small"]}
                        wrap
                    >
                        {selectedItem.map((item, index) => {
                            return (
                                <Tag
                                    bordered={false}
                                    closable
                                    icon={<CheckIcon />}
                                    style={{
                                        display: "flex",
                                        padding: "2px 4px 2px 5px",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "3px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--gray-300, #D0D5DD)",
                                        background: "var(--base-white, #FFF)",
                                        margin: "5px",
                                    }}
                                    onClose={() => removeItemSelected(index)}
                                    key={`${item._id}${index}`}
                                >
                                    &nbsp;{item.item_group}
                                    {"      "}&nbsp;Qty: {item.quantity}
                                    <br />
                                    {item.startingNumber} - {item.endingNumber}
                                </Tag>
                            );
                        })}
                    </Space>
                </Grid>
            </Grid >
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
                    onClick={() => navigate(`/staff/${profile.adminUserInfo.id}/equipment`)}
                    style={{ ...GrayButton, ...CenteringGrid, width: "100%" }}
                >
                    <Typography
                        style={GrayButtonText}
                    >
                        Go back
                    </Typography>
                </Button>
                <Button
                    onClick={() => assignDeviceToStaffMember()}
                    style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
                >
                    <Typography
                        style={BlueButtonText}
                    >
                        Assign equipment
                    </Typography>
                </Button>
            </Grid>
        </Grid >
    );
};

export default Assignment;
