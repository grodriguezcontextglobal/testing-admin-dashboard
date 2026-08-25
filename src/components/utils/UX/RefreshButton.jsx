import TextLink from "../../UX/buttons/TextLink";
import RefreshIcon from "../../icons/RefreshIcon";

const RefreshButton = ({ propsFn = null }) => {
  return (
    <TextLink iconLeading={<RefreshIcon />} onClick={() => propsFn()}>
      Reload table
    </TextLink>
  );
};

export default RefreshButton;