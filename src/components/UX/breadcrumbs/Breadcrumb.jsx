import { Breadcrumb as AntBreadcrumb } from "antd";

const Breadcrumb = ({ path = null }) => {
  return <AntBreadcrumb separator=">" items={path} />;
};

export default Breadcrumb;
