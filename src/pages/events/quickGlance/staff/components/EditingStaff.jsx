import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Card, Modal, Popconfirm, Select, Space, notification } from "antd"
import { useSelector } from "react-redux"
import { devitrakApi } from "../../../../../api/devitrakApi"
import { useEffect, useState } from "react"
import { Grid, OutlinedInput, Typography } from "@mui/material"
import { CardStyle } from "../../../../../styles/global/CardStyle"
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle"
import { useForm } from "react-hook-form"
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText"
import { BlueButton } from "../../../../../styles/global/BlueButton"
import GrayButtonText from "../../../../../styles/global/GrayButtonText"
import { GrayButton } from "../../../../../styles/global/GrayButton"
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle"

const EditingStaff = ({ editingStaff, setEditingStaff }) => {
    const { register, handleSubmit } = useForm()
    const [loadingStatus, setLoadingStatus] = useState(false)
    const [roleSelected, setRoleSelected] = useState('')
    const { event } = useSelector((state) => state.event)
    const staffEventQuery = useQuery({
        queryKey: ['staffEvent'],
        queryFn: () => devitrakApi.post('/staff/admin-users', {
            company: event.company
        }),
        enabled: false,
        refetchOnMount: false,
        staleTime: Infinity,
        cacheTime: 1000 * 60 * 60 //oneHourInMs
    })
    useEffect(() => {
        const controller = new AbortController()
        staffEventQuery.refetch()
        return () => {
            controller.abort()
        }
    }, [])
    const queryClient = useQueryClient()
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, msg) => {
        api[type]({
            message: msg,

        });
    };
    if (staffEventQuery.data) {
        const staffMember = new Map()
        const organizeStaff = () => {
            const membersCompany = staffEventQuery.data.data.adminUsers
            for (let data of membersCompany) {
                staffMember.set(data.email, data)
            }
        }
        organizeStaff()
        const dataFoundToRender = () => {
            const result = new Set()
            const admins = event.staff.adminUser
            const assistants = event.staff.headsetAttendees
            if (admins) {
                for (let data of admins) {
                    if (staffMember.has(data)) {
                        const member = staffMember.get(data)
                        result.add({ ...member, name: `${member.name} ${member.lastName}`, role: "Administrator" })
                    }

                }
            }
            if (assistants) {
                for (let data of assistants) {
                    if (staffMember.has(data)) {
                        const member = staffMember.get(data)
                        result.add({ ...member, name: `${member.name} ${member.lastName}`, role: "Assistant" })
                    }
                }
            }
            return Array.from(result)
        }
        const closeModal = () => {
            return setEditingStaff(false)
        }

        const removeStaff = async (props) => {
            if (String(props.role).toLowerCase() === "administrator") {
                const result = event.staff.adminUser.filter(member => member !== props.email)
                await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                    staff: {
                        adminUser: result,
                        headsetAttendees: event.staff.headsetAttendees
                    }
                })
            } else {
                const result = event.staff.headsetAttendees.filter(member => member !== props.email)
                await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                    staff: {
                        adminUser: event.staff.adminUser,
                        headsetAttendees: result
                    }
                })
            }
        }
        const handleChange = (value) => {
            return setRoleSelected(value)
        };
        const handleNewStaffMember = async (data) => {
            try {
                setLoadingStatus(true)
                if (String(roleSelected).toLowerCase() === "administrator") {
                    const result = [...event.staff.adminUser, data.email]
                    await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                        staff: {
                            adminUser: result,
                            headsetAttendees: event.staff.headsetAttendees
                        }
                    })
                } else {
                    const result = [...event.staff.headsetAttendees, data.email]
                    await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                        staff: {
                            adminUser: event.staff.adminUser,
                            headsetAttendees: result
                        }
                    })
                }
                queryClient.invalidateQueries({ queryKey: ['staffEvent'], exact: true })
                setLoadingStatus(false)
                openNotificationWithIcon('success', 'Staff member added to event.')
                setTimeout(() => {
                    closeModal()
                }, 2500);
            } catch (error) {
                console.log("🚀 ~ handleNewStaffMember ~ error:", error)
                setLoadingStatus(false)
            }

        }
        return (
            <Modal
                open={editingStaff}
                onCancel={() => closeModal()}
                centered
                width={1000}
                footer={[]}
            >
                {contextHolder}
                <Grid container>
                    <Grid item xs={10} sm={10} md={10} lg={10}>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                            <form style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px"
                            }} onSubmit={handleSubmit(handleNewStaffMember)}>
                                <OutlinedInput {...register('email')} style={{ ...OutlinedInputStyle, width: "70%", gap: "5px" }} />
                                <Select style={{ ...AntSelectorStyle, width: "100%" }} onChange={handleChange}
                                    options={[
                                        {
                                            value: 'administrator',
                                            label: 'Administrator',
                                        },
                                        {
                                            value: 'headsetAttendee',
                                            label: 'Assistant',
                                        }]}></Select>
                                <Button style={BlueButton} loading={loadingStatus} htmlType="submit"><Typography style={BlueButtonText}>Add staff</Typography></Button>
                            </form>

                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                            <Space size={[8, 16]} wrap>
                                {
                                    dataFoundToRender().map(member => {
                                        return (
                                            <Card title={member.role} key={member.id} extra={[
                                                <Popconfirm title="Are you sure you want to remove this member from event?" key={member.id} onConfirm={() => removeStaff(member)}>
                                                    <Button style={GrayButton}><Typography textTransform={'uppercase'} style={GrayButtonText}>x</Typography></Button>
                                                </Popconfirm>
                                            ]}
                                                style={{ ...CardStyle, alignSelf: "flex-start" }}
                                            >
                                                <Grid container>
                                                    <Grid item xs={12} sm={12} md={12} lg={12}>
                                                        {member.name}
                                                    </Grid>
                                                    <Grid item xs={12} sm={12} md={12} lg={12}>
                                                        {member.email}
                                                    </Grid>
                                                </Grid>
                                            </Card>
                                        )
                                    })
                                }
                            </Space>
                        </Grid>
                    </Grid>
                </Grid>
            </Modal >
        )
    }
}

export default EditingStaff