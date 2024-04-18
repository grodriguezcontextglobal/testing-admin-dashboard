import { Grid, Typography } from "@mui/material"
import { useWindowScroll } from "@uidotdev/usehooks"
import { Button, Card } from "antd"
import { useState } from "react"
import { CardStyle } from "../../../../../styles/global/CardStyle"
import { DangerButton } from "../../../../../styles/global/DangerButton"
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText"
import DeleteItemModal from "../components/DeleteItemModal"

const DeleteItem = ({ dataFound }) => {
    const [{ x, y }, scrollTo] = useWindowScroll()
    const [openDeleteItemModal, setOpenDeleteItemModal] = useState(false)
    return (
        <Grid
            padding={"0px"}
            display={"flex"}
            justifyContent={"flex-end"}
            textAlign={"right"}
            alignItems={"flex-end"}
            alignSelf={"start"}
            item
            xs={12}
            sm={12}
            md={12}
        >
            <Card
                style={{ ...CardStyle, padding: "0" }}
            >
                <Grid
                    padding={0}
                    display={"flex"}
                    justifyContent={"flex-end"}
                    alignItems={"center"}
                    container
                >
                    <Grid
                        display={"flex"}
                        justifyContent={"flex-end"}
                        textAlign={"right"}
                        alignItems={"center"}
                        item
                        xs={12}
                    >
                        <Button onClick={() => { scrollTo({ left: 0, top: '50dv', behavior: 'smooth' }); setOpenDeleteItemModal(true) }} style={{ ...DangerButton, border: "none" }}>
                            <Typography style={DangerButtonText}>Delete</Typography>
                        </Button>
                    </Grid>
                </Grid>
            </Card>
            {openDeleteItemModal && <DeleteItemModal dataFound={dataFound} openDeleteItemModal={openDeleteItemModal} setOpenDeleteItemModal={setOpenDeleteItemModal} />}
        </Grid>

    )
}

export default DeleteItem