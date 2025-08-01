import { Grid, OutlinedInput } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "antd";
// import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { createContext, useState } from "react";
import { useDispatch } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { DownNarrow } from "../../../../components/icons/DownNarrow";
import { EditIcon } from "../../../../components/icons/EditIcon";
import { onLogin } from "../../../../store/slices/adminSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";
import CardForTreeView from "../../utils/CardForTreeView";
import CardInventoryLocationPreference from "../../utils/CardInventoryLocationPreference";
// import { organizeInventoryBySubLocation } from "../../utils/OrganizeInventoryData";
import RenderingMoreThanTreeviewElements from "../../utils/RenderingMoreThanTreeviewElements";
import AdvanceSearchModal from "./AdvanceSearchModal";
import {
  displayTotalDevicesAndTotalAvailablePerLocation,
  extractDataForRendering,
  sortingByParameters,
} from "../../utils/actions/functions";
export const AdvanceSearchContext = createContext();

const RenderingFilters = ({
  user,
  dataToDisplay,
  searchItem,
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
  searchedResult,
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
    staleTime: 2 * 60 * 1000,
  });
  const locationsAndSublocationsWithTypes = useQuery({
    queryKey: ["locationsAndSublocationsWithTypes"],
    queryFn: () =>
      devitrakApi.post("/db_company/get-location-item-types-hierarchy", {
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 2 * 60 * 1000,
  });
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const locationsAndSublocationsData = () => {
    let result = {};
    if (locationsAndSublocationsWithTypes?.data?.data?.ok) {
      result = locationsAndSublocationsWithTypes?.data?.data?.data;
    }
    return result;
  };
  const renderingCardData = user?.companyData?.employees?.find(
    (element) => element.user === user.email
  );
  const extractedData = extractDataForRendering(
    structuredCompanyInventory?.data?.data?.groupedData || {}
  );
  const extractedSearchedData = extractDataForRendering(searchedResult || {});
  const [editingSection, setEditingSection] = useState(null);
  const [sectionName, setSectionName] = useState("");
  const [companyStructure, setCompanyStructure] = useState(() => {
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
  const handleEditClick = (sectionKey) => {
    setEditingSection(sectionKey);
    setSectionName(companyStructure[sectionKey]);
  };
  const handleNameUpdate = async (sectionKey) => {
    try {
      await clearCacheMemory(`company_id=${user.companyData.id}`);
      if (!sectionName?.trim() || !sectionKey) {
        console.error("Invalid section name or key");
        return;
      }

      // Create a clean copy of the company data without any proxy objects
      const cleanCompanyData = JSON.parse(JSON.stringify(user.companyData));
      const updatedStructure = {
        ...cleanCompanyData.structure,
        [sectionKey]: sectionName.trim(),
      };

      // Update the database first
      const response = await devitrakApi.patch(
        `/company/update-company/${user.companyData.id}`,
        {
          ...cleanCompanyData,
          structure: updatedStructure,
        }
      );
      if (response?.data?.ok) {
        // Force cache invalidation before state updates
        dispatch(
          onLogin({
            ...user,
            companyData: {
              ...user.companyData,
              structure: updatedStructure,
            },
          })
        );
        await Promise.all([
          queryClient.invalidateQueries("structuredCompanyInventory"),
          queryClient.invalidateQueries("listOfItemsInStock"),
          queryClient.invalidateQueries("ItemsInInventoryCheckingQuery"),
          queryClient.invalidateQueries("RefactoredListInventoryCompany"),
        ]);

        // Force a refetch of the company inventory data
        await structuredCompanyInventory.refetch();

        // Update local state only after successful refetch
        setCompanyStructure((prev) => ({
          ...prev,
          [sectionKey]: sectionName.trim(),
        }));

        setEditingSection(null);
      } else {
        throw new Error(
          "Failed to update database: " + JSON.stringify(response?.data)
        );
      }
    } catch (error) {
      console.error("Failed to update section name:", error);
      // Revert UI state on error
      setCompanyStructure(user.companyData.structure);
      setEditingSection(null);
    }
  };

  const totalUnitsAllLocations = () => {
    let result = 0;
    let data = null;
    if (!searchItem && locationsAndSublocationsWithTypes?.data?.data?.ok) {
      result = 0;
      data = locationsAndSublocationsWithTypes?.data?.data?.data;
      if (data) {
        for (let [, value] of Object.entries(data)) {
          result += value.total;
        }
      }
    } else if (searchItem && searchedResult?.main_location) {
      data = searchedResult;
      result = 0;
      if (data.main_location) {
        for (let [, value] of Object.entries(data.main_location)) {
          result += value.total;
        }
      }
    }
    return result;
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
              {companyStructure["location_1"]}&nbsp;{" "}
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
      data: searchedResult
        ? searchedResult.main_location
        : locationsAndSublocationsData(), //sortingByParameters
      totalUnits: totalUnitsAllLocations(), // renderingTotalUnits(sortingByParameters("location")), //extractingTotalAndAvailableDevices()
      open: true,
      routeTitle: "location",
      renderMoreOptions: false,
      tree: true,
      identifierRender: 1,
      // show: searchItem && searchItem.length > 0 ? false : true,
      show: true,
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
              {companyStructure["category_name"]}&nbsp;{" "}
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
      data: searchedResult
        ? extractedSearchedData.category_name
        : extractedData.category_name || [],
      totalUnits: extractedData.category_name?.length || 0,
      open: true,
      routeTitle: "category_name",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      // show: searchItem && searchItem.length > 0 ? false : true,
      show: true,
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
              {companyStructure["item_group"]}&nbsp;{" "}
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
      data: searchedResult
        ? extractedSearchedData.item_group
        : extractedData.item_group || [],
      totalUnits: extractedData.item_group?.length || 0,
      open: true,
      routeTitle: "group",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      // show: searchItem && searchItem.length > 0 ? false : true,
      show: true,
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
              {companyStructure["brand"]}&nbsp;{" "}
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
      data: searchedResult
        ? extractedSearchedData.brand
        : extractedData.brand || [],
      totalUnits: extractedData.brand?.length || 0,
      open: true,
      routeTitle: "brand",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      // show: searchItem && searchItem.length > 0 ? false : true,
      show: true,
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
              {companyStructure["ownership"]}&nbsp;{" "}
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
      data: searchedResult
        ? extractedSearchedData.ownership
        : extractedData.ownership || [],
      totalUnits: extractedData.ownership?.length || 0,
      open: true,
      routeTitle: "ownership",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      // show: searchItem && searchItem.length > 0 ? false : true,
      show: true,
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
                display: item.show ? "flex" : "none",
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
                      renderingCardData.preference.inventory_location
                    ) && (
                      <button style={BlueButton}>
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
                  <RenderingMoreThanTreeviewElements
                    item={item}
                    dictionary={dictionary}
                    searchItem={searchItem}
                  />
                )}{" "}
              </Grid>
            </details>
          </Grid>
        );
      })}
      {openAdvanceSearchModal && (
        <AdvanceSearchContext.Provider
          value={{
            location: displayTotalDevicesAndTotalAvailablePerLocation({
              props: "location",
              data: dataToDisplay(),
            }),
            category: sortingByParameters({
              props: "category_name",
              data: dataToDisplay(),
            }),
            group: sortingByParameters({
              props: "item_group",
              data: dataToDisplay(),
            }),
            brand: sortingByParameters({
              props: "brand",
              data: dataToDisplay(),
            }),
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
