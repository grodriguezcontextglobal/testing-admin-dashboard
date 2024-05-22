import { Grid } from "@mui/material"
import { Card } from "antd"

const ConsumerOrigin = () => {
    return (
        <Card
            style={{
                borderRadius: "12px",
                border: "1px solid var(--gray-200, #EAECF0)",
                background: "var(--base-white, #FFF)",
                boxShadow:
                    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
            }}
            styles={{
                body: {
                    padding: "10px 10px 0px 10px",
                    // height: "19.5rem",
                },
                header: {
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }
            }}
        >
            <Grid
                display={"flex"}
                justifyContent={"space-around"}
                alignItems={"center"}
                container
            >
                <p style={{ width: "100%", textAlign: "left" }}>Consumer origin</p>
                <Grid
                    display={"flex"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    padding={"0px 24px"}
                    height={200}
                    item
                    xs={12}
                >
                    <Grid></Grid>
                    <Grid></Grid>
                </Grid>
            </Grid>
            <p style={{
                fontFamily: "Inter",
                fontSize: "16px",
                fontStyle: "normal",
                fontWeight: 600,
                lineHeight: "24px",
                textAlign: "right",
                padding: "10px 24px",
                color: "var(--gray-600, #475467)",
            }}
                key={"render-total-device-activity"}
            >
                Total:&nbsp;
            </p>
        </Card>

    )
}

export default ConsumerOrigin