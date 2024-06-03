import { useDispatch } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import {
  onAddEventData,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../store/slices/eventSlice";
import { onAddSubscription } from "../../store/slices/subscriptionSlice";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const useEventQuickGlanceDispatchAction = ({ props }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const addingEventState = async () => {
    const sqpFetchInfo = await devitrakApi.post(
      "/db_event/events_information",
      {
        zip_address: props.eventInfoDetail.address.split(" ").at(-1),
        event_name: props.eventInfoDetail.eventName,
      }
    );
    if (sqpFetchInfo.data.ok) {
      dispatch(onSelectEvent(props.eventInfoDetail.eventName));
      dispatch(onSelectCompany(props.company));
      dispatch(
        onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) })
      );
      dispatch(onAddSubscription(props.subscription));
      dispatch(
        onAddQRCodeLink(
          props.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              props.eventInfoDetail.eventName
            )}&company=${encodeURI(props.company)}`
        )
      );
      return navigate("/events/event-quickglance");
    }
    dispatch(onSelectEvent(props.eventInfoDetail.eventName));
    dispatch(onSelectCompany(props.company));
    dispatch(onAddEventData(props));
    dispatch(onAddSubscription(props.subscription));
    dispatch(
      onAddQRCodeLink(
        props.qrCodeLink ??
          `https://app.devitrak.net/?event=${encodeURI(
            props.eventInfoDetail.eventName
          )}&company=${encodeURI(props.company)}`
      )
    );
    return navigate("/events/event-quickglance");
  };

  useEffect(() => {
    const controller = new AbortController();
    addingEventState();
    return () => {
      controller.abort();
    };
  }, []);
};

export default useEventQuickGlanceDispatchAction;
