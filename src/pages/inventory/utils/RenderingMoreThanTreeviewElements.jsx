// import { Grid } from "@mui/material";
import CardsCarousel from "../../../components/UX/carousel/CardsCarousel";
import CardLocations from "./CardLocations";
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
  // A page at a time (CardsCarousel's twelve): a company with dozens of brands or categories used to
  // get them all at once, and the panel pushed the table off the page.
  return (
    <CardsCarousel
      items={r()}
      label={item.title}
      getKey={(opt) => `${elemId}-${opt?.key}`}
      renderItem={(opt) => (
        <CardLocations
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
      )}
    />
  );
};

export default RenderingMoreThanTreeviewElements;
