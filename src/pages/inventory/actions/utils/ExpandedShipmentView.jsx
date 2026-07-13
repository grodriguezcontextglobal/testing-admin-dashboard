import { useQuery } from "@tanstack/react-query";
import { Button, message } from "antd";
import DevitrakLoading from "../../../../components/animation/DevitrakLoading";
import { saveAs } from "file-saver";
import { useCallback, useState } from "react";
import { devitrakApi } from "../../../../api/devitrakApi";
import BaseTable from "../../../../components/UX/tables/BaseTable";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        day: 'numeric', hour: '2-digit', minute: '2-digit',
        month: 'short', year: 'numeric',
    });
};

const ExpandedShipmentView = ({ package_list, record }) => {
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
    const [isExporting, setIsExporting] = useState(false);
    const handleDownloadReport = useCallback(async () => {
        const items = itemsQuery.data?.data?.items ?? [];
        if (items.length === 0) {
            message.warning('No inventory to generate the report.');
            return;
        }

        setIsExporting(true);
        try {
            const ExcelJS = (await import('exceljs')).default;
            const wb = new ExcelJS.Workbook();
            wb.creator = 'Devitrak';
            wb.created = new Date();

            // ── Sheet 1: Shipment summary ─────────────────────────────────────
            const wsSummary = wb.addWorksheet('Shipment Summary');
            wsSummary.columns = [
                { header: 'Field', key: 'field', width: 28 },
                { header: 'Value', key: 'value', width: 46 },
            ];
            wsSummary.getRow(1).font = { bold: true };

            const summaryRows = [
                { field: 'Event Name', value: record.event_name },
                { field: 'Destination / Location', value: record.destination },
                { field: 'Ship-Out Date', value: record.ship_out_date ? formatDateTime(record.ship_out_date) : '—' },
                { field: 'Courier', value: record.courier || '—' },
                { field: 'Tracking Number', value: record.tracking_number || '—' },
                { field: 'Authorized By', value: record.authorizer_name || '—' },
                { field: 'Who will receive inventory at destination', value: record.recipient_name || '—' },
                { field: 'Total Items', value: items.length },
                { field: 'Report Generated', value: new Date().toLocaleString() },
            ];
            summaryRows.forEach((r) => wsSummary.addRow(r));

            // ── Sheet 2: Packaging list ───────────────────────────────────────
            const wsItems = wb.addWorksheet('Packaging List');
            wsItems.columns = [
                { header: '#', key: 'idx', width: 6 },
                { header: 'Serial Number', key: 'serial_number', width: 22 },
                { header: 'Item / Group', key: 'item_group', width: 28 },
                { header: 'Category', key: 'category_name', width: 20 },
                { header: 'Condition', key: 'status', width: 14 },
                { header: 'Shipping Status', key: 'shipping_status', width: 20 },
                { header: 'Location (Origin)', key: 'location', width: 24 },
            ];
            wsItems.getRow(1).font = { bold: true };
            wsItems.views = [{ state: 'frozen', ySplit: 1 }];

            items.forEach((item, i) => {
                wsItems.addRow({
                    category_name: item.category_name ?? '',
                    idx: i + 1,
                    item_group: item.item_group ?? item.item_name ?? '',
                    location: item.location ?? item.main_warehouse ?? '',
                    serial_number: item.serial_number ?? '',
                    shipping_status: item.shipping_status ?? '',
                    status: item.status ?? item.condition ?? '',
                });
            });

            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const eventName = record.event_name || 'shipment';
            saveAs(blob, `shipping_report_${eventName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
            message.success('Report downloaded.');
        } catch (err) {
            console.error(err);
            message.error('Failed to generate report.');
        } finally {
            setIsExporting(false);
        }
    }, [itemsQuery.data, record]);


    const columns = [
        { title: 'Serial Number', dataIndex: 'serial_number', key: 'serial_number' },
        { title: 'Group', dataIndex: 'item_group', key: 'item_group' },
        { title: 'Status', dataIndex: 'status', key: 'status' },
    ];

    if (itemsQuery.isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><DevitrakLoading /></div>;
    }

    if (itemsQuery.isError) {
        return <p>Error loading item details.</p>;
    }

    return (
        <div style={{ width: "100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button
                    type="default"
                    onClick={handleDownloadReport}
                    loading={isExporting}
                    disabled={isExporting}
                >
                    Download Report
                </Button>
            </div>
            <BaseTable columns={columns} dataSource={packageData} enablePagination={true} pageSize={10} />
        </div>
    )
};

export default ExpandedShipmentView;