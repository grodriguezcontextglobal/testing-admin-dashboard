import { Grid, Typography } from "@mui/material";
import { Avatar, List } from "antd";
import "./Body.css";
import IconListTable from "./Icon";

const Body = ({ sortData }) => {
  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
      container
    >
      {" "}
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        marginY={0}
        item
        xs={12}
        sm={12}
        md={12}
      >
        {" "}
        <List
          style={{
            width: "100%",
          }}
          pagination={{
            position: "bottom",
            align: "center",
          }}
          itemLayout="horizontal"
          dataSource={sortData}
          renderItem={(item) => (
            <List.Item
              style={{
                textAlign: "left",
              }}
            >
              <List.Item.Meta
                avatar={<Avatar src={<IconListTable />} />}
                title={<Typography>{item?.actionTaken}</Typography>}
                description={new Date(`${item.time}`).toUTCString()}
              />
            </List.Item>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default Body;
