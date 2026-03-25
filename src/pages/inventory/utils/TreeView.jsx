// TreeView.jsx
import TreeNode from "./TreeNode";
import "../style/viewtree.css";
import { Grid } from "@mui/material";

const TreeView = ({
  data,
  setTypePerLocationInfoModal,
  setOpenDetails,
  selectedLocations,
  onSelectLocation,
}) => {
  return (
    <Grid width={"-webkit-fill-available"} container justifyContent={"center"} alignContent={"center"} padding={0} margin={0} gap={1}>
      {/* <> */}
      {Object.entries(data).map(([location, details]) => (
        <Grid
          key={location}
          id={`tree-node-${location}`}
          margin={"auto"}
          padding={0}
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
            setTypePerLocationInfoModal={setTypePerLocationInfoModal}
            setOpenDetails={setOpenDetails}
            selectedLocations={selectedLocations}
            onSelectLocation={onSelectLocation}
          />
        </Grid>
      ))}
      {/* </> */}
    </Grid>
  );
};

export default TreeView;
