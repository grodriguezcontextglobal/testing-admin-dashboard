/* eslint-disable no-unused-vars */
import { Grid } from "@mui/material"
import { Avatar, Card } from "antd"
import { useSelector } from "react-redux"
import { CardStyle } from "../../../styles/global/CardStyle"
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28"
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38"

const ConsumerDetailInformation = () => {
    const { customer } = useSelector((state) => state.customer);
    return (
        <Grid
            padding={"0px"}
            display={"flex"}
            justifyContent={"flex-start"}
            textAlign={"left"}
            alignItems={"flex-start"}
            alignSelf={"stretch"}
            item
            xs={12}
            sm={12}
            md={12}
        >
            <Card
                style={CardStyle}
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
                    >
                        <div style={{ alignSelf: "stretch", margin: "0 20px 0 0", width: "110px" }}>
                            <div style={{ width: "100px", height: "100px" }}>
                                <Avatar style={{ width: "100%", height: "10dvh" }}>{customer.name[0]}{customer.lastName[0]}</Avatar>
                            </div>
                        </div>
                        <p
                            style={{ ...TextFontsize18LineHeight28, color: "var(--gray-900, #101828)", textAlign: "left", fontWeight: 600 }}
                        >
                            Name
                            <br />
                            <p
                                style={{ ...TextFontSize30LineHeight38, color: "var(--gray-900, #101828)", textAlign: "left", fontWeight: 600 }}
                            >
                                {customer.name} {customer.lastName}
                            </p>
                            <p
                                style={{ ...TextFontsize18LineHeight28, color: "var(--gray-900, #101828)", textAlign: "left", fontWeight: 400 }}
                            >
                                {/* tag if consumer is active in event */}
                            </p>
                        </p>
                    </Grid>
                </Grid>
            </Card>
        </Grid>
    )
}

export default ConsumerDetailInformation