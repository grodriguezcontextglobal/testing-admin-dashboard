// import { Grid } from "@mui/material";
import CardLocations from "./CardLocations";
import { Space } from "antd";
import { ownershipLabel } from "../actions/utils/ownershipUtils";

/**
 * Every filter section renders its cards through here, not just the ownership
 * one, so the label can only be translated for the section where the stored
 * value and the word a person reads are different things. A category called
 * "Rent" is a category.
 */
const cardTitle = (sectionKey, value) =>
  sectionKey === "ownership" ? ownershipLabel(value) : value;

const RenderingMoreThanTreeviewElements = ({ item, searchItem }) => {
  const elemId = item.key;
  const r = () => item.data; //ensureThreeItems(item.data);
  return (
    <Space align="start" size={[8, 16]} wrap style={{ maxWidth: "1400px", minWidth:"320px", width:"100%" }}>
      {r().map((opt) => {
        return (
          <CardLocations
            key={`${elemId}-${opt?.key}`}
            id={`card-${elemId}-`}
            navigate={
              opt?.fake
                ? null
                : `/inventory/${String(
                    item.routeTitle
                  ).toLowerCase()}?${decodeURI(opt?.key)}&search=${
                searchItem || ""
                  }`
            }
            title={cardTitle(item.key, opt?.key)}
            props={`${opt?.value} total devices`}
            total={typeof opt?.value === "number" ? opt.value : null}
            available={
              typeof opt?.totalAvailable === "number"
                ? opt.totalAvailable
                : null
            }
            optional={null}
            style={{ general: { opacity: opt?.fake ? 0 : 1, cursor: null } }}
          />
        );
      })}
    </Space>
  );
};

export default RenderingMoreThanTreeviewElements;
