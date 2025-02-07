import { Grid } from "@mui/material";
import { Divider, Table } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { RightNarrowInCircle } from "../../../../components/icons/RightNarrowInCircle";
import { onLogin } from "../../../../store/slices/adminSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { Subtitle } from "../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import CardInventoryLocationPreference from "../../utils/CardInventoryLocationPreference";
import CardLocations from "../../utils/CardLocations";
const RenderingFilters = ({ user, dataToDisplay, searchItem }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const displayTotalDevicesAndTotalAvailbalePerLocation = (props) => {
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
  const renderingCardData = user?.companyData?.employees?.find(
    (element) => element.user === user.email
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState(
    renderingCardData ? renderingCardData.preference.inventory_location : []
  );
  const updateEmployeesPreference = () => {
    let employCopy = user.companyData.employees.map((employee) => ({
      ...employee,
    }));
    const index = employCopy.findIndex(
      (element) => element.user === user.email
    );
    if (index > -1) {
      const newData = {
        ...employCopy[index],
        preference: { inventory_location: [...selectedRowKeys] },
      };
      employCopy[index] = newData;
      return employCopy;
    }
    return employCopy;
  };
  const updateInventoryLocationPreferences = async () => {
    const updatedCompany = await devitrakApi.patch(
      `/company/update-company/${user.companyData.id}`,
      {
        employees: updateEmployeesPreference(),
      }
    );
    if (updatedCompany.data.ok) {
      return dispatch(
        onLogin({ ...user, companyData: updatedCompany.data.company })
      );
    }
  };
  const onSelectChange = async (newSelectedRowKeys) => {
    if (
      selectedRowKeys.some((element) => element.key === newSelectedRowKeys[0])
    ) {
      const result = selectedRowKeys.filter(
        (element) => element.key !== newSelectedRowKeys[0]
      );
      return setSelectedRowKeys(result);
    }
    const locationInfo = sortingByParameters("location");
    const result = locationInfo.find(
      (element) => element.key === newSelectedRowKeys[0]
    );
    setSelectedRowKeys([...selectedRowKeys, result]);
  };

  const renderingTotalUnits = (props) => {
    let result = 0;
    for (let data of props) {
      result = result + data.value;
    }
    return result;
  };

  const optionsToRenderInDetailsHtmlTags = [
    {
      title: `Locations`,
      buttonFn: true,
      data: displayTotalDevicesAndTotalAvailbalePerLocation("location"), //sortingByParameters
      totalUnits: renderingTotalUnits(sortingByParameters("location")),
      renderedCardData: selectedRowKeys,
      open: true,
      displayCards: selectedRowKeys?.length > 0,
      routeTitle: "location",
      renderSelectedOptions: [],
      renderMoreOptions: true,
      rowSelection: {
        selectedRowKeys,
        onChange: onSelectChange,
      },
      columns: [
        {
          title: "Locations name",
          dataIndex: "key",
          key: "key",
          render: (key) => <p style={Subtitle}>{key}</p>,
        },
        {
          title: "Total device",
          dataIndex: "valueParameter",
          key: "valueParameter",
          width: "20%",
          render: (valueParameter) => (
            <p style={Subtitle}>{valueParameter.total}</p>
          ),
        },
        {
          title: "Total available devices",
          dataIndex: "valueParameter",
          key: "valueParameter",
          width: "20%",
          render: (valueParameter) => (
            <p style={Subtitle}>{valueParameter.available}</p>
          ),
        },

        {
          title: "",
          dataIndex: "action",
          key: "action",
          width: "10%",
          render: (_, record) => (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <button
                onClick={() =>
                  navigate(
                    `/inventory/location?${record.key}&search=${
                      searchItem && searchItem
                    }`
                  )
                }
                style={{
                  backgroundColor: "transparent",
                  outline: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                <RightNarrowInCircle />
              </button>
            </div>
          ),
        },
      ],
    },
    {
      title: "Category",
      data: sortingByParameters("category_name"),
      totalUnits: sortingByParameters("category_name").length ?? 0,
      open: false,
      routeTitle: "category_name",
      renderMoreOptions: false,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      title: "Groups",
      data: sortingByParameters("item_group"),
      totalUnits: sortingByParameters("item_group").length ?? 0,
      open: false,
      routeTitle: "group",
      renderMoreOptions: false,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      title: "Brands",
      data: sortingByParameters("brand"),
      totalUnits: sortingByParameters("brand").length ?? 0,
      open: false,
      routeTitle: "brand",
      renderMoreOptions: false,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      title: "Ownership",
      data: sortingByParameters("ownership"),
      totalUnits: sortingByParameters("ownership").length ?? 0,
      open: false,
      routeTitle: "ownership",
      renderMoreOptions: false,
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
    <>
      {optionsToRenderInDetailsHtmlTags.map((item) => {
        return (
          <Grid
            key={item.title}
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            margin={"20px 0 0 0"}
            item
            xs={12}
          >
            <details
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
              open={item.open}
            >
              <summary
                style={{
                  width: "100%",
                }}
              >
                <p
                  style={{
                    ...TextFontsize18LineHeight28,
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {item.title}&nbsp;{" "}
                  <span
                    style={{
                      ...Subtitle,
                      // fontWeight: 400,
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    | Total <strong>{item.totalUnits}</strong> units
                  </span>{" "}
                  &nbsp;{" "}
                  {item.buttonFn &&
                    !compareArraysOfObjects(
                      selectedRowKeys,
                      renderingCardData.preference.inventory_location
                    ) && (
                      <button
                        onClick={() => updateInventoryLocationPreferences()}
                        style={BlueButton}
                      >
                        <p style={BlueButtonText}>
                          Update locations preferences
                        </p>
                      </button>
                    )}
                </p>
              </summary>
              <div
                style={{
                  maxWidth: "1228px",
                  width: "99.5vw",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {item.renderedCardData
                  ? item.renderedCardData.map((opt) => {
                      return (
                        <Grid
                          key={opt}
                          alignSelf={"flex-start"}
                          item
                          xs={12}
                          sm={12}
                          md={12}
                          lg={12}
                        >
                          <CardInventoryLocationPreference
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
                    })
                  : item.data.map((opt) => {
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
                          {" "}
                          <Link
                            to={`/inventory/${String(
                              item.routeTitle
                            ).toLowerCase()}?${decodeURI(opt.key)}&search=${
                              searchItem && searchItem
                            }`}
                          >
                            <CardLocations
                              title={dictionary[opt.key] ?? opt.key}
                              props={`${opt.value} total devices`}
                              optional={null}
                              style={{ width: "fit-content" }}
                              width="fit-content"
                            />
                          </Link>
                        </Grid>
                      );
                    })}
              </div>
              {item.renderMoreOptions && (
                <Table
                  pagination={{
                    position: ["bottomCenter"],
                    pageSizeOptions: [10, 20, 30, 50, 100],
                    total: item?.data?.length,
                    defaultPageSize: 10,
                    defaultCurrent: 1,
                  }}
                  style={{ maxWidth: "1228px", width: "99.5vw" }}
                  rowSelection={item.rowSelection}
                  columns={item.columns}
                  dataSource={item.data}
                  className="table-ant-customized"
                />
              )}
            </details>
            <Divider />
          </Grid>
        );
      })}
    </>
  );
};

export default RenderingFilters;

RenderingFilters.propType = {
  user: PropTypes.object,
  dataToDisplay: PropTypes.array,
};
