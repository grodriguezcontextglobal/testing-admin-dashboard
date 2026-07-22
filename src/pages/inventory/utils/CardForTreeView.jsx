import { useId } from "react";
import TreeView from "./TreeView";

const CardForTreeView = (props) => {
  const elemId = useId();
  return (
    <div id={`tree-view-container`} style={{ width: "100%" }}>
      <TreeView
        id={`tree-view-${elemId}`}
        key={elemId}
        data={props.data}
        setTypePerLocationInfoModal={props.setTypePerLocationInfoModal}
        setOpenDetails={props.setOpenDetails}
      />
    </div>
  );
};

export default CardForTreeView;
