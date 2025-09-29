import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  onAddEventData,
  onAddExtraServiceListSetup,
  onAddExtraServiceNeeded,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../../../store/slices/subscriptionSlice";
import { devitrakApi } from "../../../../../api/devitrakApi";

const useSelectedEventInfo = () => {
  const [props, setProps] = useState(null);
  const [selectedEventInfo, setSelectedEventInfo] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchingEventInfo = async () => {
    if (!props) return;
    const response = await devitrakApi.post(`/event/event-list`, {
      _id: props.event_id,
    });
    if (response.data.ok) {
      return setSelectedEventInfo(response?.data?.list?.at(-1));
    } else {
      return setSelectedEventInfo(null);
    }
  };

  useEffect(() => {
    fetchingEventInfo();
  }, [!!props]);

  const quickGlance = async () => {
    const sqpFetchInfo = await devitrakApi.post(
      "/db_event/events_information",
      {
        zip_address: selectedEventInfo.eventInfoDetail.address
          .split(" ")
          .at(-1),
        event_name: selectedEventInfo.eventInfoDetail.eventName,
      }
    );
    if (sqpFetchInfo.data.ok) {
      dispatch(onSelectEvent(selectedEventInfo.eventInfoDetail.eventName));
      dispatch(onSelectCompany(selectedEventInfo.company));
      dispatch(
        onAddEventData({
          ...selectedEventInfo,
          sql: sqpFetchInfo.data.events.at(-1),
        })
      );
      dispatch(onAddSubscription(selectedEventInfo.subscription));
      dispatch(
        onAddQRCodeLink(
          selectedEventInfo.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              selectedEventInfo.eventInfoDetail.eventName
            )}&company=${encodeURI(selectedEventInfo.company)}`
        )
      );
      dispatch(
        onAddExtraServiceListSetup(selectedEventInfo.extraServiceListSetup)
      );
      dispatch(onAddExtraServiceNeeded(selectedEventInfo.extraServiceNeeded));
      return navigate("/events/event-quickglance");
    }
    dispatch(onSelectEvent(selectedEventInfo.eventInfoDetail.eventName));
    dispatch(onSelectCompany(selectedEventInfo.company));
    dispatch(onAddEventData(selectedEventInfo));
    dispatch(onAddSubscription(selectedEventInfo.subscription));
    dispatch(
      onAddQRCodeLink(
        selectedEventInfo.qrCodeLink ??
          `https://app.devitrak.net/?event=${encodeURI(
            selectedEventInfo.eventInfoDetail.eventName
          )}&company=${encodeURI(selectedEventInfo.company)}`
      )
    );
    return navigate("/events/event-quickglance");
  };

  return {
    setProps,
    quickGlance,
  };
};

export default useSelectedEventInfo;
