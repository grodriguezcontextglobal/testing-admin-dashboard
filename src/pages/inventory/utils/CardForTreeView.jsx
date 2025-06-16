import { useId } from "react";
// import RenderingMoreThanTreeviewElements from "./RenderingMoreThanTreeviewElements";
import TreeView from "./TreeView";
// import { Grid } from "@mui/material";

const CardForTreeView = (props) => {
  const elemId = useId();
  return (
    // <Grid marginX={"auto"} display={"flex"} flexDirection={"column"} gap={1}>
    //   <Grid width={"100%"} item xs={12} sm={12} md={12} lg={12}>
    <TreeView id={`${elemId}`} key={elemId} data={props.data} />
    //   </Grid>
    // </Grid>
  );
};

export default CardForTreeView;
