import { Typography } from "@mui/material"

const renderingTitle = (props) => {
    return (
        <Typography
            fontFamily={"Inter"}
            fontWeight={400}
            fontSize={"24px"}
            lineHeight={"30px"}
            textAlign={"left"}
            textTransform={"none"}
            padding={"12px"}
            style={{
                textWrap: "balance",
            }}
        >
            {props}
        </Typography>
    )
}

export default renderingTitle