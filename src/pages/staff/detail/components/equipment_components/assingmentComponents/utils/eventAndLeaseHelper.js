
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { formatDate } from "../../../../../../inventory/utils/dateFormat";

const createNewLease = async (props, user, profile) => {
    const staffMember = await devitrakApi.post("/db_staff/consulting-member", {
        email: profile.email,
    });
    if (staffMember.data.member.length > 0) {
        for (let data of props.deviceInfo) {
            await devitrakApi.post("/db_lease/new-lease", {
                staff_admin_id: user.sqlMemberInfo.staff_id,
                company_id: user.sqlInfo.company_id,
                subscription_expected_return_data: formatDate(new Date()),
                location: `${props.street} ${props.city} ${props.state} ${props.zip}`,
                staff_member_id: staffMember.data.member.at(-1).staff_id,
                device_id: data.item_id,
            });
        }
    } else {
        const newStaffMember = await devitrakApi.post("/db_staff/new_member", {
            first_name: profile.firstName,
            last_name: profile.lastName,
            email: profile.email,
            phone_number: "000-000-0000",
        });
        if (newStaffMember.data.result.insertId) {
            for (let data of props.deviceInfo) {
                await devitrakApi.post("/db_lease/new-lease", {
                    staff_admin_id: user.sqlMemberInfo.staff_id,
                    company_id: user.sqlInfo.company_id,
                    subscription_expected_return_data: formatDate(new Date()),
                    location: `${props.street} ${props.city} ${props.state} ${props.zip}`,
                    staff_member_id: newStaffMember.data.result.insertId,
                    device_id: data.item_id,
                });
            }
        }
    }
};

const createEvent = async (props, user, profile) => {
    const respoNewEvent = await devitrakApi.post("/db_event/new_event", {
        event_name: `${profile.firstName} ${profile.lastName} / ${profile.email} / ${new Date().toLocaleDateString()}`,
        venue_name: `${profile.firstName} ${profile.lastName} / ${profile.email} / ${new Date().toLocaleDateString()}`,
        street_address: props.street,
        city_address: props.city,
        state_address: props.state,
        zip_address: props.zip,
        email_company: profile.email,
        phone_number: profile.adminUserInfo.phone,
        company_assigned_event_id: user.sqlInfo.company_id,
        contact_name: `${user.name} ${user.lastName}`,
    });
    return respoNewEvent.data.consumer.insertId;
};

const addDeviceToEvent = async (props, eventId) => {
    for (let data of props) {
        for (let item of data.selectedList) {
            await devitrakApi.post("/db_event/event_device_directly", {
                event_id: eventId,
                item_id: item.item_id,
            });
        }
    }
};

const closingProcess = async (setValue, openNotificationWithIcon, queryClient, navigate, profile) => {
    setValue("category_name", "");
    setValue("item_group", "");
    setValue("cost", "");
    setValue("brand", "");
    setValue("descript_item", "");
    setValue("ownership", "");
    setValue("serial_number", "");
    setValue("location", "");
    setValue("tax_location", "");
    setValue("container", "");
    setValue("containerSpotLimit", "0");
    openNotificationWithIcon("Equipment assigned to staff member.");
    queryClient.invalidateQueries({
        queryKey: ["staffMemberInfo"],
        exact: true,
    });
    queryClient.invalidateQueries({
        queryKey: ["imagePerItemList"],
        exact: true,
    });
    queryClient.invalidateQueries({
        queryKey: ["ItemsInventoryCheckingQuery"],
        exact: true,
    });
    await navigate(`/staff/${profile.adminUserInfo._id}/main`);
};

const option1 = async (props, user, profile, setValue, openNotificationWithIcon, queryClient, navigate) => {
    const newEventId = await createEvent(props.template, user, profile);
    const deviceInfo = props.deviceInfo;
    if (newEventId) {
        await createNewLease({ ...props.template, deviceInfo }, user, profile);
        await addDeviceToEvent([
            {
                item_group: deviceInfo[0].item_group,
                category_name: deviceInfo[0].category_name,
                min_serial_number: deviceInfo.at(-1).serial_number,
                quantity: props.quantity,
                selectedList: deviceInfo,
            },
        ], newEventId);
        await closingProcess(setValue, openNotificationWithIcon, queryClient, navigate, profile);
    }
};

export const retrieveDataNewAddedItem = async (props, user, profile, setValue, openNotificationWithIcon, queryClient, navigate) => {
    const newAddedItem = await devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        item_group: props.deviceInfo.item_group,
        category_name: props.deviceInfo.category_name,
        serial_number: props.deviceInfo.serial_number,
    });
    if (newAddedItem.data) {
        return await option1({
            template: props.template,
            deviceInfo: newAddedItem.data.items,
            quantity: "1",
        }, user, profile, setValue, openNotificationWithIcon, queryClient, navigate);
    }
};

