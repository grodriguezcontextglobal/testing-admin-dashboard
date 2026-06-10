import { Subtitle } from "../../../../../styles/global/Subtitle";
import displayMonth from "./displayMonth";

export const EventPeriodFormatDisplay = ({ event, styleText }) => {
    const beginYear = new Date(`${event?.eventInfoDetail?.dateBegin}`).getFullYear();
    const endYear = new Date(`${event?.eventInfoDetail?.dateEnd}`).getFullYear();
    const beginMonth = displayMonth(`${event?.eventInfoDetail?.dateBegin}`)
    const endMonth = displayMonth(`${event?.eventInfoDetail?.dateEnd}`)

    const dateBegin = new Date(`${event?.eventInfoDetail?.dateBegin}`).getDate();
    const dateEnd = new Date(`${event?.eventInfoDetail?.dateEnd}`).getDate();
    return (
        <div style={{ display: "flex",  justifyContent: "flex-start", width: "-webkit-fill-available" }}>
            <p style={{ ...styleText, paddingTop: "8px" }}>
                <span style={{ width: "100%", display: "flex", textAlign: "left" }}>
                    {beginMonth} {dateBegin}
                </span>
                <span style={{ ...Subtitle, width: "100%", display: "flex", textAlign: "left" }}>
                    {beginYear}
                </span>
            </p>
            <p style={{ ...styleText, paddingTop: "8px", margin:"0 .5rem" }}><strong>-</strong></p>
            <p style={{ ...styleText, paddingTop: "8px" }}>
                <span style={{ width: "100%", display: "flex", textAlign: "left" }}>
                    {endMonth} {dateEnd}
                </span>
                <span style={{ ...Subtitle, width: "100%", display: "flex", textAlign: "left" }}>
                    {endYear}
                </span>
            </p>

        </div>
    );
};