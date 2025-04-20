import { Grid } from "@mui/material";
import { Link } from "react-router-dom";
import CardLocations from "./CardLocations";
import TreeView from "./TreeView";

const CardForTreeView = (props) => {
  const { item, dictionary, searchItem } = props;
  if (item.tree) {
    return (
      <Grid
        alignSelf={"flex-start"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <TreeView data={item.data} />
      </Grid>
    );
  } else {
    return item.data.map((opt) => {
      return (
        <Grid
          key={opt}
          alignSelf={"flex-start"}
          item
          xs={11}
          sm={11}
          md={4}
          lg={4}
        >
          {" "}
          <Link
            to={`/inventory/${String(
              item.routeTitle
            ).toLowerCase()}?${decodeURI(opt.key)}&search=${
              searchItem && searchItem
            }`}
          >
            <CardLocations
              title={dictionary[opt.key] ?? opt.key}
              props={`${opt.value} total devices`}
              optional={null}
              style={{ width: "fit-content" }}
              width="fit-content"
            />
          </Link>
        </Grid>
      );
    });
  }
};

export default CardForTreeView;
