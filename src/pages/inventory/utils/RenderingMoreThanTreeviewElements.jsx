import { Grid } from "@mui/material";
import CardLocations from "./CardLocations";

const RenderingMoreThanTreeviewElements = ({
  item,
  dictionary,
  searchItem,
}) => {
  const elemId = item.key;
  const r = () => item.data; //ensureThreeItems(item.data);
  return (
    <Grid
      container
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignContent: "flex-start",
        gap: "10px",
      }}
    >
      {r().map((opt) => {
        return (
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
        );
      })}
    </Grid>
  );
};

export default RenderingMoreThanTreeviewElements;
