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
              {/* Who acted is the title, because that is what the trail is
                  read for; the email sits with the name because a name alone
                  does not identify a person. What they did and when is the
                  description. */}
              <List.Item.Meta
                avatar={<Avatar src={<IconListTable />} />}
                title={
                  <span
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <Typography component="span" style={{ fontWeight: 600 }}>
                      {item?.staffName}
                    </Typography>
                    {item?.staffEmail && (
                      <Typography
                        component="span"
                        style={{
                          color: "var(--gray-600, #5d615a)",
                          fontSize: "13px",
                        }}
                      >
                        {item.staffEmail}
                      </Typography>
                    )}
                  </span>
                }
                description={
                  <span
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{item?.actionTaken}</span>
                    <span style={{ color: "var(--gray-500, #777b73)" }}>
                      {new Date(`${item.time}`).toUTCString()}
                    </span>
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default Body;
