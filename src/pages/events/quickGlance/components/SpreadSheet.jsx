import { Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { utils, writeFile } from 'xlsx';
import { devitrakApi } from '../../../../api/devitrakApi';
import { XLSXIcon } from '../../../../components/icons/Icons';
import { GrayButton } from '../../../../styles/global/GrayButton';
import GrayButtonText from '../../../../styles/global/GrayButtonText';
import { message } from 'antd'
const SpreadSheet = () => {
    const [fileName, setFileName] = useState('');
    const [items, setItems] = useState([]);
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
    useEffect(() => {
        const controller = new AbortController()
        if (transactionDeviceRecordInEvent.data) {
            return setItems(transactionDeviceRecordInEvent.data.data.listOfReceivers)
        }
        return () => {
            controller.abort()
        }
    }, [transactionDeviceRecordInEvent.data])
    const [messageApi, contextHolder] = message.useMessage();
    const success = () => {
        messageApi.open({
            type: 'success',
            content: 'This is a success message',
        });
    };
    const generateExcelFile = async () => {
        // Your data array
        const data = items;

        // Define the header columns based on your expectation
        const headers = [
            'device - serial number',
            'device - device type',
            'paymentIntent',
            'user',
            'active',
            'eventSelected',
            'provider',
            'timeStamp',
            'id'
        ];

        // Convert data to worksheet format
        const wsData = [headers, ...data.map(item => [
            item.device.serialNumber,
            item.device.deviceType,
            item.paymentIntent,
            item.user,
            item.active ? "In-use" : "In-stock",
            item.eventSelected.join(', '), // Convert array to comma-separated string
            item.provider.join(', '), // Convert array to comma-separated string
            item.timeStamp,
            item.id
        ])];

        // Create a new workbook
        const wb = utils.book_new();

        // Add the worksheet data to the workbook
        const ws = utils.aoa_to_sheet(wsData);
        utils.book_append_sheet(wb, ws, 'Sheet1'); // You can change the sheet name if needed

        // Generate a random file name (you can customize this logic)
        const newFileName = `excel_${Date.now()}.xlsx`;

        // Write the workbook to a file
        await writeFile(wb, newFileName);

        // Set the generated file name to state
        setFileName(newFileName);
        // await 
    };

    useEffect(() => {
        const controller = new AbortController()
        if (fileName !== "") {
            setTimeout(() => {
                setFileName('')
            }, 3000);
        }
        success()
        return () => {
            controller.abort()
        }
    }, [transactionDeviceRecordInEvent.data, fileName])

    return (
        <div style={{ margin: "0 0 0.5rem" }}>
            <button onClick={generateExcelFile} style={{ ...GrayButton, width: "100%" }}><Typography textTransform={"none"}
                textAlign={"left"}
                style={{ ...GrayButtonText, margin: "auto" }}><XLSXIcon /> Export record (<span style={{ textDecoration: "underline" }}>xlsx format</span>)</Typography></button>
            {fileName && (<>
                <a href={fileName} download={fileName}>
                    Downloading Excel File
                </a>
                {contextHolder}
            </>
            )}
        </div >
    )
}

export default SpreadSheet