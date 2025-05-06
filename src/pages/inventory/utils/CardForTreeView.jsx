import { Space } from "antd";
import { useId } from "react";
import CardLocations from "./CardLocations";
import TreeView from "./TreeView";

const CardForTreeView = (props) => {
  const { item, dictionary, searchItem } = props;
  const elemId = useId();
  if (item.tree) {
    return (
      <div style={{ margin: ".5rem 0 0", width: "100%" }}>
        <TreeView key={elemId} data={item.data} />
      </div>
    );
  } else {
    return (
        <Space
          style={{
            // width: "100%",
            // display: "flex",
            // justifyContent: "flex-start",
            // alignItems: "center",
            margin: ".5rem 0 0",
          }}
          wrap
          size={[8, 16]}
        >
          {item.data.map((opt) => {
            return (
                <CardLocations
                key={`${elemId}-${opt.key}`}
                  navigate={`/inventory/${String(
                    item.routeTitle
                  ).toLowerCase()}?${decodeURI(opt.key)}&search=${
                    searchItem && searchItem
                  }`}
                  title={dictionary[opt.key] ?? opt.key}
                  props={`${opt.value} total devices`}
                  optional={null}
                />
            );
          })}
        </Space>
    );
  }
};

export default CardForTreeView;
