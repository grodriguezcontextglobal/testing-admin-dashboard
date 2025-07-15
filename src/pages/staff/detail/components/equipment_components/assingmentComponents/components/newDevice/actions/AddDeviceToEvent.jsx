import { message } from "antd";
import { devitrakApi } from "../../../../../../../../../api/devitrakApi";

export const createEvent = async ({
  street,
  city,
  state,
  zip,
  profile,
  user,
}) => {
  try {
    const respoNewEvent = await devitrakApi.post("/db_event/new_event", {
      event_name: `${profile.firstName} ${profile.lastName} / ${
        profile.email
      } / ${new Date().toLocaleDateString()}`,
      venue_name: `${profile.firstName} ${profile.lastName} / ${
        profile.email
      } / ${new Date().toLocaleDateString()}`,
      street_address: street,
      city_address: city,
      state_address: state,
      zip_address: zip,
      email_company: profile.email,
      phone_number: profile.adminUserInfo.phone,
      company_assigned_event_id: user.sqlInfo.company_id,
      contact_name: `${user.name} ${user.lastName}`,
    });
    if (respoNewEvent.data) {
      return respoNewEvent.data.consumer;
    }
  } catch (error) {
    return message.error(error.message);
  }
};

export const addDeviceToEvent = async ({ eventId, itemId }) => {
  return await devitrakApi.post("/db_event/event_device_directly", {
    event_id: eventId,
    item_id: itemId,
  });
};
