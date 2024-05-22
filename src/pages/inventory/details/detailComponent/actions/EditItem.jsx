/* eslint-disable no-unused-vars */
import { Grid, Typography } from "@mui/material"
import { useWindowScroll } from "@uidotdev/usehooks"
import { Card } from "antd"
import { useState } from "react"
import { EditIcon } from "../../../../../components/icons/Icons"
import { CardStyle } from "../../../../../styles/global/CardStyle"
import CenteringGrid from "../../../../../styles/global/CenteringGrid"
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton"
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText"
import EditItemModal from "../components/EditItemModal"

const EditItem = ({ dataFound }) => {
    const [{ x, y }, scrollTo] = useWindowScroll()
    const [openEditItemModal, setOpenEditItemModal] = useState(false)
    return (
        // <Grid
        //     padding={"0px"}
        //     display={"flex"}
        //     justifyContent={"flex-end"}
        //     textAlign={"right"}
        //     alignItems={"flex-end"}
        //     alignSelf={"start"}
        //     item
        //     xs={12}
        //     sm={12}
        //     md={12}
        // >
        //     <Card
        //         style={{ ...CardStyle, padding: "0" }}
        //     >
        //         <Grid
        //             display={"flex"}
        //             padding={0}
        //             justifyContent={"flex-end"}
        //             alignItems={"center"}
        //             container
        //         >
        //             <Grid
        //                 display={"flex"}
        //                 justifyContent={"flex-end"}
        //                 textAlign={"right"}
        //                 alignItems={"center"}
        //                 item
        //                 xs={12}
        //             >
        <>
            <button onClick={() => { scrollTo({ left: 0, top: '50dv', behavior: 'smooth' }); setOpenEditItemModal(true) }} style={{
                outline: "none",
                display: 'flex',
                padding: '10px 16px',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                border: '1px solid var(--Blue-dark-50, #EFF4FF)',
                background: 'var(--Blue-dark-50, #EFF4FF)',
            }}>
                <EditIcon />
                <p style={{
                    color: 'var(--Blue-dark-700, #004EEB)',
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    lineHeight: '20px',
                }}>Edit</p>

            </button>
            {openEditItemModal && <EditItemModal dataFound={dataFound} openEditItemModal={openEditItemModal} setOpenEditItemModal={setOpenEditItemModal} />}
        </>
        //             </Grid >
        //         </Grid >
        //     </Card >
        // </Grid >
    )
}

export default EditItem