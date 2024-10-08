import { useDispatch, useSelector } from "react-redux";
import { Space } from "antd";
import CardRendered from "./CardRenderedDeviceSetup";
import { useState } from "react";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  onAddDeviceSetup,
  onAddEventData,
} from "../../../../store/slices/eventSlice";

const DisplayAllItemsSetInventoryEventForCustomers = () => {
  const { event } = useSelector((state) => state.event);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const dispatch = useDispatch();
  const onChange = async (props) => {
    setLoadingStatus(true);
    const deviceInventoryUpdated = [...event.deviceSetup];
    deviceInventoryUpdated[props.index] = {
      ...deviceInventoryUpdated[props.index],
      consumerUses: props.checked,
    };
    const response = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
      deviceSetup: deviceInventoryUpdated,
    });
    if (response.data.ok) {
      dispatch(
        onAddEventData({
          ...event,
          deviceSetup: deviceInventoryUpdated,
        })
      );
      dispatch(onAddDeviceSetup(deviceInventoryUpdated));

      return setLoadingStatus(false);
    }
    return setLoadingStatus(false);
  };

  return (
    <Space size={[16, 12]} wrap>
      {event?.deviceSetup?.map((item, index) => {
        if (item.consumerUses) {
          return (
            <CardRendered
              key={`${item._id}${index}`}
              props={{
                quantity: item.quantity,
                consumerUses: item.consumerUses,
                startingNumber: item.startingNumber,
                endingNumber: item.endingNumber,
              }}
              title={item.group}
              onChange={(e) => onChange({ index: index, checked: e })}
              loadingStatus={loadingStatus}
            />
          );
        }
      })}
    </Space>
  );
};

export default DisplayAllItemsSetInventoryEventForCustomers;
