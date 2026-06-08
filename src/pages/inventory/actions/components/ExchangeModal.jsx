import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { useState } from 'react';
import { devitrakApi } from '../../../../api/devitrakApi';
import ModalUX from '../../../../components/UX/modal/ModalUX';
import BlueButtonComponent from '../../../../components/UX/buttons/BlueButton';
import GrayButtonComponent from '../../../../components/UX/buttons/GrayButton';
import Input from '../../../../components/UX/inputs/Input';

const ExchangeModal = ({ visible, onClose, itemToExchange, companyId, eventId, queryClient, refetchShippingEvents }) => {
    const [newSerialNumber, setNewSerialNumber] = useState('');

    const exchangeMutation = useMutation({
        mutationFn: async ({ oldItem, newSerialNumber }) => {
            // 1. Find the new item by serial number to get its ID
            const searchRes = await devitrakApi.post('/db_item/consulting-item', {
                company_id: companyId, logistic_status: 'in-stock', serial_number: newSerialNumber, warehouse: 1
            });
            if (!searchRes.data.ok || searchRes.data?.items?.length === 0) {
                throw new Error(`Item with serial number "${newSerialNumber}" not found.`);
            }
            const newItem = searchRes.data.items[0];
            // 2. Perform the swap using the new controller logic
            await Promise.all([
                // a. Update old item's logistic_status to 'in-stock' in item_inv table
                devitrakApi.post('/db_item/edit-item', {
                    item_id: oldItem.item_id,
                    logistic_status: 'in-stock',
                }),
                // b. Update new item's logistic_status to 'in-reserved' in item_inv table
                devitrakApi.post('/db_item/edit-item', {
                    item_id: newItem.item_id,
                    logistic_status: 'in-reserved',
                }),
                // c. Remove old item from event_item_shipping table
                devitrakApi.delete('/db_item/event-items', {
                    data: { // Axios delete with body
                        event_id: eventId,
                        items: [oldItem.item_id],
                        company_id: companyId,
                    }
                }),
                // d. Insert new item into event_item_shipping table
                devitrakApi.post('/db_event/event_device', {
                    category_name: newItem.category_name,
                    company_id: companyId, 
                    data: [newItem.serial_number],
                    event_id: eventId,
                    item_group: newItem.item_group,
                }),
            ]);
        },
        onError: (error) => {
            message.error(error.message || 'Failed to exchange item.');
        },
        onSuccess: () => {
            message.success('Item exchanged successfully.');
            // Invalidate the query to refetch the packaging list
            queryClient.invalidateQueries({ queryKey: ['shippingItems'] });
            // Refetch the shipping events to update the UI
            refetchShippingEvents();
            onClose();
        },
    });

    const handleExchange = () => {
        if (!newSerialNumber.trim()) {
            message.warning('Please enter the new serial number.');
            return;
        }
        exchangeMutation.mutate({ newSerialNumber, oldItem: itemToExchange });
    };

    const body = (
        <div>
            <p>Exchanging item: <strong>{itemToExchange?.serial_number}</strong></p>
            <Input
                // label="New Serial Number"
                placeholder="Enter the serial number of the replacement item"
                value={newSerialNumber}
                onChange={(e) => setNewSerialNumber(e.target.value)}
                autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <GrayButtonComponent title="Cancel" func={onClose} />
                <BlueButtonComponent
                    title="Confirm Exchange"
                    func={handleExchange}
                    isLoading={exchangeMutation.isPending}
                />
            </div>
        </div>
    );

    return (
        <ModalUX
            openDialog={visible}
            closeModal={onClose}
            title="Exchange Item"
            body={body}
            width={500}
        />
    );
};

export default ExchangeModal;
