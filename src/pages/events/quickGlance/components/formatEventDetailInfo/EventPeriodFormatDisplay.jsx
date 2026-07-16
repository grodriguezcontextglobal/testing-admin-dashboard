import { Subtitle } from "../../../../../styles/global/Subtitle";
import displayMonth from "./displayMonth";

export const EventPeriodFormatDisplay = ({ event, styleText }) => {
    const beginYear = new Date(`${event?.eventInfoDetail?.dateBegin}`).getFullYear();
    const endYear = new Date(`${event?.eventInfoDetail?.dateEnd}`).getFullYear();
    const beginMonth = displayMonth(`${event?.eventInfoDetail?.dateBegin}`)
    const endMonth = displayMonth(`${event?.eventInfoDetail?.dateEnd}`)

    const dateBegin = new Date(`${event?.eventInfoDetail?.dateBegin}`).getDate();
    const dateEnd = new Date(`${event?.eventInfoDetail?.dateEnd}`).getDate();

    // "June 30 – July 3" on one line, with the year shown once underneath
    // ("2026", or "2026 – 2027" when the range crosses a year boundary).
    const sameDay = beginMonth === endMonth && dateBegin === dateEnd && beginYear === endYear;
    const rangeLabel = sameDay
        ? `${beginMonth} ${dateBegin}`
        : `${beginMonth} ${dateBegin} – ${endMonth} ${dateEnd}`;
    const yearLabel = beginYear === endYear ? `${beginYear}` : `${beginYear} – ${endYear}`;

    return (
        <div style={{ display: "flex", justifyContent: "flex-start", width: "-webkit-fill-available" }}>
            <p style={{ ...styleText, paddingTop: "8px" }}>
                <span style={{ width: "100%", display: "flex", textAlign: "left" }}>
                    {rangeLabel}
                </span>
                <span style={{ ...Subtitle, width: "100%", display: "flex", textAlign: "left" }}>
                    {yearLabel}
                </span>
            </p>
        </div>
    );
};
