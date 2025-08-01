import { Grid } from "@mui/material";
import { checkValidJSON } from "../../../../../components/utils/checkValidJSON";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import CardRendered from "../../../utils/CardRendered";

const ExtraInformationItemComponent = ({ dataFound }) => {
  const sortAndMergeData = () => {
    const result = new Set();
    for (let [key, value] of Object.entries(dataFound[0])) {
      if (key === "sub_location" && dataFound[0].warehouse === 1) {
        const subLocations = checkValidJSON(value);
        subLocations?.length > 0 &&
          subLocations.map((item, index) => {
            if (index === 0)
              return result.add({ name: "sub_location", value: item });
            else
              return result.add({
                name: `sub_location_${index + 1}`,
                value: item,
              });
          });
      }
      if (key === "extra_serial_number") {
        const extraSerialNumber = checkValidJSON(value);
        extraSerialNumber?.length > 0 &&
          extraSerialNumber.map((item) => {
            return result.add({
              name: item.keyObject,
              value: item.valueObject,
            });
          });
      }
    }
    return Array.from(result);
  };

  return (
    <>
      <h1
        style={{
          ...TextFontsize18LineHeight28,
          width: "100%",
          textAlign: "left",
          margin: ".5rem 0",
        }}
      >
       Additional information
      </h1>
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        container
        spacing={2}
      >
        {sortAndMergeData().map((item) => {
          return (
            <Grid key={item.value} item xs={12} sm={12} md={4} lg={4}>
              <CardRendered
                props={item.value}
                title={item.name}
                optional={null}
              />
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};

export default ExtraInformationItemComponent;
