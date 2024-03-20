import { Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
// import { read, utils } from 'xlsx';
import { devitrakApi } from '../../../../api/devitrakApi';
import { GrayButton } from '../../../../styles/global/GrayButton';
import GrayButtonText from '../../../../styles/global/GrayButtonText';
import { XLSXIcon } from '../../../../components/icons/Icons';
import { Tooltip } from 'antd';
const SpreadSheet = () => {
    const { event } = useSelector((state) => state.event)
    const transactionDeviceRecordInEvent = useQuery({
        queryKey: ['transactionAndDeviceRecord'],
        queryFn: () => devitrakApi.post('/receiver/receiver-assigned-list', {
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        }),
        enabled: false,
        refetchOnMount: false
    })
    useEffect(() => {
        const controller = new AbortController()
        transactionDeviceRecordInEvent.refetch()
        return () => {
            controller.abort()
        }
    }, [])

    return (
        <div style={{ margin: "0 0 0.5rem" }}>
            <Tooltip title="Under construction">
                <button disabled style={{ ...GrayButton, width: "100%" }}><Typography textTransform={"none"}
                    textAlign={"left"}
                    style={{ ...GrayButtonText, margin: "auto" }}><XLSXIcon /> Export device/transaction record (<span style={{ textDecoration: "underline" }}>xlsx format</span>)</Typography></button>
            </Tooltip>

        </div >
    )
}

export default SpreadSheet