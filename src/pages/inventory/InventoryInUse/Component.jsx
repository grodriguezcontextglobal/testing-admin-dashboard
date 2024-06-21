import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';import { Table, Tooltip } from 'antd';
import { Icon } from '@iconify/react';
import { devitrakApi } from '../../../api/devitrakApi';
import '../../../styles/global/ant-table.css'
const Component = ({ searchDevice }) => {
    const { event } = useSelector((state) => state.event)
    const dataFetched = useQuery({
        queryKey: ['devicesPoolList'],
        queryFn: () => devitrakApi.post('/receiver/receiver-pool-list', {
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        })
    });

    const sortDataPerEventAndCompany = () => {
        if (!searchDevice || String(searchDevice).length < 1) {
            return dataFetched?.data?.data?.receiversInventory
        }
        const check = dataFetched?.data?.data?.receiversInventory.filter(
            (item) => `${item.device}`.toLowerCase().includes(`${searchDevice}`.toLowerCase())
        );
        return check;
    }
    const getInfoNeededToBeRenderedInTable = () => {
        const result = new Set()
        let mapTemplate = {};
        const dataSorted = sortDataPerEventAndCompany();
        if (dataSorted) {
            for (let element of dataSorted) {
                mapTemplate = {
                    company: [element.type, element.provider],
                    activity: `${String(element.status).toLowerCase() === "lost" ? "LOST" : element.activity}`,
                    status: element.status,
                    type: element.type,
                    serialNumber: element.device,
                    user: element.activity,
                    entireData: element,
                };
                result.add(mapTemplate);
            }
        }
        return Array.from(result)
    };

    const columns = [
        {
            title: 'Serial number',
            dataIndex: 'serialNumber',
            key: 'serialNumber',
            sorter: {
                compare: (a, b) => a.serialNumber - b.serialNumber,
            }
        },
        {
            title: 'Device type',
            dataIndex: 'type',
            key: 'type',
            sorter: {
                compare: (a, b) => (a.type).localeCompare(b.type),
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: {
                compare: (a, b) => (a.status).localeCompare(b.status)
            },
            filterIcon: () => (<Tooltip title="Filter" ><Icon icon="material-symbols:filter-alt" width={25} /></Tooltip>),
            filters: [
                {
                    text: "Operational",
                    value: "Operational",
                },
                {
                    text: "Network",
                    value: "Network",
                },
                {
                    text: "Hardware",
                    value: "Hardware",
                },
                {
                    text: "Damage",
                    value: "Damage",
                },
                {
                    text: "Battery",
                    value: "Battery",
                },
                {
                    text: "Lost",
                    value: "Lost",
                },
                {
                    text: "Other",
                    value: "Other",
                },
            ],
            onFilter: (value, record) => record.status.startsWith(value),
            filterSearch: true,
        },
        {
            title: 'In use',
            dataIndex: 'activity',
            key: 'activity',
            sorter: {
                compare: (a, b) => (a.activity).localeCompare(b.activity)
            },
            filterIcon: () => (<Tooltip title="Filter" ><Icon icon="material-symbols:filter-alt" width={25} /></Tooltip>),
            filters: [
                {
                    text: "In Use",
                    value: true,
                },
                {
                    text: "In Stock",
                    value: false,
                },
                {
                    text: "Lost",
                    value: "LOST",
                },
            ],
            onFilter: (value, record) => record.activity === value,
            filterSearch: true,
            render: (activity) => (
                <span style={{ textTransform: 'capitalize' }}>{activity}</span>
            )
        },
    ];

    return <Table dataSource={getInfoNeededToBeRenderedInTable()} columns={columns} style={{ width: "100%" }} className='table-ant-customized' />;
}

export default Component;