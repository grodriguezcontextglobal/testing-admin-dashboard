import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { useState } from "react";
import { devitrakApi } from "../../../../api/devitrakApi";
import BaseTable from "../../../../components/UX/tables/BaseTable";
const ExpandedShipmentView = ({ package_list }) => {
    const itemIds = package_list.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    const [packageData, setPackageData] = useState([]);
    const itemsQuery = useQuery({
        queryKey: ['items', itemIds],
        queryFn: () => devitrakApi.post('/db_shipment/package-list', {
            package_list: itemIds
        }),
        enabled: !!itemIds.length,
        onSuccess: (data) => {
            setPackageData(data?.data?.items || []);
        }
    });

    const columns = [
        { title: 'Serial Number', dataIndex: 'serial_number', key: 'serial_number' },
        { title: 'Group', dataIndex: 'item_group', key: 'item_group' },
        { title: 'Status', dataIndex: 'status', key: 'status' },
    ];

    if (itemsQuery.isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spin tip="Loading items..." /></div>;
    }

    if (itemsQuery.isError) {
        return <p>Error loading item details.</p>;
    }

    return <div style={{ width: "100%", margin:"auto" }}>
        <BaseTable columns={columns} dataSource={packageData} enablePagination={true} pageSize={10} />
    </div>
};

export default ExpandedShipmentView;
