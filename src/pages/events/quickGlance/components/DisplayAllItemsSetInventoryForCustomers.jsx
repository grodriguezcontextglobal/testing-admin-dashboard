import { useMediaQuery, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import CardRendered from "./CardRenderedDeviceSetup";
import { useState } from "react";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  onAddDeviceSetup,
  onAddEventData,
} from "../../../../store/slices/eventSlice";
import {
  inventoryTileColumns,
  inventoryTileGridTemplate,
} from "../utils/eventInventoryTiles";

const DisplayAllItemsSetInventoryEventForCustomers = ({ database }) => {
  const { event } = useSelector((state) => state.event);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();
  const columns = inventoryTileColumns({
    small: useMediaQuery(theme.breakpoints.down("sm")),
    medium: useMediaQuery(theme.breakpoints.down("lg")),
  });
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
    // Three per row on a large screen (meeting 2026-09-29 `1:03:39`), two on a
    // medium one, one on a phone. Fixed columns: one card takes one column.
    <div
      style={{
        display: "grid",
        gridTemplateColumns: inventoryTileGridTemplate(columns),
        gap: "16px 16px",
        width: "100%",
      }}
    >
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
                isItSetAsContainerForEvent: item.isItSetAsContainerForEvent,
                item
              }}
              title={item.group}
              onChange={(e) => onChange({ index: index, checked: e })}
              loadingStatus={loadingStatus}
              database={database}
            />
          );
        }
      })}
    </div>
  );
};

export default DisplayAllItemsSetInventoryEventForCustomers;
