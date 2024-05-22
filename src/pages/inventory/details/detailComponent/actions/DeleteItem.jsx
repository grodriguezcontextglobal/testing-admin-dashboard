/* eslint-disable no-unused-vars */
import { useWindowScroll } from "@uidotdev/usehooks"
import { useState } from "react"
import { DangerButton } from "../../../../../styles/global/DangerButton"
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText"
import DeleteItemModal from "../components/DeleteItemModal"

const DeleteItem = ({ dataFound }) => {
    const [{ x, y }, scrollTo] = useWindowScroll()
    const [openDeleteItemModal, setOpenDeleteItemModal] = useState(false)
    return (
        <>
            {/* <Grid
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
                    > */}
            <button onClick={() => { scrollTo({ left: 0, top: '50dv', behavior: 'smooth' }); setOpenDeleteItemModal(true) }} style={{
                outline: "none",
                display: 'flex',
                padding: '10px 16px',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                border: '1px solid #fff2f1',
                background: '#fff2f1',
            }}>
                <p style={{
                    color: "#b42318",
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    lineHeight: '20px',
                }}>Delete</p>
            </button>
            {/* </Grid>
                </Grid>
            </Card> */}
            {openDeleteItemModal && <DeleteItemModal dataFound={dataFound} openDeleteItemModal={openDeleteItemModal} setOpenDeleteItemModal={setOpenDeleteItemModal} />}
            {/* </Grid> */}
        </>
    )
}

export default DeleteItem