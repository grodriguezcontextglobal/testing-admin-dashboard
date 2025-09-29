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
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchEventInfo = async (eventId) => {
    if (!eventId) return null;
    
    setIsLoading(true);
    try {
      const response = await devitrakApi.post(`/event/event-list`, {
        _id: eventId,
      });
      
      if (response.data.ok) {
        const eventInfo = response.data.list?.at(-1);
        setSelectedEventInfo(eventInfo);
        return eventInfo;
      } else {
        setSelectedEventInfo(null);
        return null;
      }
    } catch (error) {
      setSelectedEventInfo(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const storeEventInRedux = async (eventInfo) => {
    if (!eventInfo) return false;

    try {
      // Fetch additional event information for SQL data
      const sqpFetchInfo = await devitrakApi.post(
        "/db_event/events_information",
        {
          zip_address: eventInfo.eventInfoDetail.address
            .split(" ")
            .at(-1),
          event_name: eventInfo.eventInfoDetail.eventName,
        }
      );

      // Dispatch Redux actions to store event information
      dispatch(onSelectEvent(eventInfo.eventInfoDetail.eventName));
      dispatch(onSelectCompany(eventInfo.company));
      
      if (sqpFetchInfo.data.ok) {
        dispatch(
          onAddEventData({
            ...eventInfo,
            sql: sqpFetchInfo.data.events.at(-1),
          })
        );
      } else {
        dispatch(onAddEventData(eventInfo));
      }

      dispatch(onAddSubscription(eventInfo.subscription));
      dispatch(
        onAddQRCodeLink(
          eventInfo.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              eventInfo.eventInfoDetail.eventName
            )}&company=${encodeURI(eventInfo.company)}`
        )
      );
      dispatch(
        onAddExtraServiceListSetup(eventInfo.extraServiceListSetup)
      );
      dispatch(onAddExtraServiceNeeded(eventInfo.extraServiceNeeded));

      return true;
    } catch (error) {
      console.error('Error storing event in Redux:', error);
      return false;
    }
  };

  const navigateToEventQuickGlance = () => {
    navigate("/events/event-quickglance");
  };

  // Legacy method for backward compatibility
  const quickGlance = async () => {
    if (!selectedEventInfo) return;
    
    const success = await storeEventInRedux(selectedEventInfo);
    if (success) {
      navigateToEventQuickGlance();
    }
  };

  useEffect(() => {
    if (props?.event_id) {
      fetchEventInfo(props.event_id);
    }
  }, [props?.event_id]);

  return {
    setProps,
    quickGlance,
    fetchEventInfo,
    storeEventInRedux,
    navigateToEventQuickGlance,
    selectedEventInfo,
    isLoading,
  };
};

export default useSelectedEventInfo;
