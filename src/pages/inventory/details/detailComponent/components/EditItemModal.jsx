import {
    Button,
    Grid,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AutoComplete, Avatar, Divider, Modal, Select, notification } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { formatDate } from "../../../utils/dateFormat";
import { convertToBase64 } from "../../../../../components/utils/convertToBase64";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { QuestionIcon, UploadIcon } from "../../../../../components/icons/Icons";
import { Icon } from "@iconify/react";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import Loading from "../../../../../components/animation/Loading";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
const options = [{ value: 'Permanent' }, { value: 'Rent' }, { value: 'Sale' }]
const EditItemModal = ({ dataFound, openEditItemModal, setOpenEditItemModal }) => {
    const companiesQuery = useQuery({
        queryKey: ['locationOptionsPerCompany'],
        queryFn: () => devitrakApi.post('/company/search-company', {
            company_name: user.company
        }),
        enabled: false,
        refetchOnMount: false
    })
    const itemsInInventoryQuery = useQuery({
        queryKey: ['ItemsInfoInStockCheckingQuery'],
        queryFn: () => devitrakApi.post("/db_item/consulting-item", {
            item_id: dataFound[0].item_id
        }),
        enabled: false,
        refetchOnMount: false
    })
    const navigate = useNavigate();
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, msg) => {
        api.open({
            message: msg,
        });
    };
    const [selectedItem, setSelectedItem] = useState(itemsInInventoryQuery?.data?.data?.items[0]?.item_group)
    const [loadingStatusRendering, setLoadingStatusRendering] = useState(false)
    const [taxableLocation, setTaxableLocation] = useState(itemsInInventoryQuery?.data?.data?.items[0]?.main_warehouse)
    const [loadingStatus, setLoadingStatus] = useState(false)
    const [valueSelection, setValueSelection] = useState(options.value = itemsInInventoryQuery?.data?.data?.items[0]?.ownership);
    const [locationSelection, setLocationSelection] = useState(itemsInInventoryQuery?.data?.data?.items[0]?.location)
    const { user } = useSelector((state) => state.admin);
    const {
        register,
        handleSubmit,
        setValue,
    } = useForm({
        defaultValues: {
            category_name: dataFound[0]?.category_name,
            cost: dataFound[0]?.cost,
            brand: dataFound[0]?.brand,
            descript_item: dataFound[0]?.descript_item,
            serial_number: dataFound[0]?.serial_number,
        }
    });
    useEffect(() => {
        const controller = new AbortController()
        companiesQuery.refetch()
        itemsInInventoryQuery.refetch()
        setLoadingStatusRendering(true)
        return () => {
            controller.abort()
        }
    }, [dataFound[0].item_id, openEditItemModal])

    const retrieveItemInfoForEdit = useCallback(() => {
        if (itemsInInventoryQuery.data) {
            setSelectedItem(itemsInInventoryQuery?.data?.data?.items[0]?.item_group)
            setTaxableLocation(itemsInInventoryQuery?.data?.data?.items[0]?.main_warehouse)
            setLocationSelection(itemsInInventoryQuery?.data?.data?.items[0]?.warehouse ? dataFound[0]?.location : dataFound[0]?.event_name)
            setValueSelection(options.value = itemsInInventoryQuery?.data?.data?.items[0]?.ownership)
            setValue("category_name", `${itemsInInventoryQuery?.data?.data?.items[0]?.category_name}`)
            setValue("cost", `${itemsInInventoryQuery?.data?.data?.items[0]?.cost}`)
            setValue("brand", `${itemsInInventoryQuery?.data?.data?.items[0]?.brand}`)
            setValue("descript_item", `${itemsInInventoryQuery?.data?.data?.items[0]?.descript_item}`)
            setValue("serial_number", `${itemsInInventoryQuery?.data?.data?.items[0]?.serial_number}`)
        }
    }, [itemsInInventoryQuery.data, loadingStatusRendering])

    useEffect(() => {
        const controller = new AbortController()
        retrieveItemInfoForEdit()
        return () => {
            controller.abort()
        }
    }, [itemsInInventoryQuery?.data?.data?.items[0]?.item_id, openEditItemModal, loadingStatusRendering])

    const retrieveItemOptions = () => {
        const result = new Set()
        if (itemsInInventoryQuery.data) {
            const itemsOptions = itemsInInventoryQuery.data.data.items
            for (let data of itemsOptions) {
                result.add(data.item_group)
            }
        }
        return Array.from(result)
    }

    const renderLocationOptions = () => {
        if (companiesQuery.data) {
            const locations = companiesQuery.data.data.company?.at(-1).location ?? []
            const result = new Set()
            for (let data of locations) {
                result.add({ value: data })
            }
            return Array.from(result)
        }
        return []
    }

    const onChange = (value) => {
        return setValueSelection(value);
    };
    const retrieveItemDataSelected = () => {
        const result = new Map()
        if (itemsInInventoryQuery.data) {
            const industryData = itemsInInventoryQuery.data.data.items
            for (let data of industryData) {
                result.set(data.item_group, data)
            }
        }
        return result
    }
    useEffect(() => {
        const controller = new AbortController()
        if (retrieveItemDataSelected().has(selectedItem)) {
            const dataToRetrieve = retrieveItemDataSelected().get(selectedItem)
            setValue('category_name', `${dataToRetrieve.category_name}`)
            setValue('cost', `${dataToRetrieve.cost}`)
            setValue('brand', `${dataToRetrieve.brand}`)
            setValue('descript_item', `${dataToRetrieve.descript_item}`)
            setLocationSelection(`${dataToRetrieve.location}`)
            setTaxableLocation(`${dataToRetrieve.main_warehouse}`)
            setValueSelection(itemsInInventoryQuery?.data?.data?.items[0]?.ownership)
        }

        return () => {
            controller.abort()
        }
    }, [selectedItem])
    if (itemsInInventoryQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>
    if (itemsInInventoryQuery.data) {
        const savingNewItem = async (data) => {
            setLoadingStatus(true)
            try {
                let base64;
                if (data.photo.length > 0 && data.photo[0].size > 1048576) {
                    setLoadingStatus(false)
                    return alert(
                        "Image is bigger than allow. Please resize the image or select a new one."
                    );
                } else if (data.photo.length > 0) {
                    base64 = await convertToBase64(data.photo[0]);
                    const resp = await devitrakApi.post(`/ image / new_image`, {
                        source: base64,
                        category: data.category_name,
                        item_group: selectedItem,
                        company: user.company,
                    });
                    if (resp.data) {
                        const respNewItem = await devitrakApi.post("/db_item/edit-item", {
                            item_id: itemsInInventoryQuery.data.data.items[0].item_id,
                            category_name: data.category_name,
                            item_group: selectedItem,
                            cost: data.cost,
                            brand: data.brand,
                            descript_item: data.descript_item,
                            ownership: valueSelection,
                            serial_number: data.serial_number,
                            warehouse: true,
                            status: itemsInInventoryQuery.data.data.items[0].status,
                            main_warehouse: taxableLocation,
                            updated_at: formatDate(new Date()),
                            company: user.company,
                            location: locationSelection,
                            current_location: locationSelection
                        });
                        if (respNewItem.data.ok) {
                            setValue("category_name", "");
                            setValue("item_group", "");
                            setValue("cost", "");
                            setValue("brand", "");
                            setValue("descript_item", "");
                            setValue("ownership", "");
                            setValue("serial_number", "")
                            setValueSelection(options[0]);
                            openNotificationWithIcon(
                                "success",
                                "Update was done and stored in database successfully."
                            );
                            setTimeout(() => {
                                setLoadingStatus(false)
                                navigate("/inventory");
                            }, 3000);
                        }
                    }
                } else if (data.photo.length < 1) {
                    const respNewItem = await devitrakApi.post("/db_item/edit-item", {
                        item_id: itemsInInventoryQuery.data.data.items[0].item_id,
                        category_name: data.category_name,
                        item_group: selectedItem,
                        cost: data.cost,
                        brand: data.brand,
                        descript_item: data.descript_item,
                        ownership: valueSelection,
                        serial_number: data.serial_number,
                        warehouse: true,
                        status: itemsInInventoryQuery.data.data.items[0].status,
                        main_warehouse: taxableLocation,
                        updated_at: formatDate(new Date()),
                        company: user.company,
                        location: locationSelection,
                        current_location: locationSelection
                    });
                    if (respNewItem.data.ok) {
                        setValue("category_name", "");
                        setValue("item_group", "");
                        setValue("cost", "");
                        setValue("brand", "");
                        setValue("descript_item", "");
                        setValue("ownership", "");
                        setValue("serial_number", "")

                        setValueSelection(options[0]);
                        openNotificationWithIcon(
                            "success",
                            "Update was done and stored in database successfully."
                        );
                        setTimeout(() => {
                            setLoadingStatus(false)
                            navigate("/inventory");
                        }, 3000);
                    }
                }
            } catch (error) {
                openNotificationWithIcon('error', `${error.message}`)
                setLoadingStatus(false)
            }
        };

        const closeModal = () => {
            setValue("category_name", "");
            setValue("item_group", "");
            setValue("cost", "");
            setValue("brand", "");
            setValue("descript_item", "");
            setValue("ownership", "");
            setValue("serial_number", "")
            return setOpenEditItemModal(false)
        }
        const renderTitle = () => {
            return (<>
                <InputLabel
                    id="eventName"
                    style={{ marginBottom: "6px", width: "100%" }}
                >
                    <Typography
                        textAlign={'left'}
                        style={TextFontSize30LineHeight38}
                        color={"var(--gray-600, #475467)"}
                    >
                        Update one device
                    </Typography>
                </InputLabel>
                <InputLabel
                    id="eventName"
                    style={{ marginBottom: "6px", width: "100%" }}
                >
                    <Typography
                        textAlign={'left'}
                        textTransform={"none"}
                        style={TextFontSize20LineHeight30}
                        color={"var(--gray-600, #475467)"}
                    >
                        You can enter all the details manually or use a scanner to enter the serial number.
                    </Typography>
                </InputLabel>
            </>
            )
        }
        return (
            <Modal key={dataFound[0].item_id} open={openEditItemModal} onCancel={() => closeModal()} style={{ top: "20dv" }} width={1000} footer={[]}>
                <Grid
                    display={"flex"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    container
                >
                    {contextHolder}
                    {renderTitle()}
                    <form
                        key={dataFound[0].item_id}
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
                        onSubmit={handleSubmit(savingNewItem)}
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
                                        textTransform={"none"}
                                        style={{ ...Subtitle, fontWeight: 500 }}
                                        color={"var(--gray-700, #344054)"}
                                    >
                                        Category
                                    </Typography>
                                </InputLabel>
                                <OutlinedInput
                                    key={dataFound[0].category_name}
                                    required
                                    aria-required
                                    {...register("category_name")}
                                    style={OutlinedInputStyle}
                                    placeholder="e.g. Electronic"
                                    fullWidth
                                />

                                <div
                                    style={{
                                        textAlign: "left",
                                        width: "50%",
                                    }}
                                >
                                </div>
                            </div>
                            <div
                                style={{
                                    textAlign: "left",
                                    width: "50%",
                                }}
                            >
                                <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                                    <Typography
                                        textTransform={"none"}
                                        style={{ ...Subtitle, fontWeight: 500 }}
                                        color={"var(--gray-700, #344054)"}
                                    >
                                        Device name
                                    </Typography>
                                </InputLabel>
                                <AutoComplete
                                    key={dataFound[0].item_group}
                                    className="custom-autocomplete" // Add a custom className here
                                    variant="outlined"
                                    style={{
                                        ...AntSelectorStyle,
                                        border: "solid 0.3 var(--gray600)",
                                        fontFamily: 'Inter',
                                        fontSize: "14px",
                                        width: "100%"
                                    }}

                                    value={selectedItem}
                                    onChange={(value) => setSelectedItem(value)}
                                    options={retrieveItemOptions().map(item => { return ({ value: item }) })}
                                    placeholder="Type the name of the device"
                                    filterOption={(inputValue, option) =>
                                        option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                    }
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
                                        textTransform={"none"}
                                        style={{ ...Subtitle, fontWeight: 500 }}
                                        color={"var(--gray-700, #344054)"}
                                    >
                                        Brand
                                    </Typography>
                                </InputLabel>
                                <OutlinedInput
                                    key={dataFound[0].brand}
                                    required
                                    {...register("brand")}
                                    style={OutlinedInputStyle}
                                    placeholder="e.g. Apple"
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
                                        textTransform={"none"}
                                        style={{ ...Subtitle, fontWeight: 500 }}
                                        color={"var(--gray-700, #344054)"}
                                    >
                                        <Tooltip title="Address where tax deduction for equipment will be applied.">Taxable location <QuestionIcon /></Tooltip>
                                    </Typography>
                                </InputLabel>
                                <AutoComplete
                                    key={dataFound[0].main_warehouse}
                                    className="custom-autocomplete"
                                    style={{ width: "100%", height: "2.5rem" }}
                                    options={renderLocationOptions()}
                                    value={taxableLocation}
                                    placeholder="Select a location"
                                    filterOption={(inputValue, option) =>
                                        option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                    }
                                    onChange={(value) => setTaxableLocation(value)}
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
                                        textTransform={"none"}
                                        style={{ ...Subtitle, fontWeight: 500 }}
                                        color={"var(--gray-700, #344054)"}
                                    >
                                        Cost of replace device
                                    </Typography>
                                </InputLabel>
                                <OutlinedInput
                                    key={dataFound[0].cost}
                                    required
                                    {...register("cost", { required: true })}
                                    style={OutlinedInputStyle}
                                    placeholder="e.g. $200"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <Typography
                                                textTransform={"none"}
                                                style={{ ...Subtitle, fontWeight: 500 }}
                                                color={"var(--gray-700, #344054)"}
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
                                        textTransform={"none"}
                                        style={{ ...Subtitle, fontWeight: 500 }}
                                        color={"var(--gray-700, #344054)"}
                                    >
                                        Serial number
                                    </Typography>
                                </InputLabel>
                                <OutlinedInput
                                    key={dataFound[0].serial_number}
                                    required
                                    {...register("serial_number", { required: true })}
                                    style={OutlinedInputStyle}
                                    placeholder="e.g. 300"
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
                                    textTransform={"none"}
                                    style={{ ...Subtitle, fontWeight: 500 }}
                                    color={"var(--gray-700, #344054)"}
                                >
                                    Description of the device
                                </Typography>
                            </InputLabel>
                            <OutlinedInput
                                key={dataFound[0].descript_item}
                                required
                                multiline
                                minRows={5}
                                {...register("descript_item", { required: true })}
                                fullWidth
                                style={{
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    color: '#000',
                                    verticalAlign: 'center',
                                    boxShadow: '1px 1px 2px rgba(16, 24, 40, 0.05)',
                                    outline: 'none',
                                }}
                                placeholder="Please provide a brief description of the new device to be added."
                            />
                        </div>
                        <Grid
                            display={"flex"}
                            flexDirection={"column"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            style={{
                                width: "100%",
                                borderRadius: "12px",
                                border: "1px solid var(--gray-200, #EAECF0)",
                                background: "var(--base-white, #FFF)",
                            }}
                            item
                            xs={12}
                        >
                            <Grid
                                display={"flex"}
                                justifyContent={"center"}
                                alignItems={"center"}
                                item
                                xs={12}
                            >
                                <Avatar
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        border: "6px solid var(--gray-50, #F9FAFB)",
                                        background: "6px solid var(--gray-50, #F9FAFB)",
                                        borderRadius: "28px",
                                    }}
                                > <UploadIcon />
                                </Avatar>

                            </Grid>
                            <Grid
                                display={"flex"}
                                justifyContent={"center"}
                                alignItems={"center"}
                                item
                                xs={12}
                            >
                                <TextField
                                    {...register("photo")}
                                    id="file-upload"
                                    type="file"
                                    accept=".jpeg, .png, .jpg"
                                    style={{
                                        outline: "none",
                                        border: "transparent",
                                    }}
                                />
                            </Grid>
                            <Grid
                                display={"flex"}
                                justifyContent={"center"}
                                alignItems={"center"}
                                marginBottom={2}
                                item
                                xs={12}
                            >
                                <Typography
                                    color={"var(--gray-600, #475467)"}
                                    fontFamily={"Inter"}
                                    fontSize={"14px"}
                                    fontStyle={"normal"}
                                    fontWeight={400}
                                    lineHeight={"20px"}
                                >
                                    SVG, PNG, JPG or GIF (max. 1MB)
                                </Typography>
                            </Grid>
                        </Grid>
                        <Divider />
                        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                            <InputLabel style={{ marginBottom: "6px", width: "100%" }}>
                                <Typography
                                    textTransform={"none"}
                                    style={{ ...Subtitle, fontWeight: 500 }}
                                    color={"var(--gray-700, #344054)"}
                                >
                                    Ownership status of item
                                </Typography>
                                <Select
                                    key={dataFound[0].ownership}
                                    showSearch
                                    style={{ ...AntSelectorStyle, width: "100%" }}
                                    placeholder="Select an option"
                                    optionFilterProp="children"
                                    onChange={onChange}
                                    value={valueSelection}
                                    filterOption={(input, option) => (option?.label ?? '').includes(input)}
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                                    }
                                    options={options}
                                />
                            </InputLabel>
                            <div style={{ width: "100%" }}>
                                <InputLabel style={{ width: "100%" }}>
                                    <Typography
                                        textTransform={"none"}
                                        style={{ ...Subtitle, fontWeight: 500 }}
                                        color={"var(--gray-700, #344054)"}
                                    >
                                        Location <Tooltip title="Where the item is location physically."><QuestionIcon /></Tooltip>
                                    </Typography>
                                </InputLabel>
                                <AutoComplete
                                    key={dataFound[0].location}
                                    className="custom-autocomplete"
                                    style={{ width: "100%", height: "2.5rem" }}
                                    options={renderLocationOptions()}
                                    placeholder="Select a location"
                                    value={locationSelection}
                                    filterOption={(inputValue, option) =>
                                        option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                    }
                                    onChange={(value) => setLocationSelection(value)}
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
                                            width: "100%",
                                            border: "1px solid var(--gray-300, #D0D5DD)",
                                            borderRadius: "8px",
                                            background: "var(--base-white, #FFF)",
                                            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
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
                                                color: "#344054",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                fontFamily: "Inter",
                                                lineHeight: "20px",
                                            }}
                                        >
                                            Go back
                                        </Typography>
                                    </Button>
                                </Link></div>
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "50%",
                                }}
                            ><Button
                                disabled={loadingStatus}
                                type="submit"
                                style={{
                                    width: "100%",
                                    border: `1px solid ${loadingStatus ? 'var(--disabled-blue-button)' : 'var(--blue-dark-600)'}`,
                                    borderRadius: "8px",
                                    background: `${loadingStatus ? "var(--disabled-blue-button)" : "var(--blue-dark-600)"}`,
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }}
                            >
                                    <Typography
                                        textTransform={"none"}
                                        style={BlueButtonText}
                                    >
                                        Update item
                                    </Typography>
                                </Button></div>
                        </div>
                    </form>
                </Grid >
            </Modal>
        );
    }

};

export default EditItemModal;