import { forwardRef } from "react";
import NavigationBarMain from "../navbar/NavigationBarMain";
import UpperBanner from "./UpperBanner";

const HeaderComponent = forwardRef(function HeaderComponent(_props, ref) {
  return (
    <div ref={ref}>
      <UpperBanner />
      <NavigationBarMain />
    </div>
  );
});

export default HeaderComponent;
