import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Card, Modal, Popconfirm, Select, Space, notification } from "antd"
import { useDispatch, useSelector } from "react-redux"
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
import { onAddEventData, onAddEventStaff } from "../../../../../store/slices/eventSlice"
import _ from 'lodash';

const EditingStaff = ({ editingStaff, setEditingStaff }) => {
    const { register, handleSubmit } = useForm()
    const [loadingStatus, setLoadingStatus] = useState(false)
    const [roleSelected, setRoleSelected] = useState('')
    const { event } = useSelector((state) => state.event)
    const dispatch = useDispatch()
    const staffEventQuery = useQuery({
        queryKey: ['staffEvent'],
        queryFn: () => devitrakApi.get('/staff/admin-users'),
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
        api.open({
            message: msg,

        });
    };
    if (staffEventQuery.data) {
        const employee = staffEventQuery.data.data.adminUsers
        const groupingEmployees = _.groupBy(employee, 'email')
        const result = new Map()
        const mergeStaffInEvent2 = async () => {
            for (let data of event.staff.adminUser) {
                if (groupingEmployees[data.email]) {
                    if (!result.has(data.email)) {
                        result.set(data.email, { name: `${groupingEmployees[data.email].at(-1).name} ${groupingEmployees[data.email].at(-1).lastName}`, role: "Administrator", online: groupingEmployees[data.email].at(-1).online, email: groupingEmployees[data.email].at(-1).email, id: groupingEmployees[data.email].at(-1).id })
                    }
                }
                if (!result.has(data.email)) {
                    result.set(data.email, { name: `${data.firstName} ${data.lastName}`, role: "Assistant", online: false, email: data.email })
                }
            }
            for (let data of event.staff.headsetAttendees) {
                if (groupingEmployees[data.email]) {
                    if (!result.has(data.email)) {
                        result.set(data.email, { name: `${groupingEmployees[data.email].at(-1).name} ${groupingEmployees[data.email].at(-1).lastName}`, role: "Assistant", online: groupingEmployees[data.email].at(-1).online, email: groupingEmployees[data.email].at(-1).email, id: groupingEmployees[data.email].at(-1).id })
                    }
                }
                if (!result.has(data.email)) {
                    result.set(data.email, { name: `${data.firstName} ${data.lastName}`, role: "Assistant", online: false, email: data.email })
                }
            }
        }
        mergeStaffInEvent2()
        const closeModal = () => {
            return setEditingStaff(false)
        }

        const removeStaff = async (props) => {
            if (String(props.role).toLowerCase() === "administrator") {
                const result = event.staff.adminUser.filter(member => member !== props.email)
                const responseUpdating = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                    staff: {
                        adminUser: result,
                        headsetAttendees: event.staff.headsetAttendees
                    }
                })
                dispatch(onAddEventData(responseUpdating.data.event))
                dispatch(onAddEventStaff(responseUpdating.data.event.staff))
            } else {
                const result = event.staff.headsetAttendees.filter(member => member.email !== props.email)
                const responseUpdating = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                    staff: {
                        adminUser: event.staff.adminUser,
                        headsetAttendees: result
                    }
                })
                dispatch(onAddEventData(responseUpdating.data.event))
                dispatch(onAddEventStaff(responseUpdating.data.event.staff))
            }
        }
        const handleChange = (value) => {
            return setRoleSelected(value)
        };
        const handleNewStaffMember = async (data) => {
            try {
                setLoadingStatus(true)
                if (String(roleSelected).toLowerCase() === "administrator") {
                    const result = [...event.staff.adminUser, { firstName: data.name, lastName: data.lastName, email: data.email }]
                    const response = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                        staff: {
                            adminUser: result,
                            headsetAttendees: event.staff.headsetAttendees
                        }
                    })
                    dispatch(onAddEventData(response.data.event))
                    dispatch(onAddEventStaff(response.data.event.staff))
                } else {
                    const result = [...event.staff.headsetAttendees, { firstName: data.name, lastName: data.lastName, email: data.email }]
                    const response = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
                        staff: {
                            adminUser: event.staff.adminUser,
                            headsetAttendees: result
                        }
                    })
                    dispatch(onAddEventData(response.data.event))
                    dispatch(onAddEventStaff(response.data.event.staff))
                }
                queryClient.invalidateQueries({ queryKey: ['staffEvent'], exact: true })
                setLoadingStatus(false)
                openNotificationWithIcon('success', 'Staff member added to event.')
                await closeModal()
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
                                <OutlinedInput placeholder="Email" {...register('email')} style={{ ...OutlinedInputStyle, width: "100%" }} />
                                <OutlinedInput placeholder="First name" style={{ ...OutlinedInputStyle, width: "100%" }} {...register('name', { required: true })} />
                                <OutlinedInput placeholder="Last name" style={{ ...OutlinedInputStyle, width: "100%" }} {...register('lastName', { required: true })} />
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
                                    [...result.values()].map(member => {
                                        console.log('member', member)
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