import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';
import sortBy from 'lodash/sortBy';
import { devitrakApi } from '../../../../api/devitrakApi';
import { onAddEventData } from '../../../../store/slices/eventSlice';
import clearCacheMemory from '../../../../utils/actions/clearCacheMemory';

function useUpdateEventInventory() {
  const dispatch = useDispatch();
  const { event } = useSelector((s) => s.event);
  const { user } = useSelector((s) => s.admin);

  return useCallback(
    async ({ newEntries }) => {
      try {
        // 1) Fetch existing setup once
        const listRes = await devitrakApi.post('/event/event-list', { _id: event.id });
        const currentSetup = listRes.data.list[0].deviceSetup;

        // 2) Merge in newEntries (either updated or appended)
        //    newEntries: array of { group, deviceList, ... }
        const updatedSetup = [...currentSetup];
        newEntries.forEach((entry) => {
          const sortedDevices = sortBy(entry.deviceList, 'serial_number');
          const start = sortedDevices[0].serial_number;
          const end = sortedDevices.at(-1).serial_number;
          const payload = {
            ...entry,
            startingNumber: start,
            endingNumber: end,
            quantity: sortedDevices.length,
          };

          const idx = updatedSetup.findIndex(
            (e) => String(e.group).toLowerCase() === String(entry.group).toLowerCase()
          );
          if (idx >= 0) {
            updatedSetup[idx] = payload;
          } else {
            updatedSetup.push(payload);
          }
        });

        // 3) Send a single PATCH
        const patchRes = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
          deviceSetup: updatedSetup,
        });

        // 4) Dispatch to Redux
        dispatch(
          onAddEventData({
            ...event,
            deviceSetup: patchRes.data.event.deviceSetup,
          })
        );

        // 5) (Optional) Clear caches here
        await clearCacheMemory(`eventSelected=${event.id}&company=${user.companyData.id}`);

      } catch (err) {
        console.error('Failed to update event inventory:', err);
        message.error('Unable to save device setup. Please try again.');
      }
    },
    [event, dispatch]
  );
}

export default useUpdateEventInventory;
