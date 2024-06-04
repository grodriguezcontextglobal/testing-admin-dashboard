import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { Link } from "react-router-dom";
import dicRole from "../../../components/general/dicRole";

const InfrmationCard = ({ props }) => {
  return (
    <Card
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignSelf: "stretch",
        borderRadius: "8px",
        border: "1px solid var(--Gray-300, #D0D5DD)",
        background: "var(--Gray-100, #F2F4F7)",
      }}
    >
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Typography
          color="var(--Gray-900, #101828)"
          fontFamily="Inter"
          fontSize="18px"
          fontStyle="normal"
          fontWeight="600"
          lineHeight="28px"
          textAlign={"left"}
        >
          Main point of contact
        </Typography>
        <Link to="/register">
          <Typography
            color="var(--Blue-dark-700, #004EEB)"
            fontFamily="Inter"
            fontSize="14px"
            fontStyle="normal"
            fontWeight="600"
            lineHeight="20px"
            textAlign={"left"}
          >
            Edit
          </Typography>
        </Link>
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Typography
          color="var(--Gray-900, #101828)"
          fontFamily="Inter"
          fontSize="18px"
          fontStyle="normal"
          fontWeight="400"
          lineHeight="28px"
          textAlign={"left"}
        >
          {props.name} {props.lastName}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Typography
          color="var(--Gray-600, #475467)"
          fontFamily="Inter"
          fontSize="16px"
          fontStyle="normal"
          fontWeight="400"
          lineHeight="24px"
          textAlign={"left"}
        >
          {dicRole[Number(props.role)]}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Typography
          color="var(--Gray-600, #475467)"
          fontFamily="Inter"
          fontSize="16px"
          fontStyle="normal"
          fontWeight="400"
          lineHeight="24px"
          textAlign={"left"}
        >
          {props.company}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Typography
          color="var(--Gray-600, #475467)"
          fontFamily="Inter"
          fontSize="16px"
          fontStyle="normal"
          fontWeight="400"
          lineHeight="24px"
          textAlign={"left"}
        >
          {props.email}
        </Typography>
      </Grid>
    </Card>
  );
};

export default InfrmationCard;
