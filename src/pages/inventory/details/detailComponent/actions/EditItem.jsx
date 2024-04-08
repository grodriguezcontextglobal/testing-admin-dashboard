import { Grid, Typography } from "@mui/material"
import { Button, Card } from "antd"
import { BlueButton } from "../../../../../styles/global/BlueButton"
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText"
import { CardStyle } from "../../../../../styles/global/CardStyle"
import { useWindowScroll } from "@uidotdev/usehooks"
import EditItemModal from "../components/EditItemModal"
import { useState } from "react"

const EditItem = ({ dataFound }) => {
    const [{ x, y }, scrollTo] = useWindowScroll()
    const [openEditItemModal, setOpenEditItemModal] = useState(false)
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
                style={CardStyle}
            >
                <Grid
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
                        <Button onClick={() => { scrollTo({ left: 0, top: '50dv', behavior: 'smooth' }); setOpenEditItemModal(true) }} style={BlueButton}><Typography style={BlueButtonText}>Edit</Typography></Button>
                    </Grid>
                </Grid>
            </Card>
            {openEditItemModal && <EditItemModal dataFound={dataFound} openEditItemModal={openEditItemModal} setOpenEditItemModal={setOpenEditItemModal} />}
        </Grid>

    )
}

export default EditItem