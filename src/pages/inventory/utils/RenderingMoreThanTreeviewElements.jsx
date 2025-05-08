import { Grid } from "@mui/material";
import CardLocations from "./CardLocations";
import { Space } from "antd";

const RenderingMoreThanTreeviewElements = ({
  item,
  dictionary,
  searchItem,
}) => {
  const elemId = item.key;
  return (
    <Space
      align="start"
      styles={{ margin: 0, padding: 0, justifyContent: "flex-start" }}
      wrap
    >
      {item.data.map((opt) => {
        return (
          <Space.Compact block={true} key={`${elemId}-${opt?.key}`}>
            <CardLocations
              key={`${elemId}-${opt?.key}`}
              id={`card-${elemId}-`}
              navigate={`/inventory/${String(
                item.routeTitle
              ).toLowerCase()}?${decodeURI(opt?.key)}&search=${
                searchItem && searchItem
              }`}
              title={dictionary[opt?.key] ?? opt?.key}
              props={`${opt?.value} total devices`}
              optional={null}
            />
          </Space.Compact>
        );
      })}
    </Space>
  );
};

export default RenderingMoreThanTreeviewElements;
