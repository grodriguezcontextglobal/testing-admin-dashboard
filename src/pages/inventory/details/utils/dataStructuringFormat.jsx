import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { groupBy, uniqueId } from "lodash";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import TableDeviceCategory from "../categoryDetail/components/Table";
import TableItemBrand from "../BrandDetail/components/Table";
import TableItemGroup from "../GroupDetail/components/Table";
import TableItemOwnership from "../OwnershipDetail/components/Table";

export const dataStructuringFormat = (
  renderedListItems,
  groupingByDeviceType,
  itemsInInventoryQuery
) => {
  const resultFormatToDisplay = new Set();
  const groupingBySerialNumber = groupBy(
    itemsInInventoryQuery?.data?.data?.items,
    "serial_number"
  );
  if (renderedListItems?.length > 0) {
    for (let data of renderedListItems) {
      if (groupingBySerialNumber[data.serial_number]) {
        resultFormatToDisplay.add({
          key: `${data.item_id}-${uniqueId()}`,
          ...data,
          data: {
            ...data,
            location:
              groupingBySerialNumber[data.serial_number]?.at(-1).location,
            ...groupingBySerialNumber[data.serial_number]?.at(-1),
          },
          location: groupingBySerialNumber[data.serial_number]?.at(-1).location,
          image_url:
            groupingBySerialNumber[data.serial_number]?.at(-1).image_url ??
            groupingByDeviceType[data.item_group]?.at(-1).image_url,
        });
      }
    }
    return Array.from(resultFormatToDisplay);
  }
  return [];
};

export const dataToDisplay = (dataStructuringFormat, searchItem) => {
  if (!searchItem || searchItem === "") {
    // &&(searchParameter === "undefined" || searchParameter === "")
    if (dataStructuringFormat.length > 0) {
      return dataStructuringFormat;
    }
    return [];
  } else if (String(searchItem).length > 0) {
    return dataStructuringFormat?.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(String(searchItem).toLowerCase())
    );
  }
  return [];
};

export const dictionary = {
  Permanent: "Owned",
  Rent: "Leased",
  Sale: "For sale",
};
export const cellStyle = {
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
};

export const BodyComponent = ({
  watch,
  register,
  setReferenceData,
  isLoadingComponent,
  trigger,
}) => {
  return (
    <>
      <Grid
        display={"flex"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <OutlinedInput
          {...register("searchDevice")}
          fullWidth
          placeholder="Search devices here"
          style={OutlinedInputStyle}
          startAdornment={
            <InputAdornment position="start">
              <MagnifyIcon />
            </InputAdornment>
          }
        />
      </Grid>
      <Grid container>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          item
          xs={12}
        >
          {trigger === "category" && (
            <TableDeviceCategory
              searchItem={watch("searchDevice")}
              referenceData={setReferenceData}
              isLoadingComponent={isLoadingComponent}
            />
          )}
          {trigger === "brand" && (
            <TableItemBrand
              searchItem={watch("searchDevice")}
              referenceData={setReferenceData}
              isLoadingComponent={isLoadingComponent}
            />
          )}
          {trigger === "group" && (
            <TableItemGroup
              searchItem={watch("searchDevice")}
              referenceData={setReferenceData}
              isLoadingComponent={isLoadingComponent}
            />
          )}
          {trigger === "ownership" && (
            <TableItemOwnership
              searchItem={watch("searchDevice")}
              referenceData={setReferenceData}
              isLoadingComponent={isLoadingComponent}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
};
