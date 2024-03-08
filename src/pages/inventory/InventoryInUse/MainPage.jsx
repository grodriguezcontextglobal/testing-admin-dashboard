import { Icon } from '@iconify/react'
import { Grid, InputAdornment, OutlinedInput, Typography } from '@mui/material'
import { Button, Divider } from 'antd'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Component from './Component'


const MainPage = () => {
    const { register, watch } = useForm()
    const { event } = useSelector((state) => state.event)
    return (
        <Grid
            style={{
                padding: "5px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
            }}
            container
        >

            <Grid item xs={10}>
                <Grid
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                    marginTop={5}
                    container
                >
                    <Grid marginY={0} item xs={12}>
                        <Typography
                            textTransform={"none"}
                            style={{
                                color: "var(--gray-900, #101828)",
                                lineHeight: "38px",
                            }}
                            textAlign={"left"}
                            fontWeight={600}
                            fontFamily={"Inter"}
                            fontSize={"30px"}
                        >
                            Inventory of {event.company} in {event.eventInfoDetail.eventName}
                        </Typography>
                    </Grid>
                </Grid>
                {/* <Grid
                    style={{
                        paddingTop: "0px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                    container
                    marginTop={4}
                >
                    <Grid textAlign={"right"} item xs={4}></Grid>
                </Grid> */}
                <Divider />
                <Grid
                    marginY={1}
                    display={"flex"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    gap={1}
                    container
                >
                    <Grid
                        display={"flex"}
                        justifyContent={"flex-start"}
                        alignItems={"center"}
                        rowSpacing={"10px"}
                        item
                        xs={4}
                    >
                        <Link to={'/inventory'}>
                        <Button style={{ width: "fit-content" }}>Back</Button></Link>
                        
                    </Grid>
                    <Grid
                        display={"flex"}
                        justifyContent={"flex-end"}
                        alignItems={"center"}
                        rowSpacing={"10px"}
                        item
                        xs={6}
                    >
                        <OutlinedInput
                            {...register("searchDevice")}
                            style={{ borderRadius: "12px", color: "#344054", height: "5dvh" }}
                            fullWidth
                            placeholder="Search inventory here"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Icon
                                        icon="radix-icons:magnifying-glass"
                                        color="#344054"
                                        width={20}
                                        height={19}
                                    />
                                </InputAdornment>
                            }
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid
                        display={"flex"}
                        justifyContent={"center"}
                        alignItems={"center"}
                        item
                        xs={12}
                    >
                        <Component searchDevice={watch("searchDevice")}  />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}

export default MainPage