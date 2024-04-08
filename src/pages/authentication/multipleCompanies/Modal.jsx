import { Grid, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { Button, Modal, Space, notification } from "antd"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { devitrakApi, devitrakApiAdmin } from "../../../api/devitrakApi"
import renderingTitle from "../../../components/general/renderingTitle"
import { clearErrorMessage, onLogin } from "../../../store/slices/adminSlice"
import { BlueButton } from "../../../styles/global/BlueButton"
import { BlueButtonText } from "../../../styles/global/BlueButtonText"

const ModalMultipleCompanies = ({ openMultipleCompanies, setOpenMultipleCompanies, data: dataPassed }) => {
    const closeModal = () => {
        return setOpenMultipleCompanies(false)
    }
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, msg) => {
        api.open({
            message: msg,
            duration: 0
        });
    };
    const queryClient = useQueryClient()
    const loginIntoOneCompanyAccount = async (props) => {
        const respo = await devitrakApiAdmin.post("/login", {
            email: dataPassed.email,
            password: dataPassed.password,
        });
        if (respo.data) {
            console.log("🚀 ~ loginIntoOneCompanyAccount ~ respo.data:", respo.data)
            localStorage.setItem("admin-token", respo.data.token);
            const updatingOnlineStatusResponse = await devitrakApiAdmin.patch(`/profile/${respo.data.uid}`, {
                online: true
            });
            const respoFindMemberInfo = await devitrakApi.post("/db_staff/consulting-member", {
                email: dataPassed.email,
            })
            const companyInfoTable = await devitrakApi.post("/db_company/consulting-company", {
                company_name: props.company
            })
            const stripeSQL = await devitrakApi.post('/db_stripe/consulting-stripe', {
                company_id: companyInfoTable.data.company.at(-1).company_id
            })
            dispatch(
                onLogin({
                    data: { ...respo.data.entire, online: updatingOnlineStatusResponse.data.entire.online, },
                    name: respo.data.name,
                    lastName: respo.data.lastName,
                    uid: respo.data.uid,
                    email: respo.data.email,
                    role: props.role,
                    phone: respo.data.phone,
                    company: props.company,
                    token: respo.data.token,
                    online: updatingOnlineStatusResponse.data.entire.online,
                    sqlMemberInfo: respoFindMemberInfo.data.member.at(-1),
                    sqlInfo: { ...companyInfoTable.data.company.at(-1), stripeID: stripeSQL.data.stripe.at(-1) },
                })
            );

            dispatch(clearErrorMessage())
            queryClient.clear()
            openNotificationWithIcon('success', 'User logged in.')
            navigate('/')
        }

    }
    return (
        <Modal
            open={openMultipleCompanies}
            onCancel={() => closeModal()}
            centered
            // width={1000}
            footer={[]}
            title={renderingTitle("Please select which company you want to log in.")}
        >
            {contextHolder}
            <Grid container>
                <Space size={[8, 16]} wrap>
                    {
                        dataPassed?.companyInfo?.map(item => {
                            return (
                                <Button key={item.company} style={{ ...BlueButton, height: "auto" }} onClick={() => loginIntoOneCompanyAccount(item)}>
                                    <Typography style={BlueButtonText}>{item.company}</Typography>
                                </Button>
                            )
                        })
                    }
                </Space>

            </Grid>
        </Modal>
    )
}

export default ModalMultipleCompanies