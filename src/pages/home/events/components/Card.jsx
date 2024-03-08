import { Icon } from "@iconify/react"
import { Grid, Typography } from "@mui/material"
import { Tooltip } from "antd"
import CenteringGrid from "../../../../styles/global/CenteringGrid"

const Card = ({ props, checkStatus, checkActiveEvent, quickGlance }) => {
  return (
    <Card
    id="card-event-status"
    key={`card-event-status-pending-active-upcoming-${props.id}`}
    style={{
        maxHeight: "20rem",
        borderRadius: "12px",
        border: "1px solid var(--gray-200, #EAECF0)",
        background: "var(--base-white, #FFF)",
        boxShadow:
            "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
    }}
    // cover={

    // }
    actions={[
        <Grid
            key={`grid-card-home-action-footer-${props.id}`}
            item
            xs={12}
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            textAlign={"right"}
        >

            <Grid
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                item
                xs={6}
                padding={"0 0 0 18px"}
            >
                {checkActiveEvent(
                    event?.active
                ) ? (
                    <Icon
                        icon="tabler:point-filled"
                        color="#12b76a"
                        width={20}
                        height={20}
                        padding={0}
                    />
                ) : (
                    <Icon
                        icon="tabler:point-filled"
                        color="#D0D5DD"
                        width={20}
                        height={20}
                        padding={0}
                    />
                )} {checkStatus(
                    props.eventInfoDetail.dateBegin,
                    props.eventInfoDetail.dateEnd,
                    props.active
                )}
            </Grid>
            <Grid
                display={"flex"}
                justifyContent={"flex-end"}
                alignItems={"center"}
                item
                xs={6}
            // padding={"0 0 0 18px"}
            >
                <Typography
                    fontFamily={"Inter"}
                    fontSize={"14px"}
                    fontStyle={"normal"}
                    fontWeight={600}
                    lineHeight={"20px"}
                    color="#004EEB"
                    padding={"16px 24px"}
                    style={CenteringGrid}
                    onClick={() => quickGlance(event)}
                >
                    View quick glance &nbsp;
                    <Icon
                        icon="tabler:arrow-narrow-right"
                        width={25}
                        height={25}
                    />
                </Typography>
            </Grid>

        </Grid>,
    ]}
>
    <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        marginX={"auto"}
        marginTop={1}
        container
    >

        <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
            padding={"18px 0 9px 18px"}
        >
            <Typography
                textTransform={"none"}
                color="var(--gray-900, #101828)"
                lineHeight={"24px"}
                textAlign={"left"}
                fontWeight={600}
                fontFamily={"Inter"}
                fontSize={"20px"}
                noWrap={true}
            >
                <Tooltip
                    title={`${props.eventInfoDetail.eventName}`}
                >
                    {props.eventInfoDetail.eventName}
                </Tooltip>
            </Typography>
        </Grid>
    </Grid>
</Card>
  )
}

export default Card