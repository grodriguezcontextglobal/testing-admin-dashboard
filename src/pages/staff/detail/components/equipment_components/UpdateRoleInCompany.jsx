import { Grid, MenuItem, Select, Typography } from "@mui/material";
import { Button, Divider, Modal, message } from "antd";
import renderingTitle from "../../../../../components/general/renderingTitle";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CenteringGrid from '../../../../../styles/global/CenteringGrid'
import { AntSelectorStyle } from '../../../../../styles/global/AntSelectorStyle'
import { BlueButton } from '../../../../../styles/global/BlueButton'
import { BlueButtonText } from '../../../../../styles/global/BlueButtonText'
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useState } from "react";
import { onAddStaffProfile } from "../../../../../store/slices/staffDetailSlide";
import { onLogin } from "../../../../../store/slices/adminSlice";

const UpdateRoleInCompany = () => {
    const { profile } = useSelector((state) => state.staffDetail)
    const { user } = useSelector((state) => state.admin)
    const [newRole, setNewRole] = useState('')
    const navigate = useNavigate()
    const closeModal = () => {
        return navigate(`/staff/${profile.adminUserInfo.id}/main`)
    }
    const dispatch = useDispatch()
    const [messageApi, contextHolder] = message.useMessage();
    const messaging = () => {
        messageApi.open({
            type: 'success',
            content: 'Staff role updated.',
        });
    };
    const handleSubmitNewRole = async (e) => {
        e.preventDefault()
        const foundStaffToUpdate = profile.companyData.employees.findIndex(element => element.user === profile.user)
        if (foundStaffToUpdate > -1) {
            const result = profile.companyData.employees.toSpliced(foundStaffToUpdate, 1, { ...profile.companyData.employees[foundStaffToUpdate], role: newRole })
            const respoUpdateRoleStaffInCompany = await devitrakApi.patch(`/company/update-company/${profile.companyData.id}`, {
                employees: result
            })
            if (respoUpdateRoleStaffInCompany.data) {
                dispatch(onAddStaffProfile({ ...profile, role: newRole, companyData: respoUpdateRoleStaffInCompany.data.company }));
                if (user.email === profile.user) {
                    dispatch(onLogin({
                        ...user,
                        role: newRole
                    }))
                }
                messaging()
                return closeModal()
            }
        }
        return null;
    }

    const options = [{ label: "Administrator", value: "Administrator" }, { label: "Approver", value: "Approver" }, { label: "Editor", value: "Editor" },]
    return (
        <>
            {contextHolder}
            <Modal
                title={renderingTitle(`Staff member: ${profile.firstName} ${profile.lastName} Current role in company: ${profile.role}`)}
                centered
                open={true}
                onCancel={() => closeModal()}
                footer={[]}
                maskClosable={false}
            >
                {user.role === "Administrator" ? <form
                    style={{
                        ...CenteringGrid, flexDirection: "column",
                        width: "100%",
                    }}
                    onSubmit={(e) => handleSubmitNewRole(e)}
                >
                    <Grid container>
                        <Grid margin={'1rem auto'} item xs={12} sm={12} md={12} lg={12}>
                            <Select
                                className="custom-autocomplete"
                                style={{ ...AntSelectorStyle, width: "100%" }}
                                onChange={(e) => setNewRole(e.target.value)}
                            >
                                <MenuItem value="">None</MenuItem>
                                {options.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        <Typography>{option.label}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>

                        <Grid display={"flex"} flexDirection={'row'} justifyContent={'space-between'} alignItems={"center"} gap={2} container>
                            <Button
                                htmlType="submit"
                                style={{ ...BlueButton, width: "100%" }}
                            >
                                <Typography
                                    textTransform={"none"}
                                    style={{ ...BlueButtonText, ...CenteringGrid }}
                                >
                                    Save
                                </Typography>
                            </Button>
                        </Grid>
                    </Grid>
                </form> : <div><Divider />{renderingTitle('Need permission of Administrator for this function.')}</div>}
            </Modal>
        </>);
};

export default UpdateRoleInCompany