import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { onLogin } from "../../../../store/slices/adminSlice";
import { onSwitchingCompany } from "../../../../store/slices/helperSlice";
import { Link } from "react-router-dom";
import { groupBy } from "lodash";

const CompanyChoiceCard = ({ props }) => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const grouping = groupBy(props.companyInfo.employees, "user");
  const handleSelect = () => {
    dispatch(
      onLogin({
        ...user,
        data: {
          ...user.data,
          company: props.companyInfo.company_name,
          role: grouping[user.email][0].role,
        },
        company: props.companyInfo.company_name,
        role: grouping[user.email][0].role,
      })
    );
    dispatch(onSwitchingCompany(false));
    return;
  };
  return (
    <Link to="/">
      <Card onClick={() => handleSelect()} style={{ cursor: "pointer" }}>
        <Grid
          display={"flex"}
          flexDirection={"column"}
          padding={"12px 20px"}
          container
        >
          <Grid item xs sm md lg>
            <Typography>{props.companyInfo.company_name}</Typography>
          </Grid>
          <Grid display={"flex"} item xs sm md lg>
            <Typography>{props.companyInfo.address.city},</Typography>{" "}
            <Typography>{props.companyInfo.address.state}</Typography>
          </Grid>
        </Grid>
      </Card>
    </Link>
  );
};

export default CompanyChoiceCard;
