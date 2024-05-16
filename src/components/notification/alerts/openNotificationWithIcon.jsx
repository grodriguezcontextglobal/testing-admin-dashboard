import { notification } from "antd";

const Notification2Parameters = (type, msg) => {
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, msg) => {
        api.open({
            message: msg,
        });
    }

    return (
        <>
            {contextHolder}
            {openNotificationWithIcon(type, msg)}
        </>
    )
}

export default Notification2Parameters