import { Typography } from '@mui/material';
import { Button, message } from 'antd';
import { useEffect, useState } from 'react';
import { utils, writeFile } from 'xlsx';
import { XLSXIcon } from '../../../components/icons/Icons';
const DownloadingXlslFile = ({ props }) => {
    const [fileName, setFileName] = useState('');
    // const [itemsUsers, setItemsUsers] = useState([]);
    // const [defectedItems, setDefectedItems] = useState([]);
    // const { event } = useSelector((state) => state.event)

    const [messageApi, contextHolder] = message.useMessage();
    const success = () => {
        messageApi.open({
            type: 'success',
            content: 'xlsx file generated and downloading.',
        });
    };

    // key: '2560-null',
    //     item_id: 2560,
    //     serial_number: '3504102058559',
    //     warehouse: 1,
    //     category_name: 'Body lotion',
    //     item_group: 'Mustela hydra body lotion',
    //     cost: '12',
    //     ownership: 'Permanent',
    //     status: null,
    //     condition: null,
    //     event_name: null,
    //     data: {
    //       item_id: 2560,
    //       serial_number: '3504102058559',
    //       warehouse: 1,
    //       category_name: 'Body lotion',
    //       item_group: 'Mustela hydra body lotion',
    //       cost: '12',
    //       ownership: 'Permanent',
    //       status: 'Operational',
    //       condition: null,
    //       event_name: null,
    //       location: 'Plantation, Fl',
    //       descript_item: 'Daily moisturizing lotion with natural avocado oil.',
    //       company: 'QWE, inc',
    //       create_at: '2024-04-05T22:57:08.000Z',
    //       update_at: '2024-04-25T20:34:41.000Z',
    //       main_warehouse: 'Plantation, Fl',
    //       current_location: 'Plantation, Fl',
    //       brand: 'Mustela'
    //     },
    //     location: 'Plantation, Fl'
    //   },

    const dictionaryOwnership = {
        'Permanent':"Owned",
        'Rent': "Leased",
        "Sale":"For Sale"
    }

    const generateExcelFile = async () => {
        // Define the header columns for Sheet1
        const headers = [
            'Serial number',
            'Warehouse',
            'Brand',
            'Category name',
            'Group name',
            'Ownership',
            'Condition',
            'Current location',
            'Tax location',
            'Description',
        ];

        // Convert data to worksheet format for Sheet1
        const wsData = [headers, ...props.map(item => [
            item.data.serial_number,
            item.data.warehouse === 1 ? "In-stock" : "In-use",
            item.data.brand,
            item.data.category_name,
            item.data.item_group,
            dictionaryOwnership[item.data.ownership],
            item.data.status,
            item.data.location,
            item.data.main_warehouse,
            item.data.descript_item,
        ])];

        // Create a new workbook
        const wb = utils.book_new();

        // Add Sheet1 to the workbook
        const wsSheet1 = utils.aoa_to_sheet(wsData);

        // // Set cell styles for Sheet1
        wsSheet1['!cols'] = [{ width: 20 }, { width: 20 }, { width: 30 }, { width: 20 }, { width: 30 }, { width: 20 }, { width: 20 }, { width: 30 }, { width: 20 }, { width: 30 }];
        // wsSheet1['E1'].l = { Target: "#Details!A1" }
        for (let colTitle of headers) {
            const headerCellAddress = utils.encode_cell({ r: 0, c: headers.indexOf(`${colTitle}`) });
            wsSheet1[headerCellAddress].s = {
                fill: { patternType: 'solid', bgColor: { rgb: '#ee1515' } },
                font: {
                    name: 'Inter',
                    sz: 16,
                    color: { rgb: '#fff' },
                    bold: true,
                    italic: false,
                    underline: true
                }
            };
        }

        // // Set background color for "Pending devices" cell if value > 5
        // const pendingDevicesIndex = headers.indexOf('Pending devices to return');
        // if (pendingDevicesIndex !== -1) {
        //     // Iterate through data rows to check and set background color
        //     sortAndGroupData().forEach((item, rowIndex) => {
        //         const cellValue = item.pendingDevices;
        //         if (!isNaN(cellValue) && cellValue >= 5) {
        //             const cellAddress = utils.encode_cell({ r: rowIndex + 1, c: pendingDevicesIndex });
        //             wsSheet1[`${cellAddress}`].s = {
        //                 fill: { patternType: 'solid', bgColor: { rgb: '#ee1515' } },
        //                 font: {
        //                     name: 'Inter',
        //                     sz: 16,
        //                     color: { rgb: '#fff' },
        //                     bold: true,
        //                     italic: false,
        //                     underline: true
        //                 }
        //             };
        //         }
        //     });
        // }

        utils.book_append_sheet(wb, wsSheet1, 'Stock - Report');

        // // Your data array
        // const data = itemsUsers;

        // // Sheet2 config (Details)
        // const headers2 = [

        //     'User - First name',
        //     'User - Last name',
        //     'User - Email',
        //     'User - Phone number',
        //     'Device - Serial number',
        //     'Device - Device type',
        //     'Status',
        //     'Event',
        //     'Date - Assigned device',
        // ];

        // // Convert data to worksheet format for Sheet2 (all data in detail)
        // const wsDataDetail = [headers2, ...data.map(item => [

        //     item.userInfo.name,
        //     item.userInfo.lastName,
        //     item.user,
        //     item.userInfo.phoneNumber,
        //     item.device.serialNumber,
        //     item.device.deviceType,
        //     item.active ? "in-Use" : "in-Stock",
        //     item.eventSelected.join(', '), // Convert array to comma-separated string
        //     Date(item.timeStamp).toString()
        // ])];

        // // Add Sheet2 to the workbook
        // const wsSheet2 = utils.aoa_to_sheet(wsDataDetail);

        // // Set cell styles for Sheet1
        // wsSheet2['!cols'] = [{ width: 25 }, { width: 25 }, { width: 30 }, { width: 25 }, { width: 30 }, { width: 25 }, { width: 30 }, { width: 25 }, { width: 30 }];

        // utils.book_append_sheet(wb, wsSheet2, 'Details')
        // const headers3 = [
        //     'Device',
        //     'Device type',
        //     'Device Status',
        //     'Comment',
        // ];
        // const data2 = defectedDevicesInfo();

        // // Convert data to worksheet format for Sheet3 (all data in detail)
        // const wsDataDefected = [headers3, ...data2.map(item => [
        //     item.device,
        //     item.type,
        //     item.status,
        //     item.comment,
        // ])];

        // // Add Sheet3 to the workbook
        // const wsSheet3 = utils.aoa_to_sheet(wsDataDefected);

        // // Set cell styles for Sheet1
        // wsSheet3['!cols'] = [{ width: 25 }, { width: 25 }, { width: 30 }, { width: 25 }, { width: 30 }];

        // utils.book_append_sheet(wb, wsSheet3, 'Defected_and_Lost devices');

        // Generate a random file name (you can customize this logic)
        const newFileName = `excel_stock_report_${Date.now()}.xlsx`;

        // Write the workbook to a file
        await writeFile(wb, newFileName);

        // Set the generated file name to state
        setFileName(newFileName);
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
    }, [fileName])

    return (
        <>
            <Button
                onClick={generateExcelFile}
                style={{ display: "flex", alignItems: "center", borderTop: "transparent", borderRight: "transparent", borderBottom: "transparent", borderRadius: "8px 8px 0 0" }} >
                <Typography textTransform={"none"}
                    textAlign={"left"}
                    fontWeight={500}
                    fontSize={"12px"}
                    fontFamily={"Inter"}
                    lineHeight={"28px"}
                    color={"var(--blue-dark-700, #004EEB)"}
                    padding={"0px"}><XLSXIcon /> Export record (<span style={{ textDecoration: "underline" }}>xlsx format</span>)
                </Typography>
            </Button>
            {fileName && (<>
                <a href={fileName} download={fileName}>
                    Downloading file...
                </a>
                {contextHolder}
            </>
            )}
        </ >
    )
}

export default DownloadingXlslFile