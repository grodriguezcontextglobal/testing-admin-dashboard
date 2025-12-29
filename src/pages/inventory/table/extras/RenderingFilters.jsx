import { Grid, OutlinedInput } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "antd";
import { PropTypes } from "prop-types";
import { createContext, useMemo, useState } from "react";
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
import {
  displayTotalDevicesAndTotalAvailablePerLocation,
  extractDataForRendering,
  sortingByParameters,
} from "../../utils/actions/functions";
import useStaffMemberRedirection from "../../utils/actions/useStaffMemberRedirection";
import CardForTreeView from "../../utils/CardForTreeView";
import CardInventoryLocationPreference from "../../utils/CardInventoryLocationPreference";
import RenderingMoreThanTreeviewElements from "../../utils/RenderingMoreThanTreeviewElements";
import StaffMemberWrapper from "../../utils/staffmemberWrapper";
import AdvanceSearchModal from "./AdvanceSearchModal";
export const AdvanceSearchContext = createContext();

const RenderingFilters = ({
  user,
  dataToDisplay,
  searchItem,
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
  searchedResult,
  chosen,
  setTypePerLocationInfoModal,
  setOpenDetails,
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
        role: user.companyData.employees.find(
          (element) => element.user === user.email
        )?.role,
        preference: user.companyData.employees.find(
          (element) => element.user === user.email
        )?.preference || [],
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 2 * 60 * 1000,
  });
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const renderingCardData = user?.companyData?.employees?.find(
    (element) => element.user === user.email
  );
  const extractedData = extractDataForRendering(
    structuredCompanyInventory?.data?.data?.groupedData || {}
  );
  const extractedSearchedData = extractDataForRendering(searchedResult || {});
  const [editingSection, setEditingSection] = useState(null);
  const [sectionName, setSectionName] = useState("");
  const [selectedStaffEmail, setSelectedStaffEmail] = useState(null);
  useStaffMemberRedirection({ staff: selectedStaffEmail });
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
      assignedToStaffMember: "Staff Members",
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
        alert("Invalid section name or key");
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
  // Compute filtered base list for chosen option, otherwise all data
  const keyMap = useMemo(
    () => ({
      0: "brand",
      1: "item_group",
      2: "serial_number",
      3: "location",
      4: "ownership",
      5: "status",
      6: "assignedToStaffMember",
    }),
    []
  );

  const filteredList = useMemo(() => {
    const base = typeof dataToDisplay === "function" ? dataToDisplay() : [];
    if (Array.isArray(chosen) && chosen.length > 0) {
      return base.filter((item) => {
        return chosen.every((filter) => {
          const key = keyMap[filter.category];
          if (!key) return true;
          return item?.[key] === filter.value;
        });
      });
    }
    return base;
  }, [dataToDisplay, chosen, keyMap]);

  // Normalized list for staff assignment grouping
  const normalizedForStaff = useMemo(() => {
    const employeesSource = user?.companyData?.employees;
    const employeesArray = Array.isArray(employeesSource)
      ? employeesSource
      : employeesSource
      ? Object.values(employeesSource)
      : [];

    const validByEmail = new Map(
      employeesArray
        .filter(
          (e) => e?.user && typeof e.user === "string" && e.user.includes("@")
        )
        .map((e) => [e.user.trim(), e])
    );

    const toToken = (raw) => {
      const t = String(raw || "").trim();
      if (!t || t.toLowerCase() === "null") return null;

      const segments = t
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean);
      const candidateEmail = segments[1]?.includes("@")
        ? segments[1]
        : segments[0]?.includes("@")
        ? segments[0]
        : null;

      if (!candidateEmail) return null;
      const emp = validByEmail.get(candidateEmail);
      if (!emp) return null;

      const first = emp?.firstName || "";
      const last = emp?.lastName || "";
      if (!first || !last) return null;

      return `${first} ${last} / ${candidateEmail}`;
    };

    return (filteredList || [])
      .map((item) => {
        const source =
          typeof normalizeStaffAssignment === "function"
            ? normalizeStaffAssignment(item)
            : item.assignedToStaffMember;
        const token = toToken(source);
        return token ? { ...item, assignedToStaffMember: token } : null;
      })
      .filter(Boolean);
  }, [filteredList, user?.companyData?.employees]);

  // Derived groupings from filtered or full list
  const byCategory = useMemo(
    () => sortingByParameters({ props: "category_name", data: filteredList }),
    [filteredList]
  );
  const byGroup = useMemo(
    () => sortingByParameters({ props: "item_group", data: filteredList }),
    [filteredList]
  );
  const byBrand = useMemo(
    () => sortingByParameters({ props: "brand", data: filteredList }),
    [filteredList]
  );
  const byOwnership = useMemo(
    () => sortingByParameters({ props: "ownership", data: filteredList }),
    [filteredList]
  );
  const byAssignedStaff = useMemo(
    () =>
      sortingByParameters({
        props: "assignedToStaffMember",
        data: normalizedForStaff,
      }),
    [normalizedForStaff]
  );

  const locationsAndSublocationsData = () => {
    const source =
      locationsAndSublocationsWithTypes?.data?.data?.ok &&
      locationsAndSublocationsWithTypes?.data?.data?.data
        ? locationsAndSublocationsWithTypes.data.data.data
        : {};

    // If a specific Location was chosen, filter the hierarchy to that node
    const locationFilter = Array.isArray(chosen)
      ? chosen.find((filter) => filter.category === 3)
      : null;
    if (locationFilter) {
      const target = locationFilter.value;

      const findNode = (obj, name) => {
        if (!obj || typeof obj !== "object") return null;
        for (const [key, node] of Object.entries(obj)) {
          if (key === name) {
            return { [key]: node };
          }
          if (node?.children && typeof node.children === "object") {
            const found = findNode(node.children, name);
            if (found) return found;
          }
        }
        return null;
      };

      const filteredDirect = findNode(source, target);
      if (!filteredDirect) return source;

      // When a location is directly chosen, also apply filtered counts so totals reflect other filters
      const resolveName = (item) => {
        const loc = item?.location;
        if (!loc) return null;
        if (Array.isArray(loc)) {
          const lastEntry = [...loc]
            .reverse()
            .find((e) => !!(typeof e === "string" ? e : e?.location));
          if (!lastEntry) return null;
          return typeof lastEntry === "string"
            ? lastEntry
            : lastEntry.location ?? null;
        }
        if (typeof loc === "object" && loc?.location) return loc.location;
        return typeof loc === "string" ? loc : null;
      };
      const counts = new Map();
      (filteredList || []).forEach((item) => {
        const name = resolveName(item);
        if (!name) return;
        counts.set(name, (counts.get(name) || 0) + 1);
      });
      const filterTree = (treeObj) => {
        if (!treeObj || typeof treeObj !== "object") return {};
        const result = {};
        for (const [name, node] of Object.entries(treeObj)) {
          const filteredChildren =
            node?.children && typeof node.children === "object"
              ? filterTree(node.children)
              : {};
          const own = counts.get(name) || 0;
          const childrenTotal = Object.values(filteredChildren).reduce(
            (sum, child) => sum + (child.total || 0),
            0
          );
          const total = own + childrenTotal;
          if (total > 0) {
            result[name] = {
              ...node,
              total,
              children: filteredChildren,
            };
          }
        }
        return result;
      };
      const withCounts = filterTree(filteredDirect);
      return Object.keys(withCounts).length ? withCounts : filteredDirect;
    }

    // If searchedResult exists with location hierarchy, prefer it
    if (searchedResult?.main_location) {
      return searchedResult.main_location;
    }

    // If there is a chosen filter or search text, derive locations from filteredList
    const shouldFilterByItems =
      (Array.isArray(chosen) && chosen.length > 0) ||
      !!searchItem ||
      !!searchedResult;

    if (shouldFilterByItems) {
      const resolveName = (item) => {
        const loc = item?.location;
        if (!loc) return null;
        if (Array.isArray(loc)) {
          const lastEntry = [...loc]
            .reverse()
            .find((e) => !!(typeof e === "string" ? e : e?.location));
          if (!lastEntry) return null;
          return typeof lastEntry === "string"
            ? lastEntry
            : lastEntry.location ?? null;
        }
        if (typeof loc === "object" && loc?.location) return loc.location;
        return typeof loc === "string" ? loc : null;
      };

      const counts = new Map();
      (filteredList || []).forEach((item) => {
        const name = resolveName(item);
        if (!name) return;
        counts.set(name, (counts.get(name) || 0) + 1);
      });

      // If no counts were found, return empty to indicate no matching locations
      if (counts.size === 0) return {};

      const filterTree = (treeObj) => {
        if (!treeObj || typeof treeObj !== "object") return {};
        const result = {};
        for (const [name, node] of Object.entries(treeObj)) {
          const filteredChildren =
            node?.children && typeof node.children === "object"
              ? filterTree(node.children)
              : {};
          const own = counts.get(name) || 0;
          const childrenTotal = Object.values(filteredChildren).reduce(
            (sum, child) => sum + (child.total || 0),
            0
          );
          const total = own + childrenTotal;
          if (total > 0) {
            result[name] = {
              ...node,
              total,
              children: filteredChildren,
            };
          }
        }
        return result;
      };

      const withCounts = filterTree(source);
      return Object.keys(withCounts).length ? withCounts : {};
    }

    // No chosen option or search: return all locations
    return source;
  };

  const totalUnitsAllLocations = () => {
    // Sum totals from the currently displayed location tree for consistency
    const tree = locationsAndSublocationsData();
    if (!tree || typeof tree !== "object") return 0;
    let result = 0;
    for (const [, value] of Object.entries(tree)) {
      // Prefer node.total; fallback to computing from children if missing
      if (typeof value?.total === "number") {
        result += value.total;
      } else if (value?.children && typeof value.children === "object") {
        for (const [, child] of Object.entries(value.children)) {
          if (typeof child?.total === "number") {
            result += child.total;
          }
        }
      }
    }
    return result;
  };

  // Helper function to get data based on priority: searchedResult > chosen > all data
  const getDataForSection = (sectionKey) => {
    // Priority 1: If searchedResult exists, use it
    if (searchedResult) {
      if (sectionKey === "location_1") {
        return searchedResult.main_location;
      }
      return extractedSearchedData[sectionKey] || [];
    }

    // Priority 2: If chosen filters exist, use filtered data
    if (Array.isArray(chosen) && chosen.length > 0) {
      switch (sectionKey) {
        case "location_1":
          return locationsAndSublocationsData();
        case "category_name":
          return byCategory;
        case "item_group":
          return byGroup;
        case "brand":
          return byBrand;
        case "ownership":
          return byOwnership;
        case "assignedToStaffMember":
          return byAssignedStaff;
        default:
          return [];
      }
    }

    // Priority 3: Fallback to all data
    if (sectionKey === "location_1") {
      return locationsAndSublocationsData();
    }
    if (sectionKey === "assignedToStaffMember") {
      return byAssignedStaff; // always use normalized grouping for staff
    }
    return extractedData[sectionKey] || [];
  };

  // Helper function to get total units for each section
  const getTotalUnitsForSection = (sectionKey) => {
    // Special handling for location section
    if (sectionKey === "location_1") {
      return totalUnitsAllLocations();
    }

    // For other sections, calculate based on current data state
    if (searchedResult) {
      return extractedSearchedData[sectionKey]?.length || 0;
    }

    if (chosen?.value != null && chosen?.category != null) {
      switch (sectionKey) {
        case "category_name":
          return byCategory.length;
        case "item_group":
          return byGroup.length;
        case "brand":
          return byBrand.length;
        case "ownership":
          return byOwnership.length;
        case "assignedToStaffMember":
          return byAssignedStaff.length;
        default:
          return 0;
      }
    }

    if (sectionKey === "assignedToStaffMember") {
      return byAssignedStaff.length;
    }
    return extractedData[sectionKey]?.length || 0;
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
      data: getDataForSection("location_1"),
      totalUnits: getTotalUnitsForSection("location_1"),
      open: true,
      routeTitle: "location",
      renderMoreOptions: false,
      tree: true,
      identifierRender: 1,
      show: true,
      columns: [{ title: "Name", dataIndex: "name", key: "name" }],
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
      data: getDataForSection("category_name"),
      totalUnits: getTotalUnitsForSection("category_name"),
      open: true,
      routeTitle: "category_name",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      show: true,
      columns: [{ title: "Name", dataIndex: "name", key: "name" }],
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
      data: getDataForSection("item_group"),
      totalUnits: getTotalUnitsForSection("item_group"),
      open: true,
      routeTitle: "group",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      show: true,
      columns: [{ title: "Name", dataIndex: "name", key: "name" }],
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
      data: getDataForSection("brand"),
      totalUnits: getTotalUnitsForSection("brand"),
      open: true,
      routeTitle: "brand",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      show: true,
      columns: [{ title: "Name", dataIndex: "name", key: "name" }],
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
      data: getDataForSection("ownership"),
      totalUnits: getTotalUnitsForSection("ownership"),
      open: true,
      routeTitle: "ownership",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      show: true,
      columns: [{ title: "Name", dataIndex: "name", key: "name" }],
    },
    {
      key: "assignedToStaffMember",
      title: (
        <>
          {editingSection === "assignedToStaffMember" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <OutlinedInput
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                style={{ ...OutlinedInputStyle, width: "200px" }}
              />
              <Button onClick={() => handleNameUpdate("assignedToStaffMember")}>
                Save
              </Button>
              <Button onClick={() => setEditingSection(null)}>Cancel</Button>
            </div>
          ) : (
            <>
              {companyStructure["assignedToStaffMember"] ??
                "Staff Members with assigned devices"}
              &nbsp;{" "}
              <Button
                style={{
                  borderRadius: "25px",
                  width: "fit-content",
                  aspectRatio: "1/1",
                }}
                onClick={() => handleEditClick("assignedToStaffMember")}
                disabled={Number(user.role) > 0}
              >
                <EditIcon />
              </Button>
            </>
          )}
        </>
      ),
      data: getDataForSection("assignedToStaffMember"),
      totalUnits: getTotalUnitsForSection("assignedToStaffMember"),
      open: true,
      routeTitle: "staff",
      renderMoreOptions: false,
      tree: false,
      identifierRender: 0,
      show: true,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
          render: (text) => {
            if (!text || typeof text !== "string") return "";
            const parts = text
              .split("/")
              .map((p) => p.trim())
              .filter(Boolean);
            if (parts.length >= 2) {
              return `${parts[0]} / ${parts[1]}`;
            }
            return text;
          },
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
                    | Total <strong>{item.totalUnits}</strong>{" "}
                    {index === optionsToRenderInDetailsHtmlTags.length - 1
                      ? item.totalUnits > 1
                        ? "members"
                        : "member"
                      : "units"}
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
                              (searchItem && searchItem) ||
                              (chosen.value && chosen.value)
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
                {item.tree && (
                  <CardForTreeView
                    id={`${item.key}`}
                    key={item.key}
                    data={item.data}
                    setTypePerLocationInfoModal={setTypePerLocationInfoModal}
                    setOpenDetails={setOpenDetails}
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
                {!item.tree &&
                  (item.key === "assignedToStaffMember" ? (
                    <StaffMemberWrapper
                      item={item}
                      setSelectedStaffEmail={setSelectedStaffEmail}
                    />
                  ) : (
                    <RenderingMoreThanTreeviewElements
                      item={item}
                      dictionary={dictionary}
                      searchItem={searchItem}
                    />
                  ))}{" "}
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

const extractStaffToken = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  // Split by '/', trim, drop empty parts
  const parts = raw
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  // Expect at least name and email; ignore trailing date or extras
  if (parts.length >= 2) {
    const name = parts[0];
    const email = parts[1];
    return `${name} / ${email}`;
  }
  return null;
};

const normalizeStaffAssignment = (item) => {
  const value = item?.assignedToStaffMember || item?.usage;
  return extractStaffToken(value);
};
