import { Grid } from "@mui/material";
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
      <Grid width={'100%'} container spacing={1}>
        {item.data.map((opt) => {
          return (
            <Grid
              key={`${elemId}-${opt.key}`}
              alignSelf={"stretch"}
              sx={{
                margin: {
                  xs: "-0.3rem auto",
                  sm: "-0.3rem auto 0",
                  md: "0.3rem 0 0",
                  lg: "0.3rem 0 0",
                },
                padding: 0,
              }}
              item
              xs={12}
              sm={12}
              md={4}
              lg={4}
            >
              <CardLocations
                navigate={`/inventory/${String(
                  item.routeTitle
                ).toLowerCase()}?${decodeURI(opt.key)}&search=${
                  searchItem && searchItem
                }`}
                title={dictionary[opt.key] ?? opt.key}
                props={`${opt.value} total devices`}
                optional={null}
                style={{ width: "100%", padding: 0 }}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  }
};

export default CardForTreeView;
