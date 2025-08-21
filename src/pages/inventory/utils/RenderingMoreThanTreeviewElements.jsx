// import { Grid } from "@mui/material";
import CardLocations from "./CardLocations";
import { Space } from "antd";

const RenderingMoreThanTreeviewElements = ({
  item,
  dictionary,
  searchItem,
}) => {
  const elemId = item.key;
  const r = () => item.data; //ensureThreeItems(item.data);
  return (
    <Space align="start" size={[8, 16]} wrap style={{ maxWidth: "1400px", minWidth:"320px", width:"100%" }}>
      {r().map((opt) => {
        return (
          <CardLocations
            key={`${elemId}-${opt?.key}`}
            id={`card-${elemId}-`}
            navigate={
              opt?.fake
                ? null
                : `/inventory/${String(
                    item.routeTitle
                  ).toLowerCase()}?${decodeURI(opt?.key)}&search=${
                    searchItem && searchItem
                  }`
            }
            title={dictionary[opt?.key] ?? opt?.key}
            props={`${opt?.value} total devices`}
            optional={null}
            style={{ general: { opacity: opt?.fake ? 0 : 1, cursor: null } }}
          />
        );
      })}
    </Space>
  );
};

export default RenderingMoreThanTreeviewElements;
