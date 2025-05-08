import { useId } from "react";
import RenderingMoreThanTreeviewElements from "./RenderingMoreThanTreeviewElements";
import TreeView from "./TreeView";

const CardForTreeView = (props) => {
  const { item, dictionary, searchItem } = props;
  const elemId = useId();
  if (item.tree) {
    return <TreeView id={`${elemId}`} key={elemId} data={item.data} />;
  } else {
    return (
        <RenderingMoreThanTreeviewElements
          item={item}
          dictionary={dictionary}
          searchItem={searchItem}
        />
    );
  }
};

export default CardForTreeView;
