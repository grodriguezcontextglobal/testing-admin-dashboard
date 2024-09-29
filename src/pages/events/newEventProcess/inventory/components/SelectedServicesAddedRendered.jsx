import { Grid, InputLabel, Typography } from "@mui/material";
import { Space, Tag } from "antd";
import { CheckIcon } from "../../../../../components/icons/CheckIcon";
import { Subtitle } from "../../../../../styles/global/Subtitle";

const SelectedServiceAddedRendered = ({extraServiceAdded, removeServiceAdded}) => {
  return (
    <Grid item xs={12}>
    <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
      <Typography
        textTransform={"none"}
        textAlign={"left"}
        style={{ ...Subtitle, fontWeight: 500 }}
      >
        Services added
      </Typography>
    </InputLabel>
    <Space
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
      size={[0, "small"]}
      wrap
    >
      {extraServiceAdded?.map((item, index) => {
        return (
            <Tag
              bordered={false}
              closable
              style={{
                display: "flex",
                padding: "2px 4px 2px 5px",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "3px",
                borderRadius: "6px",
                border: "1px solid var(--gray-300, #D0D5DD)",
                background: "var(--base-white, #FFF)",
                margin: "5px",
              }}
              onClose={() => removeServiceAdded(index)}
              key={`${item.service}${index}`}
            >
              <CheckIcon />
              &nbsp;{item.service}
              {"      "}&nbsp;: ${item.deposit}
            </Tag>
        );
      })}
    </Space>
  </Grid>
)
}

export default SelectedServiceAddedRendered