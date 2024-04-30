import { Grid, MenuItem, Select, Typography } from "@mui/material";
import { Button, Modal } from "antd";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../../../../api/devitrakApi";
import renderingTitle from "../../../../../components/general/renderingTitle";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { formatDate } from "../../../../inventory/utils/dateFormat";

const options = ["Operational", "Network", "Hardware", "Damaged", "Battery"]
const ModalReturnDeviceFromStaff = ({ openReturnDeviceStaffModal, setOpenReturnDeviceStaffModal, deviceInfo }) => {
    const {
        register,
        handleSubmit,
        watch,
    } = useForm();

    const handleReturnDevice = async (data) => {
        const respoUpdateDeviceInStock = await devitrakApi.post('/db_event/returning-item', {
            warehouse: 1,
            status: data.reason,
            update_at: formatDate(new Date()),
            serial_number: deviceInfo.item_id_info.serial_number,
            category_name: deviceInfo.item_id_info.category_name,
            item_group: deviceInfo.item_id_info.item_group,
            company: deviceInfo.item_id_info.company,
        })
        if (respoUpdateDeviceInStock.data) {
            await updateLeaseInfo()
        }
    }

    const updateLeaseInfo = async () => {
        const initialDate = formatDate(new Date(deviceInfo.subscription_initial_date))
        const response = await devitrakApi.post('/db_lease/update-lease-info', {
            subscription_returned_date: formatDate(new Date()), staff_admin_id: deviceInfo.staff_admin_id, company_id: deviceInfo.company_id, subscription_current_in_use: 0, staff_member_id: deviceInfo.staff_member_id, device_id: deviceInfo.item_id_info.item_id, active: 0, subscription_initial_date: initialDate
        })
        console.log("🚀 ~ updateLeaseInfo ~ response:", response)
        if(response.data) return closeModal()
    }

    const closeModal = () => {
        return setOpenReturnDeviceStaffModal(false);
    }
    return (
        <Modal
            title={renderingTitle(`Returning device #: ${deviceInfo.item_id_info.serial_number}`)}
            centered
            open={openReturnDeviceStaffModal}
            onCancel={() => closeModal()}
            footer={[]}
            maskClosable={false}
        >
            <form
                style={{
                    ...CenteringGrid, flexDirection: "column",
                    width: "100%",
                }}
                onSubmit={handleSubmit(handleReturnDevice)}
            >
                <Grid container>
                    <Grid margin={'1rem auto'} item xs={12} sm={12} md={12} lg={12}>
                        <Select
                            className="custom-autocomplete"
                            {...register("reason", { required: true })}
                            style={{ ...AntSelectorStyle, width: "100%" }}
                        >
                            <MenuItem value="">None</MenuItem>
                            {options.map((option) => (
                                <MenuItem key={option} value={option}>
                                    <Typography>{option}</Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>

                    {watch("reason") !== "" && (
                        <Grid display={"flex"} flexDirection={'row'} justifyContent={'space-between'} alignItems={"center"} gap={2} container>
                            <Button
                                disabled={watch("reason") === ""}
                                htmlType="submit"
                                style={{ ...BlueButton, width: "100%" }}
                            >
                                <Typography
                                    textTransform={"none"}
                                    style={{...BlueButtonText, ...CenteringGrid}}
                                >
                                    Save
                                </Typography>
                            </Button>
                        </Grid>
                    )}{" "}
                </Grid>
            </form>
        </Modal>
    );
};


export default ModalReturnDeviceFromStaff