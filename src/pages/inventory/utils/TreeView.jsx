// TreeView.jsx
import TreeNode from "./TreeNode";
import "../style/viewtree.css";
import { Grid } from "@mui/material";

const TreeView = ({ data }) => {
  return (
    <Grid container gap={2}>
      {Object.entries(data).map(([location, details]) => (
        <Grid key={location} margin={'auto'} item xs={10} sm={10} md={12} lg={12}>
          <TreeNode key={location} nodeName={location} nodeData={details} />
        </Grid>
      ))}
    </Grid>
  );
};

export default TreeView;
