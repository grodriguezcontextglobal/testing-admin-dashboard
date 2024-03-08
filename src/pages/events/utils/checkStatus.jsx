import {
    Typography,
} from "@mui/material";

export const checkStatus = (beginDate, endDate, active) => {
    const currentDate = new Date();
    const beging = new Date(beginDate);
    let ending = new Date(endDate);
    if (active) {
        if (currentDate < beging) {
            return (
                <div className="badge-upcoming">
                    <div className="text-upcoming text-xsmedium upcoming">
                        <Typography
                            fontFamily={"Inter"}
                            fontSize={"14px"}
                            fontStyle={"normal"}
                            fontWeight={500}
                            lineHeight={"20px"}
                            color="fill"
                        >
                            Upcoming
                        </Typography>
                    </div>
                </div>
            );
        }
        if (currentDate >= beging && currentDate <= ending) {
            return (
                <div className="badge-active">
                    <div className="text-active text-xsmedium current">
                        <Typography
                            fontFamily={"Inter"}
                            fontSize={"14px"}
                            fontStyle={"normal"}
                            fontWeight={500}
                            lineHeight={"20px"}
                            color="fill"
                        >
                            Active
                        </Typography>
                    </div>
                </div>
            );
        }
    }
    if (active && currentDate > ending) {
        return (
            <div className="badge-completed">
                <div className="text-completed text-xsmedium completed">
                    <Typography
                        fontFamily={"Inter"}
                        fontSize={"14px"}
                        fontStyle={"normal"}
                        fontWeight={500}
                        lineHeight={"20px"}
                        color="fill"
                    >
                        Expired/Still active
                    </Typography>
                </div>
            </div>
        );
    }
    if (!active || currentDate > ending) {
        return (
            <div className="badge-completed">
                <div className="text-completed text-xsmedium completed">
                    <Typography
                        fontFamily={"Inter"}
                        fontSize={"14px"}
                        fontStyle={"normal"}
                        fontWeight={500}
                        lineHeight={"20px"}
                        color="fill"
                    >
                        Completed
                    </Typography>
                </div>
            </div>
        );
    }
}