import { Grid, Typography } from "@mui/material"
import { Button, Card } from "antd"
import { CardStyle } from "../../../../../styles/global/CardStyle"
import { useWindowScroll } from "@uidotdev/usehooks"
import EditItemModal from "../components/EditItemModal"
import { useState } from "react"
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText"
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton"
import { EditIcon } from "../../../../../components/icons/Icons"
import CenteringGrid from "../../../../../styles/global/CenteringGrid"

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
                style={{ ...CardStyle, padding: "0" }}
            >
                <Grid
                    display={"flex"}
                    padding={0}
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
                        <Button onClick={() => { scrollTo({ left: 0, top: '50dv', behavior: 'smooth' }); setOpenEditItemModal(true) }} style={LightBlueButton}>
                            <span style={{ CenteringGrid, alignSelf: 'stretch ' }}><EditIcon /></span>&nbsp;<Typography style={LightBlueButtonText}>Edit</Typography>
                        </Button>
                    </Grid>
                </Grid>
            </Card>
            {openEditItemModal && <EditItemModal dataFound={dataFound} openEditItemModal={openEditItemModal} setOpenEditItemModal={setOpenEditItemModal} />}
        </Grid>

    )
}

export default EditItem