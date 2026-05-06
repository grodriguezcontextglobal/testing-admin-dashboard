import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message, Tag, Divider, Spin } from 'antd';
import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Grid, Typography } from '@mui/material';
import { saveAs } from 'file-saver';

import ModalUX from '../../../components/UX/modal/ModalUX';
import Input from '../../../components/UX/inputs/Input';
import BaseTable from '../../../components/UX/tables/BaseTable';
import SelectComponent from '../../../components/UX/dropdown/SelectComponent';
import BlueButton from '../../../components/UX/buttons/BlueButton';
import GrayButton from '../../../components/UX/buttons/GrayButton';
import { devitrakApi } from '../../../api/devitrakApi';

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const statusColor = { locked_in_warehouse: 'blue', shipped: 'green', delivered: 'purple' };

// ─── component ───────────────────────────────────────────────────────────────

const ShippingInventoryModal = ({ visible, onClose }) => {
    const { user } = useSelector((state) => state.admin);
    const queryClient = useQueryClient();

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [destination, setDestination] = useState('');
    const [shipOutDate, setShipOutDate] = useState('');
    const [authorizer, setAuthorizer] = useState('');
    const [receiver, setReceiver] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const companyId = user?.infoSql?.company_id;

    // ── 1. active events with reserved inventory ──────────────────────────────
    const eventsQuery = useQuery({
        queryKey: ['shippingEvents', companyId],
        queryFn: async () => {
            const res = await devitrakApi.post('/db_item/event-items/search', {
                company_id: companyId,
                active: 1,
                shipping_status: 'locked_in_warehouse',
            });
            if (!res.data?.ok || !res.data?.items) return [];

            const map = new Map();
            res.data.items.forEach((item) => {
                if (!map.has(item.event_id)) {
                    map.set(item.event_id, {
                        id: item.event_id,
                        label: item.event_name,
                        address: item.event_address ?? '',
                        eventDate: item.event_date ?? null,
                    });
                }
            });
            return Array.from(map.values());
        },
        enabled: !!companyId && visible,
        staleTime: 30_000,
    });

    // ── 2. packaging list for selected event ──────────────────────────────────
    const itemsQuery = useQuery({
        queryKey: ['shippingItems', selectedEvent?.id],
        queryFn: async () => {
            const res = await devitrakApi.post('/db_item/event-items/search', {
                company_id: companyId,
                event_id: selectedEvent.id,
                shipping_status: 'locked_in_warehouse',
            });
            return res.data?.items ?? [];
        },
        enabled: !!selectedEvent,
        staleTime: 30_000,
    });

    // ── 3. ship-out mutation ──────────────────────────────────────────────────
    const shipOutMutation = useMutation({
        mutationFn: async ({ company_id, event_id, item_ids }) => {
            await Promise.all([
                devitrakApi.put('/db_item/event-items', {
                    company_id,
                    event_id,
                    items: item_ids,
                    updates: { shipping_status: 'in-transit' },
                }),
                devitrakApi.post('/update-large-data', {
                    item_ids,
                    warehouse: 0,
                }),
            ]);
        },
        onSuccess: () => {
            message.success('Inventory shipped out successfully.');
            queryClient.invalidateQueries({ queryKey: ['shippingEvents', companyId] });
            handleClose();
        },
        onError: () => message.error('Could not ship out inventory.'),
    });

    // ── handlers ──────────────────────────────────────────────────────────────

    const handleEventSelection = (event) => {
        setSelectedEvent(event ?? null);
        setDestination(event?.address ?? '');
        setShipOutDate('');
        setAuthorizer('');
        setReceiver('');
    };

    const handleClose = () => {
        setSelectedEvent(null);
        setDestination('');
        setShipOutDate('');
        setAuthorizer('');
        setReceiver('');
        onClose();
    };

    const isFormValid =
        selectedEvent &&
        destination.trim() &&
        shipOutDate &&
        authorizer.trim() &&
        receiver.trim();

    const handleShipOut = () => {
        if (!isFormValid) {
            message.warning('Please complete all required fields.');
            return;
        }
        const items = itemsQuery.data ?? [];
        if (items.length === 0) {
            message.warning('No items found for this event.');
            return;
        }
        const item_ids = items.map((item) => item.item_id);
        shipOutMutation.mutate({
            company_id: companyId,
            event_id: selectedEvent.id,
            item_ids,
        });
    };

    // ── report (XLSX) ─────────────────────────────────────────────────────────

    const handleDownloadReport = useCallback(async () => {
        const items = itemsQuery.data ?? [];
        if (!selectedEvent || items.length === 0) {
            message.warning('Select an event with inventory to generate the report.');
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
                { field: 'Event Name', value: selectedEvent.label },
                { field: 'Destination / Location', value: destination || selectedEvent.address },
                { field: 'Ship-Out Date', value: shipOutDate ? formatDateTime(shipOutDate) : '—' },
                { field: 'Authorized By', value: authorizer || '—' },
                { field: 'Received By', value: receiver || '—' },
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
                { header: 'Brand', key: 'brand', width: 18 },
                { header: 'Condition', key: 'status', width: 14 },
                { header: 'Shipping Status', key: 'shipping_status', width: 20 },
                { header: 'Location (Origin)', key: 'location', width: 24 },
            ];
            wsItems.getRow(1).font = { bold: true };
            wsItems.views = [{ state: 'frozen', ySplit: 1 }];

            items.forEach((item, i) => {
                wsItems.addRow({
                    idx: i + 1,
                    serial_number: item.serial_number ?? '',
                    item_group: item.item_group ?? item.item_name ?? '',
                    category_name: item.category_name ?? '',
                    brand: item.brand ?? '',
                    status: item.status ?? item.condition ?? '',
                    shipping_status: item.shipping_status ?? '',
                    location: item.location ?? item.main_warehouse ?? '',
                });
            });

            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `shipping_report_${selectedEvent.label.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
            message.success('Report downloaded.');
        } catch (err) {
            console.error(err);
            message.error('Failed to generate report.');
        } finally {
            setIsExporting(false);
        }
    }, [selectedEvent, itemsQuery.data, destination, shipOutDate, authorizer, receiver]);

    // ── packaging list columns ────────────────────────────────────────────────

    const columns = [
        {
            title: '#',
            key: 'idx',
            width: 50,
            render: (_, __, i) => i + 1,
        },
        {
            title: 'Serial Number',
            dataIndex: 'serial_number',
            key: 'serial_number',
            render: (v) => <Typography variant="body2" fontFamily="monospace">{v ?? '—'}</Typography>,
        },
        {
            title: 'Item / Group',
            dataIndex: 'item_group',
            key: 'item_group',
            render: (v, row) => v ?? row.item_name ?? '—',
        },
        {
            title: 'Category',
            dataIndex: 'category_name',
            key: 'category_name',
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
        },
        {
            title: 'Condition',
            dataIndex: 'status',
            key: 'status',
            render: (v, row) => v ?? row.condition ?? '—',
        },
        {
            title: 'Status',
            dataIndex: 'shipping_status',
            key: 'shipping_status',
            render: (v) => (
                <Tag color={statusColor[v] ?? 'default'}>
                    {v ? v.replace(/_/g, ' ') : '—'}
                </Tag>
            ),
        },
        {
            title: 'Origin Location',
            dataIndex: 'location',
            key: 'location',
            render: (v, row) => v ?? row.main_warehouse ?? '—',
        },
    ];

    // ── render ────────────────────────────────────────────────────────────────

    const body = (
        <Grid container spacing={2}>

            {/* ── Event selector ── */}
            <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Active Event
                </Typography>
                <SelectComponent
                    label="Select event with reserved inventory"
                    placeholder="Search event..."
                    items={eventsQuery.data ?? []}
                    onSelect={handleEventSelection}
                    value={selectedEvent}
                    isRequired
                />
                {eventsQuery.isLoading && (
                    <Spin size="small" style={{ marginTop: 8 }} />
                )}
                {eventsQuery.isSuccess && (eventsQuery.data ?? []).length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        No active events with inventory locked in warehouse.
                    </Typography>
                )}
            </Grid>

            {/* ── Shipping details ── */}
            <Grid item xs={12}>
                <Divider orientation="left" plain style={{ margin: '4px 0 8px' }}>
                    Shipping Details
                </Divider>
            </Grid>

            <Grid item xs={12} md={6}>
                <Input
                    label="Destination / Location"
                    placeholder="e.g. Convention Center, Miami FL"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    disabled={!selectedEvent}
                    required
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <Input
                    label="Ship-Out Date & Time"
                    type="datetime-local"
                    value={shipOutDate}
                    onChange={(e) => setShipOutDate(e.target.value)}
                    disabled={!selectedEvent}
                    required
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <Input
                    label="Authorized By"
                    placeholder="Name of person authorizing shipment"
                    value={authorizer}
                    onChange={(e) => setAuthorizer(e.target.value)}
                    disabled={!selectedEvent}
                    required
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <Input
                    label="Received By"
                    placeholder="Name of person receiving at destination"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    disabled={!selectedEvent}
                    required
                />
            </Grid>

            {/* ── Packaging list ── */}
            <Grid item xs={12}>
                <Divider orientation="left" plain style={{ margin: '4px 0 8px' }}>
                    Packaging List
                    {itemsQuery.isSuccess && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                            {(itemsQuery.data ?? []).length} items
                        </Tag>
                    )}
                </Divider>

                {!selectedEvent ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        Select an event to see the inventory reserved for shipment.
                    </Typography>
                ) : (
                    <BaseTable
                        dataSource={itemsQuery.data ?? []}
                        columns={columns}
                        rowKey={(r) => r.item_id ?? r.serial_number ?? Math.random()}
                        loading={itemsQuery.isLoading}
                        enablePagination
                        pageSize={8}
                        size="small"
                    />
                )}
            </Grid>

            {/* ── Actions ── */}
            <Grid item xs={12}>
                <Divider style={{ margin: '4px 0 12px' }} />
                <Grid container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                        <GrayButton
                            title="Cancel"
                            func={handleClose}
                            disabled={shipOutMutation.isPending}
                        />
                    </Grid>
                    <Grid item>
                        <GrayButton
                            title={isExporting ? 'Generating…' : 'Download Report (.xlsx)'}
                            func={handleDownloadReport}
                            disabled={!selectedEvent || isExporting || (itemsQuery.data ?? []).length === 0}
                            isLoading={isExporting}
                        />
                    </Grid>
                    <Grid item>
                        <BlueButton
                            title="Ship Out Inventory"
                            func={handleShipOut}
                            disabled={!isFormValid}
                            isLoading={shipOutMutation.isPending}
                        />
                    </Grid>
                </Grid>
            </Grid>

        </Grid>
    );

    return (
        <ModalUX
            openDialog={visible}
            closeModal={handleClose}
            title="Ship Out Inventory"
            width={1100}
            body={body}
        />
    );
};

export default ShippingInventoryModal;
