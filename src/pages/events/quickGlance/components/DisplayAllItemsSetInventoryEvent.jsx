import { useSelector } from "react-redux";
import { Space } from "antd";
import CardRendered from "./CardRenderedDeviceSetup";

const DisplayAllItemsSetInventoryEvent = () => {
  const { event } = useSelector((state) => state.event);

  return (
    <Space size={[16, 12]} wrap>
      {event.deviceSetup.map((item, index) => {
        return (
          <CardRendered
            key={`${item._id}${index}`}
            props={item.quantity}
            title={item.group}
          />
        );
      })}
    </Space>
  );
};

export default DisplayAllItemsSetInventoryEvent;