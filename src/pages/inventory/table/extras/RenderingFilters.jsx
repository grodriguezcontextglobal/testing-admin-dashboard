import { Grid, OutlinedInput } from "@mui/material";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { createContext, useEffect, useState } from "react";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { Subtitle } from "../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import CardInventoryLocationPreference from "../../utils/CardInventoryLocationPreference";
import { organizeInventoryBySubLocation } from "../../utils/OrganizeInventoryData";
import RenderingMoreThanTreeviewElements from "../../utils/RenderingMoreThanTreeviewElements";
import AdvanceSearchModal from "./AdvanceSearchModal";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import { DownNarrow } from "../../../../components/icons/DownNarrow";
import CardForTreeView from "../../utils/CardForTreeView";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Button } from "antd";
import { EditIcon } from "../../../../components/icons/EditIcon";
export const AdvanceSearchContext = createContext();
function extractDataForRendering(structuredData) {
  const keys = ["category_name", "item_group", "brand", "ownership"];
  const extractedData = {};

  keys.forEach((key) => {
    if (structuredData[key]) {
      extractedData[key] = Object.entries(structuredData[key]).map(
        ([subKey, values]) => ({
          key: subKey,
          value: values.total,
          totalAvailable: values.totalAvailable,
        })
      );
    }
  });

  return extractedData;
}

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
  const structuredCompanyInventory = useQuery({
    queryKey: ["structuredCompanyInventory"],
    queryFn: () =>
      devitrakApi.post(`/db_company/company-inventory-structure`, {
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!user.sqlInfo.company_id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    structuredCompanyInventory.refetch();
  }, []);

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
      const resultAssignable = groupBy(result[1], "data.warehouse");
      if (resultAssignable[1]) {
        return resultAssignable[1].length;
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

  const renderingCardData = user?.companyData?.employees?.find(
    (element) => element.user === user.email
  );

  const renderingTotalUnits = (props) => {
    let result = 0;
    for (let data of props) {
      result = result + data.value;
    }
    return result;
  };

  const extractedData = extractDataForRendering(
    structuredCompanyInventory?.data?.data?.groupedData || {}
  );

  const [structuredCompanyInventoryNames, setStructuredCompanyInventoryNames] =
    useState(() => {
      if (user.companyData.structure) {
        return user.companyData.structure;
      }

      return {
        location_1: "Locations|Sub-locations",
        category_name: "Category",
        item_group: "Groups",
        brand: "Brands",
        ownership: "Ownership",
      };
    });
  const [editingSection, setEditingSection] = useState(null);
  const [sectionName, setSectionName] = useState("");

  const handleEditClick = (sectionKey) => {
    setEditingSection(sectionKey);
    setSectionName(structuredCompanyInventoryNames[sectionKey]);
  };

  const handleNameUpdate = async (sectionKey) => {
    try {
      const response = await devitrakApi.patch(
        `/company/update-company/${user.companyData.id}`,
        {
          structure: {
            ...structuredCompanyInventoryNames,
            [sectionKey]: sectionName,
          },
        }
      );

      if (response.data.ok) {
        // Update local state
        let structured = structuredCompanyInventoryNames;
        structured[sectionKey] = sectionName;
        setStructuredCompanyInventoryNames(structured);
        return setEditingSection(null);
      }
    } catch (error) {
      console.error("Failed to update section name:", error);
    }
  };

  const optionsToRenderInDetailsHtmlTags = [
    {
      key: "location_1",
      title: (
        <>
          {editingSection === "location_1" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <OutlinedInput
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                style={{ ...OutlinedInputStyle, width: "200px" }}
              />
              <Button onClick={() => handleNameUpdate("location_1")}>
                Save
              </Button>
              <Button onClick={() => setEditingSection(null)}>Cancel</Button>
            </div>
          ) : (
            <>
              {structuredCompanyInventoryNames["location_1"]}&nbsp;{" "}
              <Button
                style={{
                  borderRadius: "25px",
                  width: "fit-content",
                  aspectRatio: "1/1",
                }}
                onClick={() => handleEditClick("location_1")}
                disabled={Number(user.role) > 0}
              >
                <EditIcon />
              </Button>
            </>
          )}
        </>
      ),
      data: testing(), //sortingByParameters
      totalUnits: renderingTotalUnits(sortingByParameters("location")), //extractingTotalAndAvailableDevices()
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
      title: (
        <>
          {editingSection === "category_name" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <OutlinedInput
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                style={{ ...OutlinedInputStyle, width: "200px" }}
              />
              <Button onClick={() => handleNameUpdate("category_name")}>
                Save
              </Button>
              <Button onClick={() => setEditingSection(null)}>Cancel</Button>
            </div>
          ) : (
            <>
              {structuredCompanyInventoryNames["category_name"]}&nbsp;{" "}
              <Button
                style={{
                  borderRadius: "25px",
                  width: "fit-content",
                  aspectRatio: "1/1",
                }}
                onClick={() => handleEditClick("category_name")}
                disabled={Number(user.role) > 0}
              >
                <EditIcon />
              </Button>
            </>
          )}
        </>
      ),
      data: extractedData.category_name || [],
      totalUnits: extractedData.category_name?.length || 0,
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
      title: (
        <>
          {editingSection === "item_group" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <OutlinedInput
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                style={{ ...OutlinedInputStyle, width: "200px" }}
              />
              <Button onClick={() => handleNameUpdate("item_group")}>
                Save
              </Button>
              <Button onClick={() => setEditingSection(null)}>Cancel</Button>
            </div>
          ) : (
            <>
              {structuredCompanyInventoryNames["item_group"]}&nbsp;{" "}
              <Button
                style={{
                  borderRadius: "25px",
                  width: "fit-content",
                  aspectRatio: "1/1",
                }}
                onClick={() => handleEditClick("item_group")}
                disabled={Number(user.role) > 0}
              >
                <EditIcon />
              </Button>
            </>
          )}
        </>
      ),
      data: extractedData.item_group || [],
      totalUnits: extractedData.item_group?.length || 0,
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
      title: (
        <>
          {editingSection === "brand" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <OutlinedInput
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                style={{ ...OutlinedInputStyle, width: "200px" }}
              />
              <Button onClick={() => handleNameUpdate("brand")}>Save</Button>
              <Button onClick={() => setEditingSection(null)}>Cancel</Button>
            </div>
          ) : (
            <>
              {structuredCompanyInventoryNames["brand"]}&nbsp;{" "}
              <Button
                style={{
                  borderRadius: "25px",
                  width: "fit-content",
                  aspectRatio: "1/1",
                }}
                onClick={() => handleEditClick("brand")}
                disabled={Number(user.role) > 0}
              >
                <EditIcon />
              </Button>
            </>
          )}
        </>
      ),
      data: extractedData.brand || [],
      totalUnits: extractedData.brand?.length || 0,
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
      title: (
        <>
          {editingSection === "ownership" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <OutlinedInput
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                style={{ ...OutlinedInputStyle, width: "200px" }}
              />
              <Button onClick={() => handleNameUpdate("ownership")}>
                Save
              </Button>
              <Button onClick={() => setEditingSection(null)}>Cancel</Button>
            </div>
          ) : (
            <>
              {structuredCompanyInventoryNames["ownership"]}&nbsp;{" "}
              <Button
                style={{
                  borderRadius: "25px",
                  width: "fit-content",
                  aspectRatio: "1/1",
                }}
                onClick={() => handleEditClick("ownership")}
                disabled={Number(user.role) > 0}
              >
                <EditIcon />
              </Button>
            </>
          )}
        </>
      ),
      data: extractedData.ownership || [],
      totalUnits: extractedData.ownership?.length || 0,
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
      {optionsToRenderInDetailsHtmlTags?.map((item, index) => {
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
                  {/* {item.open ? <UpNarrowIcon /> : <DownNarrow />} */}
                  <DownNarrow />
                  &nbsp;
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
                justifyContent={"flex-start"}
                alignItems={"center"}
                sx={{
                  marginX: {
                    xs: 0,
                    sm: 0,
                    md: "auto",
                    lg: "auto",
                  },
                  padding: {
                    xs: "8px 0 0 8px",
                    sm: "8px 0 0 8px",
                  },
                }}
                item
                xs={10}
                sm={10}
                md={7.5}
                lg={7.5}
              >
                {item.tree && (
                  <CardForTreeView
                    id={`${item.key}`}
                    key={item.key}
                    data={item.data}
                  />
                )}{" "}
              </Grid>

              <Grid
                style={{
                  width: "100vw",
                  display: item.open ? "flex" : "none",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                display={item.open ? "flex" : "none"}
                margin={0}
                padding={0}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                {!item.tree && (
                  //   <TreeView id={`${item.key}`} key={item.key} data={item.data} />
                  // ) : (
                  <RenderingMoreThanTreeviewElements
                    item={item}
                    dictionary={dictionary}
                    searchItem={searchItem}
                  />
                )}{" "}
                {/* <CardForTreeView
                  item={item}
                  dictionary={dictionary}
                  searchItem={searchItem}
                /> */}
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
