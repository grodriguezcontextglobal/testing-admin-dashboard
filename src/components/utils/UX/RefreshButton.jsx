import { Icon } from "@iconify/react/dist/iconify.js";
import BlueButtonComponent from "../../UX/buttons/BlueButton";

const RefreshButton = ({ propsFn = null }) => {
  return (
    <BlueButtonComponent title={"Refresh"} func={() => propsFn()} icon={<Icon icon="jam:refresh" />} />
  );
};

export default RefreshButton;
