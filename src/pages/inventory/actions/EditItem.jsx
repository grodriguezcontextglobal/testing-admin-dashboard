import { Icon } from '@iconify/react'
import { Button, Grid, InputAdornment, InputLabel, OutlinedInput, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { Divider, Modal, notification } from 'antd'
import { PropTypes } from 'prop-types'
import { useForm } from 'react-hook-form'
import { devitrakApi } from '../../../api/devitrakApi'
import { formatDate } from '../utils/dateFormat'

const EditItem = ({ openEditItemModal, setOpenEditItemModal, item }) => {
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            descript_item: item.descript_item,
            category_name: item.category_name,
            item_group: item.item_group,
            serial_number: item.serial_number,
            cost: item.cost,
        }
    });
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, msg) => {
        api.open({
            message: msg,
        });
    };

    const queryClient = useQueryClient()
    const closeModal = () => {
        setOpenEditItemModal(false)
    }

    const savingNewItem = async (data) => {
        try {
            const respNewItem = await devitrakApi.patch(`/db_item/edit-item`, {
                category_name: data.category_name,
                item_group: data.item_group,
                cost: data.cost,
                descript_item: data.descript_item,
                serial_number: data.serial_number,
                company: item.company,
                warehouse: item.warehouse,
                ownership: item.ownership,
                create_at: formatDate(new Date(`${item.create_at}`)),
                update_at: formatDate(new Date()),
                item_id: item.item_id
            });
            if (respNewItem.data.ok) {
                setValue("category_name", "");
                setValue("item_group", "");
                setValue("cost", "");
                setValue("descript_item", "");
                setValue("serial_number", "");
                openNotificationWithIcon(
                    "success",
                    "Item was edited and stored in database."
                );
                queryClient.invalidateQueries('listOfItems')
                await closeModal();
            }

        } catch (error) {
            openNotificationWithIcon('error', `${error.message}`)
        }
    };
    return (
        <Modal
            open={openEditItemModal}
            onCancel={() => closeModal()}
            width={1000}
            footer={[]}
            maskClosable={false}
            style={{
                top: '15dvh',
                borderRadius: "12px",
            }}>
            <Grid
                marginY={1}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                container
            >
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
                    }}
                    onSubmit={handleSubmit(savingNewItem)}
                    className="form"
                >
                    <InputLabel
                        id="eventName"
                        style={{ marginBottom: "0.2rem", width: "100%" }}
                    >
                        <Typography
                            textTransform={"none"}
                            textAlign={"left"}
                            fontFamily={"Inter"}
                            fontSize={"20px"}
                            fontStyle={"normal"}
                            fontWeight={600}
                            lineHeight={"30px"}
                            color={"var(--gray-600, #475467)"}
                        >
                            Edit item
                        </Typography>
                    </InputLabel>
                    <Typography
                        textTransform={"none"}
                        textAlign={"left"}
                        fontFamily={"Inter"}
                        fontSize={"14px"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"20px"}
                        color={"var(--gray-600, #475467)"}
                    >
                        Devices serial numbers can be created by inputting a serial number base
                        to define the category of device, and then a range from one number to
                        another, depending on your inventory.
                    </Typography>
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
                                style={{
                                    borderRadius: "12px",
                                    border: `${errors.category_name && "solid 1px #004EEB"}`,
                                    margin: "0.1rem auto 1rem",
                                    width: "100%",
                                    background: "var(--base-white, #FFF)",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }}
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
                                style={{
                                    borderRadius: "12px",
                                    border: `${errors.item_group && "solid 1px #004EEB"}`,
                                    margin: "0.1rem auto 1rem",
                                    width: "100%",
                                    background: "var(--base-white, #FFF)",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }}
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
                                    Value to replace lost device
                                </Typography>
                            </InputLabel>
                            <OutlinedInput
                                {...register("cost", { required: true })}
                                aria-invalid={errors.cost}
                                style={{
                                    borderRadius: "12px",
                                    border: `${errors.cost && "solid 1px #004EEB"}`,
                                    margin: "0.1rem auto 1rem",
                                    display: "flex",
                                    width: "100%",
                                    justifyContent: "flex-start",
                                    background: "var(--base-white, #FFF)",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }}
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
                            />
                            {errors?.cost && (
                                <Typography>{errors.cost.type}</Typography>
                            )}
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
                                    textAlign={"left"}
                                    fontFamily={"Inter"}
                                    fontSize={"14px"}
                                    fontStyle={"normal"}
                                    fontWeight={500}
                                    lineHeight={"20px"}
                                    color={"var(--gray-700, #344054)"}
                                >
                                    Serial number
                                </Typography>
                            </InputLabel>
                            <OutlinedInput
                                {...register("serial_number", { required: true })}
                                aria-invalid={errors.serial_number}
                                style={{
                                    borderRadius: "12px",
                                    border: `${errors.serial_number && "solid 1px #004EEB"}`,
                                    margin: "0.1rem auto 1rem",
                                    display: "flex",
                                    width: "100%",
                                    justifyContent: "flex-start",
                                    background: "var(--base-white, #FFF)",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }}
                                placeholder="e.g. 300"
                            />
                            {errors?.serial_number && (
                                <Typography>{errors.serial_number.type}</Typography>
                            )}
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
                    ><Button
                        type="submit"
                        style={{
                            width: "100%",
                            border: "1px solid var(--blue-dark-600, #155EEF)",
                            borderRadius: "8px",
                            background: "var(--blue-dark-600, #155EEF)",
                            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
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
                                style={{
                                    color: "var(--base-white, #FFF)",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    fontFamily: "Inter",
                                    lineHeight: "20px",
                                }}
                            >
                                Save updates
                            </Typography>
                        </Button>
                    </div>
                </form>
            </Grid>
        </Modal>
    );
};

export default EditItem

EditItem.propTypes = {
    openEditItemModal: PropTypes.bool,
    setOpenEditItemModal: PropTypes.func,
    item: PropTypes.object
}