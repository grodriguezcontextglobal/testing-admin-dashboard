import { useId } from "react";
import TreeView from "./TreeView";
import { Space } from "antd";
import { useMediaQuery } from "@uidotdev/usehooks";

const CardForTreeView = (props) => {
  const elemId = useId();
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen and (min-width : 1201px)"
  );
  const renderingBreakPoints = () => {
    if (isSmallDevice) return "0 0 0 1rem";
    if (isMediumDevice) return "0 0 0 1rem";
    if (isLargeDevice) return "0 0 0 2rem";
    if (isExtraLargeDevice) return "0 0 0 2rem";
    return "0 0 0 2rem";
  };
  return (
    <Space
      align="start"
      size={[8, 16]}
      wrap
      style={{
        maxWidth: "1400px",
        minWidth: "320px",
        width: "100%",
        padding: renderingBreakPoints(),
      }}
    >
      <TreeView
        id={`${elemId}`}
        key={elemId}
        data={props.data}
        setTypePerLocationInfoModal={props.setTypePerLocationInfoModal}
        setOpenDetails={props.setOpenDetails}
      />
    </Space>
  );
};

export default CardForTreeView;
