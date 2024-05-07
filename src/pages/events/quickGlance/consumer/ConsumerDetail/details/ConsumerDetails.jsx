import { Grid, Typography } from "@mui/material"
import { Card } from "antd"
import { CardStyle } from "../../../../../../styles/global/CardStyle"

const ConsumerDetails = ({ props }) => {
    return (
        <Card
            //   id="card-contact-person"
            style={CardStyle}
            styles={{
                body:{
                    padding: "24px 24px 24px 0" 
                }
            }}
            // bodyStyle={{
            //     padding: "24px 24px 24px 0"
            // }}
        >
            <Grid
                display={"flex"}
                justifyContent={"space-around"}
                alignItems={"center"}
                container
            >
                <Grid
                    display={"flex"}
                    justifyContent={"flex-start"}
                    textAlign={"left"}
                    alignItems={"center"}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                >
                    <Typography
                        textAlign={"left"}
                        fontFamily={"Inter"}
                        fontSize={"18px"}
                        fontStyle={"normal"}
                        fontWeight={600}
                        lineHeight={"28px"}
                        color={"var(--gray-900, #101828)"}
                    >
                        Contact detail
                    </Typography>
                </Grid>
                <Grid
                    display={"flex"}
                    justifyContent={"left"}
                    textAlign={"left"}
                    alignItems={"center"}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                >
                    <Typography
                        textAlign={"left"}
                        paddingTop={"8px"}
                        fontFamily={"Inter"}
                        fontSize={"18px"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"28px"}
                        color={"var(--gray-900, #101828)"}
                    >
                        {props?.name} {props?.lastName}
                    </Typography>
                </Grid>
                <Grid
                    display={"flex"}
                    justifyContent={"left"}
                    textAlign={"left"}
                    alignItems={"center"}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                >
                    <Typography
                        textAlign={"left"}
                        paddingTop={"8px"}
                        fontFamily={"Inter"}
                        fontSize={"16px"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"24px"}
                        color={"var(--gray-600, #475467)"}
                    >
                        {props?.email}
                    </Typography>
                </Grid>
                <Grid
                    display={"flex"}
                    justifyContent={"left"}
                    textAlign={"left"}
                    alignItems={"center"}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                >
                    <Typography
                        textAlign={"left"}
                        paddingTop={"8px"}
                        fontFamily={"Inter"}
                        fontSize={"16px"}
                        fontStyle={"normal"}
                        fontWeight={400}
                        lineHeight={"24px"}
                        color={"var(--gray-600, #475467)"}
                    >
                        {props?.phoneNumber}
                    </Typography>
                </Grid>
            </Grid>
        </Card>
    )
}

export default ConsumerDetails