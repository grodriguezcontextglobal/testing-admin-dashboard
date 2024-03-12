import { Grid, OutlinedInput, Typography } from '@mui/material'
import { Button, Modal, notification } from 'antd'
import { useForm } from 'react-hook-form'
import _ from "lodash"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { devitrakApi } from '../../../../../../api/devitrakApi'
import { OutlinedInputStyle } from '../../../../../../styles/global/OutlinedInputStyle'
import { BlueButton } from '../../../../../../styles/global/BlueButton'
import { BlueButtonText } from '../../../../../../styles/global/BlueButtonText'
import { TextFontSize30LineHeight38 } from '../../../../../../styles/global/TextFontSize30LineHeight38'
import CenteringGrid from '../../../../../../styles/global/CenteringGrid'
import { PropTypes } from 'prop-types'
import { useState } from 'react'
const ReturningInBulkMethod = ({ openReturnDeviceBulkModal, setOpenReturnDeviceInBulkModal, record, refetching }) => {
    const deviceInTransactionQuery = useQuery({
        queryKey: ['assignedDeviceInTransaction'],
        queryFn: () => devitrakApi.post('/receiver/receiver-assigned-list', {
            eventSelected: record.eventSelected,
            paymentIntent: record.paymentIntent
        }),
        refetchOnMount: false
    })
    const deviceInPoolQuery = useQuery({
        queryKey: ['deviceInTransactionInPool'],
        queryFn: () => devitrakApi.post('/receiver/receiver-pool-list', {
            eventSelected: record.eventSelected,
            provider: record.provider,
            activity: "YES",
            type: record.deviceType
        }),
        refetchOnMount: false
    })
    const [loadingStatus, setLoadingStatus] = useState(false)
    const { register, handleSubmit } = useForm()
    const queryClient = useQueryClient()
    const [api, contextHolder] = notification.useNotification()
    const openNotificationWithIcon = (type, msg) => {
        api[type]({
            message: msg
        });
    };

    const closeModal = () => {
        setOpenReturnDeviceInBulkModal(false)
    }
    const renderingTitle = () => {
        return (
            <Typography
                textTransform={"none"}
                style={{ ...TextFontSize30LineHeight38, textWrap: "balance" }}
                padding={"1rem 1.5rem"}
            >
                Return devices in sequential order based on their serial numbers.
            </Typography>
        );
    };

    const returnDevicesInTransaction = async ({ device }) => {
        const findTransaction = _.groupBy(deviceInTransactionQuery.data.data.listOfReceivers, 'device.serialNumber')
        if (findTransaction[device].at(-1).id) {
            await devitrakApi.patch(`/receiver/receiver-update/${findTransaction[device].at(-1).id}`, {
                id: findTransaction[device].at(-1).id,
                device: {
                    ...findTransaction[device].at(-1).device,
                    status: false
                },
                timeStamp: new Date().getTime()
            })
        }
        queryClient.invalidateQueries('assginedDeviceList', { exact: true });
    }

    const returnDeviceInPool = async (props) => {
        const deviceInPoolData = _.groupBy(deviceInPoolQuery.data.data.receiversInventory, 'device')
        if (deviceInPoolData[props].at(-1).id) {
            await devitrakApi.patch(`/receiver/receivers-pool-update/${deviceInPoolData[props].at(-1).id}`, { device: props, activity: "No", status: "Operational" })
            queryClient.invalidateQueries('assginedDeviceList', { exact: true });
        }
    }
    const handleReturnDevices = async (data) => {
        setLoadingStatus(true)
        const startingNumber = data.startingNumber
        const endingNumber = data.endingNumber
        for (let i = startingNumber; i <= endingNumber; i++) {
            await returnDeviceInPool(String(i).padStart(startingNumber.length, `${startingNumber[0]}`))
            await returnDevicesInTransaction({ device: String(i).padStart(startingNumber.length, `${startingNumber[0]}`) })
        }
        openNotificationWithIcon('success', 'All devices returned!')
        queryClient.invalidateQueries('assginedDeviceList', { exact: true });
        refetching()
        setLoadingStatus(false)
        setTimeout(() => {
            return closeModal()
        }, 2500);
    }
    return (
        <Modal
            open={openReturnDeviceBulkModal}
            title={renderingTitle()}
            onOk={() => closeModal()}
            onCancel={() => closeModal()}
            footer={[]}
            maskClosable={false}
            width={1000}>
            {contextHolder}
            <form style={CenteringGrid} onSubmit={handleSubmit(handleReturnDevices)}>
                <Grid display={'flex'} justifyContent={'space-between'} alignItems={'center'} margin={'auto'} container padding={2} spacing={2}>
                    <Grid item xs={12} sm={12} md={4} lg={4}>
                        <OutlinedInput placeholder="Starting number" style={OutlinedInputStyle}{...register('startingNumber', { required: true })} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={12} md={4} lg={4}>

                        <OutlinedInput placeholder="Ending number" style={OutlinedInputStyle} {...register('endingNumber', { required: true })} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={12} md={4} lg={4}>
                        <Button
                            htmlType='submit'
                            loading={loadingStatus}
                            style={{ ...BlueButton, width: "100%" }}
                        >
                            <Typography
                                textTransform={"none"}
                                style={{ ...BlueButtonText, ...CenteringGrid, cursor: "pointer" }}
                            >
                                Return devices
                            </Typography>
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Modal>
    )
}

export default ReturningInBulkMethod

ReturningInBulkMethod.propTypes = {
    openReturnDeviceBulkModal: PropTypes.bool,
    setOpenReturnDeviceInBulkModal: PropTypes.bool,
    record: PropTypes.object,
    refetching: PropTypes.func,
}