import { Icon } from "@iconify/react";
import {
    Button,
    Grid,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    TextField,
    Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AutoComplete, Avatar, Divider, Select, Tooltip, notification } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { QuestionIcon, UploadIcon } from "../../../components/icons/Icons";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import '../../../styles/global/ant-select.css';
import { formatDate } from "../utils/dateFormat";
const options = [{ value: 'Permanent' }, { value: 'Rent' }, { value: 'Sale' }]
const AddNewBulkItems = () => {
    const { user } = useSelector((state) => state.admin);
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm();
    const navigate = useNavigate();
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, msg) => {
        api[type]({
            message: msg,
        });
    };
    const [valueSelection, setValueSelection] = useState('');
    const [loading, setLoading] = useState(false)
    const [locationSelection, setLocationSelection] = useState('')
    const companiesQuery = useQuery({
        queryKey: ['locationOptionsPerCompany'],
        queryFn: () => devitrakApi.post('/company/search-company', {
            company_name: user.company
        }),
        enabled: false,
        refetchOnMount: false
    })
    useEffect(() => {
        const controller = new AbortController()
        companiesQuery.refetch()
        return () => {
            controller.abort()
        }
    }, [])

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
    const savingNewItem = async (data) => {
        await openNotificationWithIcon(
            "warning",
            "We're working on your request. Please wait until the action is finished. We redirect you to main page when request is done."
        );
        setLoading(true)
        let base64;
        if (data.photo.length > 0 && data.photo[0].size > 1048576) {
            setLoading(false)
            return alert(
                "Image is bigger than allow. Please resize the image or select a new one."
            );
        } else if (data.photo.length > 0) {
            base64 = await convertToBase64(data.photo[0]);
            const resp = await devitrakApi.post(`/image/new_image`, {
                source: base64,
                category: data.category_name,
                item_group: data.item_group,
                company: user.company,
            });
            if (resp.data) {
                for (let i = Number(data.startingNumber); i <= Number(data.endingNumber); i++) {
                    try {
                        await devitrakApi.post("/db_item/new_item", {
                            category_name: data.category_name,
                            item_group: data.item_group,
                            cost: data.cost,
                            descript_item: data.descript_item,
                            ownership: valueSelection,
                            serial_number: String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`),
                            warehouse: true,
                            location: locationSelection,
                            created_at: formatDate(new Date()),
                            updated_at: formatDate(new Date()),
                            company: user.company
                        });
                        if (!renderLocationOptions().some(element => element.value === locationSelection)) {
                            let template = [...companiesQuery.data.data.company.at(-1).location, locationSelection]
                            await devitrakApi.patch(`/company/update-company/:${companiesQuery.data.data.company.at(-1).id}`, {
                                location: template
                            })
                        }
                        if (String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`) === data.endingNumber) {
                            setValue("category_name", "");
                            setValue("item_group", "");
                            setValue("cost", "");
                            setValue("descript_item", "");
                            setValue("ownership", "");
                            setValue("serial_number", "")
                            setValueSelection(options[0]);
                            openNotificationWithIcon(
                                "success",
                                "items were created and stored in database."
                            );
                            setLoading(false)
                            setTimeout(() => {
                                navigate("/inventory");
                            }, 3000);
                        }
                    } catch (error) {
                        openNotificationWithIcon('error', `${error.message}`)
                        setLoading(false)
                    }
                }
            }
        } else if (data.photo.length < 1) {
            for (let i = Number(data.startingNumber); i <= Number(data.endingNumber); i++) {
                try {
                    await devitrakApi.post('/db_item/new_item', {
                        category_name: data.category_name,
                        item_group: data.item_group,
                        cost: data.cost,
                        descript_item: data.descript_item,
                        ownership: valueSelection,
                        serial_number: String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`),
                        warehouse: true,
                        location: locationSelection,
                        created_at: formatDate(new Date()),
                        updated_at: formatDate(new Date()),
                        company: user.company
                    })
                    if (!renderLocationOptions().some(element => element.value === locationSelection)) {
                        let template = [...companiesQuery.data.data.company.at(-1).location, locationSelection]
                        await devitrakApi.patch(`/company/update-company/${companiesQuery.data.data.company.at(-1).id}`, {
                            location: template
                        })
                    }
                    if (String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`) === data.endingNumber) {
                        openNotificationWithIcon('success', "items were created and stored in database.")
                        setLoading(false)
                        setTimeout(() => {
                            return navigate('/inventory')
                        }, 3000);
                    }
                } catch (error) {
                    openNotificationWithIcon('error', `item ${String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)} was not stored.`)
                    setLoading(false)
                }
            }
        }
    };
    const renderTitle = () => {
        return (<>
            <InputLabel
                id="eventName"
                style={{ marginBottom: "0.2rem", width: "100%" }}
            >
                <Typography
                    textAlign={'left'}
                    textTransform={"none"}
                    style={TextFontSize30LineHeight38}
                    color={"var(--gray-600, #475467)"}
                >
                    Add a group of devices
                </Typography>
            </InputLabel>
            <InputLabel
                id="eventName"
                style={{ marginBottom: "0.2rem", width: "100%" }}
            >
                <Typography
                    textAlign={'left'}
                    textTransform={"none"}
                    style={{ ...TextFontSize20LineHeight30, textWrap: "pretty" }}
                    color={"var(--gray-600, #475467)"}
                >
                    Devices serial numbers can be created by inputting a serial number base
                    to define the category of device, and then a range from one number to
                    another, depending on your inventory.
                </Typography>
            </InputLabel>
        </>
        )
    }
    return (
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
                    // alignSelf: "stretch",
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
                        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
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
                                Category
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            {...register("category_name")}
                            aria-invalid={errors.category_name}
                            style={OutlinedInputStyle}
                            placeholder="e.g. Electronic"
                            fullWidth
                        />
                        {errors?.category_name && (
                            <Typography
                                textTransform={"none"}
                                textAlign={"left"}
                                fontFamily={"Inter"}
                                fontSize={"14px"}
                                fontStyle={"normal"}
                                fontWeight={400}
                                lineHeight={"20px"}
                                color={"red"}
                                width={"100%"}
                                padding={"0.5rem 0"}
                            >
                                {errors.category_name.type}
                            </Typography>
                        )}
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
                                textAlign={"left"}
                                fontFamily={"Inter"}
                                fontSize={"14px"}
                                fontStyle={"normal"}
                                fontWeight={500}
                                lineHeight={"20px"}
                                color={"var(--gray-700, #344054)"}
                            >
                                Group
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            {...register("item_group")}
                            aria-invalid={errors.item_group}
                            style={OutlinedInputStyle}
                            placeholder="e.g. Laptop"
                            fullWidth
                        />
                        {errors?.item_group && (
                            <Typography
                                textTransform={"none"}
                                textAlign={"left"}
                                fontFamily={"Inter"}
                                fontSize={"14px"}
                                fontStyle={"normal"}
                                fontWeight={400}
                                lineHeight={"20px"}
                                color={"red"}
                                width={"100%"}
                                padding={"0.5rem 0"}
                            >
                                {errors.item_group.type}
                            </Typography>
                        )}
                        <div
                            style={{
                                textAlign: "left",
                                width: "50%",
                            }}
                        >
                        </div>
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
                                textAlign={"left"}
                                fontFamily={"Inter"}
                                fontSize={"14px"}
                                fontStyle={"normal"}
                                fontWeight={500}
                                lineHeight={"20px"}
                                color={"var(--gray-700, #344054)"}
                            >
                                Cost of replace device
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            {...register("cost", { required: true })}
                            aria-invalid={errors.cost}
                            style={OutlinedInputStyle}
                            placeholder="e.g. $200"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Typography
                                        textTransform={"none"}
                                        textAlign={"left"}
                                        fontFamily={"Inter"}
                                        fontSize={"14px"}
                                        fontStyle={"normal"}
                                        fontWeight={400}
                                        lineHeight={"20px"}
                                        color={"var(--gray-700, #344054)"}
                                    >
                                        $
                                    </Typography>
                                </InputAdornment>
                            }
                            fullWidth
                        />
                        {errors?.cost && (
                            <Typography>{errors.cost.type}</Typography>
                        )}
                    </div>
                    <div
                        style={{
                            textAlign: "left",
                            width: "50%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <div style={{
                            textAlign: "left",
                            width: "100%",
                            display: "flex",
                            alignSelf: "flex-start",
                        }}>
                            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
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
                                    Ownership status of items
                                </Typography>
                                <Select
                                    showSearch
                                    className="custom-autocomplete"
                                    style={{ ...AntSelectorStyle, height: "2.4rem", width: "100%" }}
                                    placeholder="Select an option"
                                    optionFilterProp="children"
                                    onChange={(value) => {
                                        setValueSelection(value)
                                    }}
                                    filterOption={(input, option) => (option?.label ?? '').includes(input)}
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                                    }
                                    options={options}
                                />
                            </InputLabel>
                        </div>
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
                    <InputLabel style={{ width: "100%" }}>
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
                            Location <Tooltip title="Where the item is location physically."><QuestionIcon /></Tooltip>
                        </Typography>
                    </InputLabel>
                    <AutoComplete
                        className="custom-autocomplete"
                        style={{ width: "100%", height: "2.5rem" }}
                        options={renderLocationOptions()}
                        placeholder="Select a location"
                        filterOption={(inputValue, option) =>
                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                        onChange={(value) => setLocationSelection(value)}
                    />

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
                    <InputLabel style={{ width: "100%" }}>
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
                            Description of the device
                        </Typography>
                    </InputLabel>
                    <OutlinedInput
                        multiline
                        minRows={5}
                        {...register("descript_item", { required: true })}
                        aria-invalid={errors.descript_item}
                        style={{
                            borderRadius: "12px",
                            border: `${errors.descript_item && "solid 1px #004EEB"}`,
                            margin: "0.1rem auto 1rem",
                            display: "flex",
                            width: "100%",
                            justifyContent: "flex-start",
                            background: "var(--base-white, #FFF)",
                            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                        }}
                        placeholder="Please provide a brief description of the new device to be added."
                    />
                    {errors?.descript_item && (
                        <Typography>{errors.descript_item.type}</Typography>
                    )}
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
                        // boxShadow: "0px 1px 2px rgba(16,24,40,0.05)",
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
                                textAlign={"left"}
                                fontFamily={"Inter"}
                                fontSize={"14px"}
                                fontStyle={"normal"}
                                fontWeight={500}
                                lineHeight={"20px"}
                                color={"var(--gray-700, #344054)"}
                            >
                                From starting number
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            {...register("startingNumber")}
                            aria-invalid={errors.startingNumber}
                            style={OutlinedInputStyle}
                            placeholder="e.g. 0001"
                            fullWidth
                        />
                        {errors?.startingNumber && (
                            <Typography
                                textTransform={"none"}
                                textAlign={"left"}
                                fontFamily={"Inter"}
                                fontSize={"14px"}
                                fontStyle={"normal"}
                                fontWeight={400}
                                lineHeight={"20px"}
                                color={"red"}
                                width={"100%"}
                                padding={"0.5rem 0"}
                            >
                                {errors.startingNumber.type}
                            </Typography>
                        )}
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
                                textAlign={"left"}
                                fontFamily={"Inter"}
                                fontSize={"14px"}
                                fontStyle={"normal"}
                                fontWeight={500}
                                lineHeight={"20px"}
                                color={"var(--gray-700, #344054)"}
                            >
                                To ending number
                            </Typography>
                        </InputLabel>
                        <OutlinedInput
                            {...register("endingNumber")}
                            aria-invalid={errors.endingNumber}
                            style={OutlinedInputStyle}
                            placeholder="e.g. 1000"
                            fullWidth
                        />
                        {errors?.endingNumber && (
                            <Typography
                                textTransform={"none"}
                                textAlign={"left"}
                                fontFamily={"Inter"}
                                fontSize={"14px"}
                                fontStyle={"normal"}
                                fontWeight={400}
                                lineHeight={"20px"}
                                color={"red"}
                                width={"100%"}
                                padding={"0.5rem 0"}
                            >
                                {errors.endingNumber.type}
                            </Typography>
                        )}
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
                        }}>
                        <Link to="/inventory">
                            <Button
                                disabled={loading}
                                style={{ ...GrayButton, width: "100%" }}
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
                                    style={GrayButtonText}
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
                        disabled={loading}
                        type="submit"
                        style={{
                            ...BlueButton, width: "100%",
                        }}
                    >
                            <Icon
                                icon="ic:baseline-plus"
                                color="var(--base-white, #FFF)"
                                width={20}
                                height={20}
                            />
                            &nbsp;
                            <Typography
                                textTransform={"none"}
                                style={BlueButtonText}
                            >
                                Save new item
                            </Typography>
                        </Button></div>
                </div>
            </form>
        </Grid>
        // </Modal>
    );
};
export default AddNewBulkItems;