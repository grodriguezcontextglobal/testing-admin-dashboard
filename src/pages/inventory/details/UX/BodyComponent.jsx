import { Grid, IconButton, InputAdornment, OutlinedInput } from "@mui/material";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import XCloseIcon from "../../../../components/icons/XCloseIcon";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import TableDeviceCategory from "../categoryDetail/components/Table";
import TableItemBrand from "../BrandDetail/components/Table";
import TableItemGroup from "../GroupDetail/components/Table";
import TableItemOwnership from "../OwnershipDetail/components/Table";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";

// The search bar and the table of an inventory detail page (category, brand,
// group, ownership), chosen by `trigger`.
const BodyComponent = ({
  register,
  handleSubmitForm,
  handleSubmit,
  searchedValueItem,
  setSearchedValueItem,
  setReferenceData,
  isLoadingComponent,
  trigger,
  setResultedData,
  setValue,
  watch,
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
        <form
          style={{ width: "100%", display: "flex", gap: "10px" }}
          onSubmit={handleSubmit(handleSubmitForm)}
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
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="Clear search"
                  style={{
                    background: "transparent",
                    outline: "none",
                    padding: 4,
                    borderRadius: "9999px",
                    display:
                      watch("searchDevice") ||
                      (searchedValueItem && searchedValueItem?.length > 0)
                        ? "flex"
                        : "none",
                  }}
                  onClick={() => {
                    setSearchedValueItem(null);
                    setValue("searchDevice", "");
                  }}
                >
                  <XCloseIcon width={18} height={18} />
                </IconButton>
              </InputAdornment>
            }
          />
          <BlueButtonComponent title={"Search"} buttonType="submit" />
        </form>
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
              searchItem={searchedValueItem}
              referenceData={setReferenceData}
              isLoadingComponent={isLoadingComponent}
              setResultedData={setResultedData}
            />
          )}
          {trigger === "brand" && (
            <TableItemBrand
              searchItem={searchedValueItem}
              referenceData={setReferenceData}
              isLoadingComponent={isLoadingComponent}
              setResultedData={setResultedData}
            />
          )}
          {trigger === "group" && (
            <TableItemGroup
              searchItem={searchedValueItem}
              referenceData={setReferenceData}
              isLoadingComponent={isLoadingComponent}
              setResultedData={setResultedData}
            />
          )}
          {trigger === "ownership" && (
            <TableItemOwnership
              searchItem={searchedValueItem}
              referenceData={setReferenceData}
              isLoadingComponent={isLoadingComponent}
              setResultedData={setResultedData}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default BodyComponent;
