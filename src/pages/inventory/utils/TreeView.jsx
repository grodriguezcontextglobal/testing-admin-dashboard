// TreeView.jsx
import TreeNode from "./TreeNode";
import "../style/viewtree.css";
import { Grid } from "@mui/material";

const TreeView = ({ data }) => {
  return (
    <Grid
      container
      justifyContent={"center"}
      alignContent={"center"}
      gap={1}
    >
      {Object.entries(data).map(([location, details]) => (
        <Grid
          key={location}
          margin={"auto"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <TreeNode
            key={location}
            nodeName={location}
            nodeData={details}
            path={[location]} // start path
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default TreeView;
