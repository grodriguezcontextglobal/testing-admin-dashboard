import { notification } from "antd";
import { dicIconNotification } from "../../../utils/dicIconNotification";

const iconWrapperStyle = {
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  fontSize: 20,
  lineHeight: 0,
};

const messageWrapperStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

/**
 * Centralized status-notification hook — the single place in the app that
 * should render a status icon next to a notification title. The icon is
 * composed *inside* `message` as one inline-flex unit (icon + text as
 * siblings, vertically centered, with an explicit gap) rather than passed
 * through antd's separate `icon` config slot — that slot's own
 * icon/title vertical-alignment math is what caused the icon to render on
 * top of the text in the app's previous ad-hoc implementations (48
 * duplicated local copies existed before this).
 *
 * Usage:
 *   const { notify, contextHolder } = useStatusNotification();
 *   notify("success", "Saved", "Your changes were saved.");
 *   return <>{contextHolder}...</>;
 *
 * `api` (antd's raw notification instance) is also returned for advanced
 * cases (e.g. `api.destroy()` to clear open notifications before showing
 * a new one) — prefer `notify` for the common case.
 *
 * @returns {{notify: (type: "success"|"error"|"warning"|"info", message: string, extra?: string|number|{description?: string, duration?: number}) => void, contextHolder: React.ReactNode, api: object}}
 */
export function useStatusNotification() {
  const [api, contextHolder] = notification.useNotification();

  const notify = (type, message, extra) => {
    let description;
    let duration;
    let key;
    if (typeof extra === "string") {
      description = extra;
    } else if (typeof extra === "number") {
      duration = extra;
    } else if (extra && typeof extra === "object") {
      ({ description, duration, key } = extra);
    }

    api.open({
      message: (
        <span style={messageWrapperStyle}>
          <span style={iconWrapperStyle}>{dicIconNotification[type]}</span>
          <span>{message}</span>
        </span>
      ),
      description: description || undefined,
      duration,
      key,
    });
  };

  return { notify, contextHolder, api };
}

export default useStatusNotification;
