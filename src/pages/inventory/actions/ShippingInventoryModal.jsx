import { Grid, InputLabel, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Divider, message, Tag } from 'antd';
import { saveAs } from 'file-saver';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { devitrakApi } from '../../../api/devitrakApi';
import { default as BlueButton, default as BlueButtonComponent } from '../../../components/UX/buttons/BlueButton';
import DangerButtonComponent from '../../../components/UX/buttons/DangerButton';
import { default as GrayButton, default as GrayButtonComponent } from '../../../components/UX/buttons/GrayButton';
import SelectComponent from '../../../components/UX/dropdown/SelectComponent';
import Input from '../../../components/UX/inputs/Input';
import ModalUX from '../../../components/UX/modal/ModalUX';
import BaseTable from '../../../components/UX/tables/BaseTable';
import { onTrackBackgroundJob } from '../../../store/slices/backgroundJobsSlice';
import generateIdempotencyKey from '../../../utils/actions/generateIdempotencyKey';
import ExchangeModal from './components/ExchangeModal';

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        day: 'numeric', hour: '2-digit', minute: '2-digit',
        month: 'short', year: 'numeric',
    });
};

const statusColor = { delivered: 'purple', 'in-reserved': 'blue', shipped: 'green' };
const statusRef = { delivered: 'Delivered', 'in-reserved': 'In Reserved', shipped: 'Shipped' };

// ─── component ───────────────────────────────────────────────────────────────

const ShippingInventoryModal = ({ visible, onClose, user }) => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    const [openModalNotification, setOpenModalNotification] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [destination, setDestination] = useState('');
    const [shipOutDate, setShipOutDate] = useState('');
    const [authorizer, setAuthorizer] = useState('');
    const [receiver, setReceiver] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [isExchangeModalVisible, setIsExchangeModalVisible] = useState(false);
    const [itemToExchange, setItemToExchange] = useState(null);
    const [newSerialNumber, setNewSerialNumber] = useState('');
    const [courier, setCourier] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');

    const companyId = user?.sqlInfo?.company_id ?? "";
    // console.log(user)
    // console.log(companyId)
    // ── 1. active events with reserved inventory ──────────────────────────────
    const eventsQuery = useQuery({
        queryKey: ['shippingEvents'],
        queryFn: async () => {
            const res = await devitrakApi.post('/db_item/event-items/search', {
                active: 1,
                company_id: companyId,
                shipping_status: 'locked_in_warehouse', //locked_in_warehouse
            });
            if (!res.data?.ok || !res.data?.items) return [];

            const map = new Map();
            res.data.items.forEach((item) => {
                if (!map.has(item.event_id)) {
                    map.set(item.event_id, {
                        id: item.event_id,
                        address: item.event_address ?? '',
                        eventDate: item.event_date ?? null,
                        label: item.event_name,
                        rawData: item,
                    });
                }
            });
            return Array.from(map.values());
        },
        // enabled: !!user?.infoSql?.company_id,
        // staleTime: 30_000,
    });
    // ── 2. packaging list for selected event ──────────────────────────────────
    const itemsQuery = useQuery({
        queryKey: ['shippingItems', selectedEvent?.id],
        queryFn: async () => {
            const res = await devitrakApi.post('/db_item/event-items/search', {
                company_id: companyId,
                event_id: selectedEvent.id,
                shipping_status: 'locked_in_warehouse', //locked_in_warehouse
            });
            return res.data?.items ?? [];
        },
        enabled: !!selectedEvent,
        staleTime: 30_000,
    });

    // ── 3. ship-out mutation ──────────────────────────────────────────────────
    const createShipmentRecordMutation = useMutation({
        mutationFn: async (shipmentData) => {
            const { data } = await devitrakApi.post('/db_shipment/', shipmentData);
            return data;
        },
        onError: (error) => {
            console.error("Error creating shipment record:", error);
            message.error('Could not create shipment record. Please try again.');
        },
        onSuccess: () => {
            const items = itemsQuery.data ?? [];
            if (items.length > 0) {
                const item_ids = items.map((item) => item.item_id);
                bulkUpdateItemStatusMutation.mutate({
                    company_id: companyId,
                    event_id: selectedEvent.id,
                    item_ids,
                    idempotencyKey: generateIdempotencyKey(),
                });
            } else {
                // If there are no items, we can just close the modal and show success.
                message.success('Shipment record created successfully.');
                queryClient.invalidateQueries({ queryKey: ['shippingEvents'] });
                handleClose();
            }
        },
    });

    // The item-status update itself now runs in the backend's job queue
    // (PUT /db_item/event-items/bulk-update returns 202 + jobId instead of a
    // synchronous 200); /db_inventory/update-large-data is unaffected and
    // still resolves synchronously. Global polling via onTrackBackgroundJob
    // mirrors the pattern already used for bulk inventory insert/update
    // (see BulkItemActionsOptions.jsx / EditBulkActionOptions.jsx).
    const bulkUpdateItemStatusMutation = useMutation({
        mutationFn: async ({ company_id, event_id, item_ids, idempotencyKey }) => {
            const [{ data: bulkUpdateResponse }] = await Promise.all([
                devitrakApi.put(
                    '/db_item/event-items/bulk-update',
                    {
                        company_id,
                        event_id,
                        updates: { shipping_status: 'in-transit' }, // The new status
                        filters: { shipping_status: 'in-reserved' }, // The old status - locked_in_warehouse
                    },
                    { headers: { 'Idempotency-Key': idempotencyKey } },
                ),
                devitrakApi.post('/db_inventory/update-large-data', { //
                    item_ids,
                    company_id,
                    warehouse: 0, // Mark items as out of warehouse
                    updates: { logistic_status: 'in-transit', warehouse: 0 }
                }),
            ]);
            return bulkUpdateResponse;
        },
        onError: () => message.error('Could not bulk update item statuses.'),
        onSuccess: (response) => {
            message.info(
                "Shipment was registered and inventory is being shipped out in the background. We'll notify you when it's ready."
            );
            dispatch(
                onTrackBackgroundJob({
                    jobId: response.jobId,
                    type: 'shipment-item-status-bulk-update',
                    successMessage: 'Shipment record created and inventory shipped out successfully.',
                    failureMessage: 'Could not bulk update item statuses.',
                    invalidateKeys: [['shippingEvents']],
                })
            );
            handleClose();
        },
    });

    // ── handlers ──────────────────────────────────────────────────────────────

    const handleEventSelection = (event) => {
        setSelectedEvent(event ?? null);
        setDestination(event?.address ?? '');
        setShipOutDate('');
        setAuthorizer('');
        setReceiver('');
        setCourier('');
        setTrackingNumber('');
    };

    const handleClose = () => {
        setSelectedEvent(null);
        setDestination('');
        setShipOutDate('');
        setAuthorizer('');
        setReceiver('');
        setCourier('');
        setTrackingNumber('');
        onClose();
    };

    const isFormValid =
        selectedEvent &&
        destination.trim() &&
        shipOutDate &&
        authorizer.trim() &&
        receiver.trim() &&
        courier.trim() &&
        trackingNumber.trim();

    const handleShipOut = () => {
        if (!isFormValid) {
            message.warning('Please complete all required fields.');
            return;
        }

        const items = itemsQuery.data ?? [];
        if (items.length === 0) {
            message.warning('No items to ship.');
            return;
        }
        const package_list = items.map((item) => item.item_id);

        const shipmentData = {
            authorizer_name: authorizer,
            company_id: companyId,
            courier: courier,
            destination: destination,
            event_id: selectedEvent.id,
            package_list,
            recipient_name: receiver,
            status: 'pending',
            tracking_number: trackingNumber,
        };
        createShipmentRecordMutation.mutate(shipmentData);
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
                { field: 'Courier', value: courier || '—' },
                { field: 'Tracking Number', value: trackingNumber || '—' },
                { field: 'Authorized By', value: authorizer || '—' },
                { field: 'Who will receive inventory at destination', value: receiver || '—' },
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
            key: 'idx',
            render: (_, __, i) => i + 1,
            title: '#',
            width: 50,
        },
        {
            dataIndex: 'serial_number',
            key: 'serial_number',
            render: (v) => <Typography variant="body2" fontFamily="monospace">{v ?? '—'}</Typography>,
            title: 'Serial Number',
        },
        {
            dataIndex: 'item_group',
            key: 'item_group',
            render: (v, row) => v ?? row.item_name ?? '—',
            title: 'Item / Group',
        },
        {
            dataIndex: 'category_name',
            key: 'category_name',
            title: 'Category',
        },
        {
            dataIndex: 'status',
            key: 'status',
            render: (v, row) => v ?? row.condition ?? '—',
            title: 'Condition',
        },
        {
            dataIndex: 'location',
            key: 'location',
            render: (v, row) => v ?? row.main_warehouse ?? '—',
            title: 'Origin Location',
        },
        {
            dataIndex: 'shipping_status',
            key: 'shipping_status',
            render: (v) => <Typography variant="body2" color={statusColor[v] || 'text.secondary'}>{statusRef[v] || '—'}</Typography>,
            title: 'Shipping Status',
        },
        {
            dataIndex: '',
            render: (v, row) => {
                return (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <BlueButtonComponent title={"Exchange"} func={() => { setItemToExchange(row); setIsExchangeModalVisible(true) }} />
                        <DangerButtonComponent title={"Remove"} func={() => { setItemToExchange(row); setOpenModalNotification(true) }} />
                    </div>
                )
            },
            title: '',
        },
    ];

    // ── render ────────────────────────────────────────────────────────────────
    // console.log(itemsQuery)
    const body = (
        <Grid container spacing={2}>

            {/* ── Event selector ── */}
            <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Active Event
                </Typography>
                <SelectComponent
                    // label="Select event with reserved inventory"
                    placeholder="Search event..."
                    items={eventsQuery.data ?? []}
                    onSelect={handleEventSelection}
                    value={selectedEvent}
                    isRequired
                />
                {/* {eventsQuery.isLoading && (
                    <Spin size="small" style={{ marginTop: 8 }} />
                )} */}
                {eventsQuery.isSuccess && (eventsQuery.data ?? []).length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
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
                <InputLabel>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Destination / Location
                    </Typography>
                    <Input
                        // label="Destination / Location"
                        placeholder="e.g. Convention Center, Miami FL"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        disabled={!selectedEvent}
                        required
                    />
                </InputLabel>
            </Grid>

            <Grid item xs={12} md={6}>
                <InputLabel>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Ship-Out Date & Time
                    </Typography>
                    <Input
                        // label="Ship-Out Date & Time"
                        type="datetime-local"
                        value={shipOutDate}
                        onChange={(e) => setShipOutDate(e.target.value)}
                        disabled={!selectedEvent}
                        required
                    />
                </InputLabel>
            </Grid>
            <Grid item xs={12} md={6}>
                <InputLabel>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Courier
                    </Typography>
                    <Input
                        // label="Courier"
                        placeholder="e.g. FedEx, UPS, DHL"
                        value={courier}
                        onChange={(e) => setCourier(e.target.value)}
                        disabled={!selectedEvent}
                        required
                    />
                </InputLabel>
            </Grid>
            <Grid item xs={12} md={6}>
                <InputLabel>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Tracking Number
                    </Typography>
                    <Input
                        // label="Tracking Number"
                        placeholder="e.g. 1234567890"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        disabled={!selectedEvent}
                        required
                    />
                </InputLabel>
            </Grid>

            <Grid item xs={12} md={6}>
                <InputLabel>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Authorized By
                    </Typography>
                    <Input
                        // label="Authorized By"
                        placeholder="Name of person authorizing shipment"
                        value={authorizer}
                        onChange={(e) => setAuthorizer(e.target.value)}
                        disabled={!selectedEvent}
                        required
                    />
                </InputLabel>
            </Grid>

            <Grid item xs={12} md={6}>
                <InputLabel>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Who will receive inventory at destination
                    </Typography>
                    <Input
                        // label="Received By"
                        placeholder="Name of person receiving at destination"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        disabled={!selectedEvent}
                        required
                    />
                </InputLabel>
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
                            disabled={createShipmentRecordMutation.isPending || bulkUpdateItemStatusMutation.isPending}
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
                            disabled={!isFormValid || createShipmentRecordMutation.isPending || bulkUpdateItemStatusMutation.isPending}
                            isLoading={createShipmentRecordMutation.isPending || bulkUpdateItemStatusMutation.isPending}
                        />
                    </Grid>
                </Grid>
            </Grid>

        </Grid>
    );

    const handleRemoveItem = async(itemId) => {
        await devitrakApi.post('/db_item/edit-item', {
            item_id: itemId,
            logistic_status: 'in-stock',
        })
        await devitrakApi.post(`/db_event/remove-reserved-items-for-event`, {
                event_id: selectedEvent?.id,
                item_id: [itemId],
                company_id: companyId
        })
        queryClient.invalidateQueries({ queryKey: ['shipping-events'] })
        eventsQuery.refetch()
        return alert(`Item ${itemId} has been removed.`)
    }
    return (
        <>
            <ModalUX
                openDialog={visible}
                closeModal={handleClose}
                title="Ship Out Inventory"
                width={1100}
                body={body}
            />
            {
                isExchangeModalVisible && (
                    <ExchangeModal
                        visible={isExchangeModalVisible}
                        onClose={() => setIsExchangeModalVisible(false)}
                        itemToExchange={itemToExchange}
                        newSerialNumber={newSerialNumber}
                        setNewSerialNumber={setNewSerialNumber}
                        refetchShippingEvents={itemsQuery.refetch}
                        eventId={selectedEvent?.id}
                        companyId={companyId}
                    />
                )
            }
            {
                openModalNotification && (
                    <ModalUX
                        openDialog={openModalNotification}
                        closeModal={() => setOpenModalNotification(false)}
                        title="Remove"
                        body={
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                Are you sure you want to exchange this item: {itemToExchange.item_name} serial number: {itemToExchange.serial_number}?
                            </Typography>
                        }
                        footer={
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <GrayButtonComponent
                                    title="Cancel"
                                    func={() => setOpenModalNotification(false)}
                                />
                                <BlueButtonComponent
                                    title="Remove"
                                    func={() => { handleRemoveItem(itemToExchange.item_id); setOpenModalNotification(false); }}
                                />
                            </div>
                        }
                    />
                )
            }
        </>
    );
};

export default ShippingInventoryModal;
