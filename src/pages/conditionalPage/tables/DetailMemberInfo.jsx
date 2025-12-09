import { Grid } from "@mui/material"
import { Table } from "antd"
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30"

const DetailMemberInfo = () => {
        
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
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          margin={"2rem auto 1rem"}
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 500,
              color: "#000",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            Current assigned devices:&nbsp;
          </p>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          item
          xs={12}
        >
          <Table
            sticky
            size="large"
            columns={[]}
            style={{ width: "100%" }}
            dataSource={[]}
            pagination={{
              position: ["bottomCenter"],
            }}
            className="table-ant-customized"
          />
        </Grid>
      </Grid>
    );
}

export default DetailMemberInfo