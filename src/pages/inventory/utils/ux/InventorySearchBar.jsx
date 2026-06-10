import { Grid, Typography } from "@mui/material";
import Input from "../../../../components/UX/inputs/Input";
<<<<<<< claude/practical-snyder-3e5ec7
import { Button as AntButton, Divider, Tag } from "antd";
import { useContext, useState } from "react";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import FilterLinesIcon from "../../../../components/icons/FilterLinesIcon";
import SearchLgIcon from "../../../../components/icons/SearchLgIcon";
import XCloseIcon from "../../../../components/icons/XCloseIcon";
import FilterOptionsUX from "../FilterOptionsUX";
import { dicSelectedOptions, dictionary } from "../dicSelectedOptions";
import { FilterOptionsContext } from "../../MainPage";

=======
import { Title } from "../../../../styles/global/Title";
// import { Divider } from "antd";
// import ButtonsSearchAndReload from "./ButtonsSearchAndReload";
import { useSelector } from "react-redux";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
// import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../components/UX/buttons/LigthBlueButton";
import { FilterOptionsContext } from "../../MainPage";
// import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
>>>>>>> main
const InventorySearchBar = ({
  companyHasInventoryQuery,
  handleSubmit,
  searchItem,
  register,
  setValue,
  setParams,
  setSearchedResult,
<<<<<<< claude/practical-snyder-3e5ec7
}) => {
  const filterContext = useContext(FilterOptionsContext);
  const chosen = Array.isArray(filterContext?.chosen)
    ? filterContext.chosen
    : [];
  const setChosenOption = filterContext?.setChosenOption;
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");

  const searchRegistration = register("searchItem");
  const clearSearch = () => {
    setValue("searchItem", "");
    setSearchText("");
    setParams(null);
    setSearchedResult(null);
  };

  const removeFilter = (filterToRemove) => {
    setChosenOption?.(
      chosen.filter((f) => f.category !== filterToRemove.category),
=======
  // refetchingQueriesFn,
  // locationsQuery,
  setOpenAdvanceSearchModal,
  setOpenCheckInDevicesFromEvent,
  setOpenDeleteItemModal,
  setOpenShippingModal,
  setShipmentRecordModal,
  dataFilterOptions,
  chosenOption,
  setChosenOption,
  optionsUX,
}) => {
  const { role, locations } = useSelector((state) => state.permission);
  const canRenderButton =
    role === "0" ||
    locations?.every(
      (location) =>
        location.actions?.create &&
        location.actions?.assign &&
        location.actions?.delete &&
        location.actions?.transfer
>>>>>>> main
    );
  };
  const clearAllFilters = () => setChosenOption?.([]);

  return (
    <Grid
      display={companyHasInventoryQuery?.data?.data?.total === 0 && "none"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      item
      xs={12}
      sm={12}
      md={12}
      lg={12}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          margin: "0px 0px 1rem 0px",
          width: "100%",
        }}
      >
        <Typography
          sx={{
            ...Title,
            fontSize: "20px",
            padding: 0,
            textAlign: "left",
            width: {
              xs: "100%",
              sm: "100%",
              md: "50%",
              lg: "50%",
            },
            fontWeight: 600,
            color: "#344054",
          }}
        >
          Search inventory:&nbsp;
        </Typography>
<<<<<<< claude/practical-snyder-3e5ec7
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "8px",
          width: "100%",
        }}
      >
        <form
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "8px",
          }}
          id="search-form"
          onSubmit={handleSubmit(searchItem)}
        >
          <Input
            {...searchRegistration}
            onChange={(e) => {
              searchRegistration.onChange(e);
              setSearchText(e.target.value);
              if (e.target.value.trim() === "") {
                setParams(null);
                setSearchedResult(null);
              }
            }}
            fullWidth
            placeholder="Search"
            endAdornment={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {searchText.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <XCloseIcon />
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Search"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <SearchLgIcon />
                </button>
              </div>
            }
          />
        </form>
        <GrayButtonComponent
          title={
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Filters
              {chosen.length > 0 && (
                <span
                  style={{
                    background: "var(--blue-50, #EFF8FF)",
                    color: "var(--blue-700, #175CD3)",
                    borderRadius: "9999px",
                    padding: "0 8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    lineHeight: "20px",
                  }}
                >
                  {chosen.length}
                </span>
              )}
            </span>
          }
          iconLeading={<FilterLinesIcon />}
          func={() => setShowFilters((prev) => !prev)}
          titleStyles={{ textTransform: "none" }}
          ariaLabel="Toggle filter options"
        />
      </div>
      {chosen.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
            margin: "12px 0 0",
            width: "100%",
          }}
        >
          {chosen.map((filter, idx) => (
            <Tag
              key={`active-filter-${filter.category}-${idx}`}
              closable
              onClose={(e) => {
                e.preventDefault();
                removeFilter(filter);
              }}
              style={{
                padding: "4px 10px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                margin: 0,
                borderRadius: "9999px",
              }}
            >
              {dicSelectedOptions[filter.category]}:{" "}
              {dictionary[filter.value] ?? String(filter.value)}
            </Tag>
          ))}
          <AntButton
            type="link"
            onClick={clearAllFilters}
            style={{ padding: "0 4px", fontSize: "13px" }}
          >
            Clear all
          </AntButton>
        </div>
      )}
      {showFilters && (
        <div
          style={{
            width: "100%",
            margin: "12px 0 0",
            padding: "16px",
            border: "1px solid var(--gray-200, #EAECF0)",
            borderRadius: "12px",
            background: "var(--base-white, #FFF)",
          }}
        >
          <FilterOptionsUX setChosen={setChosenOption ?? (() => {})} />
        </div>
      )}
      <Divider />
=======
        <div style={{ alignItems: "center", display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {canRenderButton && (
            <DangerButtonComponent
              title="Delete group"
              func={() => setOpenDeleteItemModal(true)}
            />
          )}
          {canRenderButton && (
            <BlueButtonComponent
              title="Check in devices from events"
              func={() => setOpenCheckInDevicesFromEvent(true)}
            />
          )}
          {canRenderButton && (
            <LightBlueButtonComponent
              title="Ship out inventory"
              func={() => setOpenShippingModal(true)}
            />
          )}
          {canRenderButton && (
            <LightBlueButtonComponent
              title="Shipment record"
              func={() => setShipmentRecordModal(true)}
            />
          )}
        </div>
      </div>
      <Grid display={"flex"} spacing={1} container>
        <Grid gap={3} item xs={12} sm={12} md={3} lg={3}>
          <form
            style={{ width: "100%", margin: "0px 0px 0.4rem 0px" }}
            id="search-form"
            onSubmit={handleSubmit(searchItem)}
          >
            <Input
              {...register("searchItem")}
              fullWidth
              placeholder="Search device here"
              endAdornment={adornmentButtonsComponent({
                setParams,
                setSearchedResult,
                setValue,
              })}
            />
          </form>
          <LightBlueButtonComponent
            title={"Forecast Inventory"}
            func={() => {
              setOpenAdvanceSearchModal(true);
              localStorage.removeItem("searchParameters");
            }}
            styles={{
              width: "100%",
              margin: "0.5rem 0"
            }}
            titleStyles={{
              textTransform: "none",
            }}
          />
          {/* <GrayButtonComponent
            title={"Refresh Tables"}
            func={() => {
              refetchingQueriesFn();
              locationsQuery.refetch();
            }}
            styles={{
              width: "100%",
            }}
            titleStyles={{
              textTransform: "none",
            }}
          /> */}

        </Grid>
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={9} lg={9}>
          <FilterOptionsContext.Provider
            value={{
              filterOptions: dataFilterOptions,
              chosen: chosenOption,
              setChosenOption: setChosenOption,
            }}
          >
            {optionsUX}
          </FilterOptionsContext.Provider>

        </Grid>
        {/* <Divider /> */}
      </Grid>
>>>>>>> main
    </Grid>
  );
};

export default InventorySearchBar;
