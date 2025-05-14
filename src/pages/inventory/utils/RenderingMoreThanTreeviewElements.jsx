import { Grid } from "@mui/material";
import CardLocations from "./CardLocations";

const RenderingMoreThanTreeviewElements = ({
  item,
  dictionary,
  searchItem,
}) => {
  const elemId = item.key;
  const renderingGridValue = () => {
    if (item.data.length > 2) {
      return 4;
    } else if (item.data.length > 1) {
      return 6;
    } else {
      return 12;
    }
  };
  return (
    <Grid
      spacing={1}
      container
    >
      {item.data.map((opt) => {
        return (
          <Grid
            key={`${elemId}-${opt?.key}`}
            display={"flex"}
            alignItems={"flex-start"}
            justifyContent={"flex-start"}
            item
            xs={12}
            sm={12}
            md={renderingGridValue()}
            lg={renderingGridValue()}
          >
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
          </Grid>
        );
      })}
    </Grid>
  );
};

export default RenderingMoreThanTreeviewElements;

// <Space
//   align="start"
//   styles={{ margin: 0, padding: 0, justifyContent: "flex-start" }}
//   wrap
// >
// <Space.Compact block={true} key={`${elemId}-${opt?.key}`}>
// </Space>
