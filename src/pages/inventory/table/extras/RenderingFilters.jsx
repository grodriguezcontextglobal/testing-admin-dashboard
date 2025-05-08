import { Grid } from "@mui/material";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { createContext, useEffect } from "react";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { Subtitle } from "../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import CardForTreeView from "../../utils/CardForTreeView";
import CardInventoryLocationPreference from "../../utils/CardInventoryLocationPreference";
import { organizeInventoryBySubLocation } from "../../utils/OrganizeInventoryData";
import AdvanceSearchModal from "./AdvanceSearchModal";
export const AdvanceSearchContext = createContext();

const RenderingFilters = ({
  user,
  dataToDisplay,
  searchItem,
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
}) => {
  const dictionary = {
    Permanent: "Owned",
    Rent: "Leased",
    Sale: "For sale",
  };

  const sortingByParameters = (props) => {
    const totalPerLocation = new Map();
    const parameter = props;
    if (dataToDisplay()?.length > 0) {
      for (let data of dataToDisplay()) {
        if (totalPerLocation.has(data[parameter])) {
          totalPerLocation.set(
            data[parameter],
            totalPerLocation.get(data[parameter]) + 1
          );
        } else {
          totalPerLocation.set(data[parameter], 1);
        }
      }
    }
    const result = new Set();
    for (let [key, value] of totalPerLocation) {
      result.add({ key, value });
    }
    return Array.from(result);
  };

  const renderingTotalAvailableDevices = (props) => {
    const result = groupBy(props, "warehouse");
    if (result[1]) {
      const resultAssignable = groupBy(result[1], "data.enableAssignFeature");
      if (resultAssignable[1]) {
        return resultAssignable[1]?.length;
      }
      return 0;
    }
    return 0;
  };

  const displayTotalDevicesAndTotalAvailablePerLocation = (props) => {
    const totalPerLocation = new Map();
    const parameter = props;
    if (dataToDisplay()?.length > 0) {
      for (let data of dataToDisplay()) {
        if (totalPerLocation.has(data[parameter])) {
          totalPerLocation.set(data[parameter], [
            ...totalPerLocation.get(data[parameter]),
            data,
          ]);
        } else {
          totalPerLocation.set(data[parameter], [data]);
        }
      }
    }
    const result = new Set();
    for (let [key, value] of totalPerLocation) {
      const valueParameter = {
        total: value.length ?? 0,
        available: renderingTotalAvailableDevices(value),
      };
      result.add({ key, valueParameter });
    }
    return Array.from(result);
  };

  const testing = () => {
    const result = groupBy(dataToDisplay(), "data.location");
    const template = new Set();
    if (dataToDisplay()?.length > 0) {
      for (let [key, value] of Object.entries(result)) {
        const groupingByAvailableDevices = groupBy(value, "warehouse");
        template.add({
          location: key,
          value,
          total: value.length,
          available: groupingByAvailableDevices[1]?.length ?? 0,
        });
      }
    }
    return organizeInventoryBySubLocation(result);
  };

  const extractingTotalAndAvailableDevices = () => {
    const groupingByLocation = groupBy(dataToDisplay(), "location");
    const result = new Map();
    for (let [key, value] of Object.entries(groupingByLocation)) {
      if (!result.has(key)) {
        result.set(key, {
          total: value.length,
          available: renderingTotalAvailableDevices(value),
        });
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    testing();
    return () => {
      controller.abort();
    };
  }, []);

  const renderingCardData = user?.companyData?.employees?.find(
    (element) => element.user === user.email
  );

  // const renderingTotalUnits = (props) => {
  //   let result = 0;
  //   for (let data of props) {
  //     result = result + data.value;
  //   }
  //   return result;
  // };

  const optionsToRenderInDetailsHtmlTags = [
    {
      key: "location_1",
      title: "Locations|Sub-locations",
      data: testing(), //sortingByParameters
      totalUnits: extractingTotalAndAvailableDevices(), //renderingTotalUnits(sortingByParameters("location")),
      open: true,
      routeTitle: "location",
      renderMoreOptions: false,
      tree: true,
      identifierRender: 1,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      key: "category_name",
      title: "Category",
      data: sortingByParameters("category_name"),
      totalUnits: sortingByParameters("category_name").length ?? 0,
      open: true,
      routeTitle: "category_name",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      key: "item_group",
      title: "Groups",
      data: sortingByParameters("item_group"),
      totalUnits: sortingByParameters("item_group").length ?? 0,
      open: true,
      routeTitle: "group",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      key: "brand",
      title: "Brands",
      data: sortingByParameters("brand"),
      totalUnits: sortingByParameters("brand").length ?? 0,
      open: true,
      routeTitle: "brand",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      key: "ownership",
      title: "Ownership",
      data: sortingByParameters("ownership"),
      totalUnits: sortingByParameters("ownership").length ?? 0,
      open: true,
      routeTitle: "ownership",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
  ];

  const deepEqual = (obj1, obj2) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1?.length !== keys2?.length) return false;

    return keys1.every((key) => {
      const val1 = obj1[key];
      const val2 = obj2[key];

      const areObjects =
        val1 && typeof val1 === "object" && val2 && typeof val2 === "object";
      return areObjects ? deepEqual(val1, val2) : val1 === val2;
    });
  };

  const compareArraysOfObjects = (arr1, arr2) => {
    if (arr1?.length !== arr2?.length) return false;

    const sortedArr1 = arr1.slice().sort((a, b) => a.key.localeCompare(b.key));
    const sortedArr2 = arr2.slice().sort((a, b) => a.key.localeCompare(b.key));

    return sortedArr1.every((obj1, index) =>
      deepEqual(obj1, sortedArr2[index])
    );
  };

  return (
    <Grid key="rendering-filter-option-container" container>
      {optionsToRenderInDetailsHtmlTags.map((item, index) => {
        return (
          <Grid
            key={`${item.title}_${index}`}
            style={{
              width: "100%",
              display: "flex",
              flex: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <details
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                margin: "2rem 0",
              }}
              open={item.open}
            >
              <summary
                key={`${item.title}-*-*${index}`}
                style={{
                  width: "100%",
                  margin: "0 0 1rem",
                }}
              >
                <p
                  style={{
                    ...TextFontsize18LineHeight28,
                    width: "fit-content",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  {item.title}&nbsp;{" "}
                  <span
                    style={{
                      ...Subtitle,
                      width: "fit-content",
                      textAlign: "left",
                    }}
                  >
                    | Total <strong>{item.totalUnits}</strong> units
                  </span>{" "}
                  &nbsp;{" "}
                  {item.buttonFn &&
                    !compareArraysOfObjects(
                      [],
                      // selectedRowKeys,
                      renderingCardData.preference.inventory_location
                    ) && (
                      <button
                        // onClick={() => updateInventoryLocationPreferences()}
                        style={BlueButton}
                      >
                        <p style={BlueButtonText}>
                          Update locations preferences
                        </p>
                      </button>
                    )}
                </p>
              </summary>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Grid container>
                  {item.renderedCardData &&
                    item.renderedCardData.map((opt) => {
                      return (
                        <Grid
                          key={opt}
                          alignSelf={"flex-start"}
                          item
                          xs={12}
                          sm={12}
                          md={4}
                          lg={4}
                        >
                          <CardInventoryLocationPreference
                            id="card-inventory-location-preference"
                            key={opt}
                            title={opt.key}
                            props={`${opt.value} total devices`}
                            route={`/inventory/${String(
                              item.routeTitle
                            ).toLowerCase()}?${decodeURI(opt.key)}&search=${
                              searchItem && searchItem
                            }`}
                            style={{
                              width: "fit-content",
                            }}
                            width="fit-content"
                          />
                        </Grid>
                      );
                    })}
                </Grid>
              </Grid>
              <Grid
                display={item.open ? "flex" : "none"}
                margin={0}
                padding={0}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <CardForTreeView
                  item={item}
                  dictionary={dictionary}
                  searchItem={searchItem}
                />
              </Grid>
            </details>
          </Grid>
        );
      })}
      {openAdvanceSearchModal && (
        <AdvanceSearchContext.Provider
          value={{
            location:
              displayTotalDevicesAndTotalAvailablePerLocation("location"),
            category: sortingByParameters("category_name"),
            group: sortingByParameters("item_group"),
            brand: sortingByParameters("brand"),
          }}
        >
          <AdvanceSearchModal
            openAdvanceSearchModal={openAdvanceSearchModal}
            setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
          />
        </AdvanceSearchContext.Provider>
      )}
      {/* </> */}
    </Grid>
  );
};

export default RenderingFilters;

RenderingFilters.propType = {
  user: PropTypes.object,
  dataToDisplay: PropTypes.array,
};
