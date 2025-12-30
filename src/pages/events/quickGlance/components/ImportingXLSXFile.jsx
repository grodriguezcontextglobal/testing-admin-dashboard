import { message, Button, Tooltip } from "antd";
import { useEffect, useMemo, useState, useRef } from "react";
import { read, utils, writeFile } from "xlsx";
import { DownloadOutlined } from "@ant-design/icons";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import TourModals from "../../../../components/UX/tours/TourModals";
import { Subtitle } from "../../../../styles/global/Subtitle";
import updateItemWarehouseStatus from "./addSerialNumberRangeToEvent/addingItemsMethod/actions/useUpdateItemWarehouseStatus";
import { useDispatch, useSelector } from "react-redux";
import insertDeviceIntoEventTableRecord from "./addSerialNumberRangeToEvent/addingItemsMethod/actions/useInsertDeviceIntoEventTableRecord";
import insertItemsIntoInventoryEvent from "./addSerialNumberRangeToEvent/addingItemsMethod/actions/useInsertItemsIntoInventoryEvent";
import { updateGlobalEventInventoryFromPool } from "../inventory/action/components/EditingEventInventoryActions/updateEventInventoryBasedOnXLSXFileSubmitted";
const normalizeHeader = (key) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

// Map header variants to target keys
const headerAliasMap = {
  item_id: [
    "item_id",
    "device_id",
    "deviceid",
    "id",
    // Excel: "Device ID (database)" → device_id_database
    "device_id_database",
  ],
  serial_number: [
    "serial_number",
    "serial",
    "serialnumber",
    "sn",
    "sku", // From TourModal
  ],
  warehouse: [
    "warehouse",
    "location",
    "site",
    "current_location",
    "main_warehouse", // From TourModal
    "main_location", // From TourModal
    "address", // From TourModal
    "loc", // From TourModal
  ],
  enableFeature: [
    "enable_feature",
    "enablefeature",
    "enable_to_be_assigned",
    "enable_to_assign",
    "enabled",
    // Excel: "Assignable"
    "assignable",
  ],
  item_group: [
    "item_group",
    "itemgroup",
    "item_group_name",
    "itemgroupname",
    "device_name",
    "group_name",
    "group", // From TourModal
    "name", // From TourModal
    "device", // From TourModal
  ],
  category_name: [
    "category_name",
    "categoryname",
    "category", // From TourModal
    "cat", // From TourModal
    "division", // From TourModal
  ],
};

const resolveKey = (normalizedKey) => {
  for (const target in headerAliasMap) {
    if (headerAliasMap[target].includes(normalizedKey)) return target;
  }
  return null;
};

const ImportingXLSXFile = ({
  openImportingXLSXFileContainer,
  setOpenImportingXLSXFileContainer,
  onParsed,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openTour, setOpenTour] = useState(false);
  const [viewContext, setViewContext] = useState({
    item_group: "",
    location: "",
    items: [],
  });
  const dispatch = useDispatch();

  // Refs for Tour
  const deviceIdRef = useRef(null);
  const serialRef = useRef(null);
  const warehouseRef = useRef(null);
  const itemGroupRef = useRef(null);

  // Tour Data
  const tourColumns = [
    {
      title: "Device ID (database)",
      onHeaderCell: () => ({ ref: deviceIdRef }),
      dataIndex: "device_id_database",
      key: "device_id_database",
    },
    {
      title: "Serial Number",
      onHeaderCell: () => ({ ref: serialRef }),
      dataIndex: "serial_number",
      key: "serial_number",
    },
    {
      title: "Warehouse",
      onHeaderCell: () => ({ ref: warehouseRef }),
      dataIndex: "warehouse",
      key: "warehouse",
    },
    {
      title: "Group Name",
      onHeaderCell: () => ({ ref: itemGroupRef }),
      dataIndex: "item_group",
      key: "item_group",
    },
  ];

  const tourData = [
    {
      key: 1,
      device_id_database: "device_123",
      serial_number: "SN123456",
      warehouse: "Main Warehouse",
      item_group: "Audio Equipment",
    },
  ];

  const tourSteps = [
    {
      title: "Device ID",
      description: "The unique ID of the device in the database.",
      target: () => deviceIdRef.current,
    },
    {
      title: "Serial Number",
      description: "The serial number of the device.",
      target: () => serialRef.current,
    },
    {
      title: "Warehouse",
      description: "Current location of the device.",
      target: () => warehouseRef.current,
    },
    {
      title: "Group Name",
      description: "The category or group name for the device.",
      target: () => itemGroupRef.current,
    },
  ];

  const handleDownloadTemplate = () => {
    // eslint-disable-next-line no-unused-vars
    const dataToExport = tourData.map(({ key, ...rest }) => rest);
    const ws = utils.json_to_sheet(dataToExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");
    writeFile(wb, "Event_Inventory_Import_Template.xlsx");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = read(buf, { type: "array" });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const json = utils.sheet_to_json(ws, { defval: "" });
      const normalized = [];
      const errs = [];
      json.forEach((row, idx) => {
        const nr = {};
        Object.entries(row).forEach(([k, v]) => {
          const nk = normalizeHeader(k);
          const target = resolveKey(nk);
          if (target) nr[target] = v;
        });
        const warehouseVal = String(nr.warehouse || "")
          .trim()
          .replace(/\s*\(in-stock\)\s*/i, "");
        if (!nr.item_id || !nr.serial_number || !nr.warehouse) {
          errs.push(
            `Row ${idx + 1}: missing item_id, serial_number, or warehouse`
          );
          return; // skip
        }
        const serialStr = String(nr.serial_number);
        normalized.push({
          item_id: String(nr.item_id),
          serial_number: serialStr,
          warehouse: warehouseVal,
          item_group: String(nr.item_group || "Unspecified"),
        });
      });
      setErrors(errs);
      setRows(normalized);
    } catch (err) {
      setErrors([`Failed to read file: ${err?.message || String(err)}`]);
      setRows([]);
    }
  };

  const groupedByItemGroup = useMemo(() => {
    const groupMap = new Map();
    rows.forEach((r) => {
      const grp = r.item_group || "Unspecified";
      const loc = r.warehouse;
      if (!groupMap.has(grp)) groupMap.set(grp, new Map());
      const locMap = groupMap.get(grp);
      if (!locMap.has(loc)) locMap.set(loc, []);
      locMap.get(loc).push(r);
    });
    const result = Array.from(groupMap.entries()).map(
      ([item_group, locMap]) => {
        const locations = Array.from(locMap.entries()).map(
          ([location, list]) => {
            const serials = list
              .map((x) => String(x.serial_number))
              .sort((a, b) =>
                a.localeCompare(b, undefined, {
                  numeric: true,
                  sensitivity: "base",
                })
              );
            return { location, count: list.length, serials };
          }
        );
        locations.sort((a, b) =>
          String(a.location).localeCompare(String(b.location), undefined, {
            sensitivity: "base",
          })
        );
        const totalCount = locations.reduce((acc, l) => acc + l.count, 0);
        return { item_group, totalCount, locations };
      }
    );
    result.sort((a, b) =>
      String(a.item_group).localeCompare(String(b.item_group), undefined, {
        sensitivity: "base",
      })
    );
    return result;
  }, [rows]);

  useEffect(() => {
    if (typeof onParsed === "function") {
      onParsed({ rows, groupedByItemGroup });
    }
  }, [rows, groupedByItemGroup, onParsed]);

  const closeModal = () => {
    setFileName("");
    return setOpenImportingXLSXFileContainer(false);
  };
  const modalBody = () => {
    return (
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(min-content, 2fr)",
            gap: 8,
          }}
        >
          <label style={{ ...Subtitle, marginBottom: 8 }}>
            Import file (.xlsx) with required columns
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          {fileName ? (
            <div style={{ marginTop: 8, color: "#667085" }}>
              File: {fileName}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <GrayButtonComponent
              title="View Template Guide"
              func={() => setOpenTour(true)}
              style={{ width: "fit-content" }}
            />
            <GrayButtonComponent
              func={() => {
                setErrors([]);
                setRows([]);
                setFileName("");
              }}
              style={{ width: "fit-content" }}
              title="Clear"
            />
          </div>
        </div>

        {/* <div style={{ margin: "0 0 1rem" }}>
          <div style={{ color: "#475467" }}>Required columns:</div>
          <ul style={{ margin: 4 }}>
            <li>Device ID (database)</li>
            <li>Serial Number</li>
            <li>Warehouse or Current Location</li>
            <li>Group Name</li>
          </ul>
        </div> */}

        {errors.length ? (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            <GrayButtonComponent
              func={() => {
                setErrors([]);
                setRows([]);
                setFileName("");
              }}
              style={{ marginLeft: "auto", width: "fit-content" }}
              title="Clear"
            />
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        ) : null}

        {groupedByItemGroup.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div style={{ fontWeight: 600, color: "#344054" }}>
                Groups by item group ({rows.length} items total):
              </div>
              <BlueButtonComponent
                title={"Add to Event Inventory"}
                func={addXLSXDataIntoEventInventory}
                style={{ width: "fit-content" }}
                loadingState={loadingState}
              />
            </div>
            {groupedByItemGroup.map((g) => (
              <div
                key={g.item_group}
                style={{
                  border: "1px solid #EAECF0",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                <div style={{ fontWeight: 600 }}>{g.item_group}</div>
                <div style={{ color: "#667085", marginBottom: 6 }}>
                  {g.totalCount} items
                </div>
                {g.locations.map((loc) => (
                  <div
                    key={`${g.item_group}-${loc.location}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "4px 0",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{loc.location}</div>
                      <div style={{ color: "#667085" }}>{loc.count} items</div>
                    </div>
                    <BlueButtonComponent
                      title={"View"}
                      buttonType="button"
                      func={() => {
                        const items = rows.filter(
                          (r) =>
                            String(r.item_group) === String(g.item_group) &&
                            String(r.warehouse) === String(loc.location)
                        );
                        setViewContext({
                          item_group: g.item_group,
                          location: loc.location,
                          items,
                        });
                        setOpenViewModal(true);
                      }}
                      loadingState={loadingState}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            margin: "0.75rem 0",
          }}
        >
          <GrayButtonComponent
            func={() => closeModal()}
            style={{ marginLeft: "auto", width: "fit-content" }}
            title="Done"
            loadingState={loadingState}
          />
        </div>
      </div>
    );
  };
  const renderViewModalBody = () => {
    const { item_group, location, items } = viewContext;
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600, color: "#344054" }}>{item_group}</div>
        <div style={{ color: "#667085" }}>{location}</div>
        <div style={{ color: "#667085" }}>{items.length} items</div>
        <div style={{ border: "1px solid #EAECF0", borderRadius: 8 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              padding: "8px 12px",
              background: "#F9FAFB",
              color: "#344054",
              fontWeight: 600,
            }}
          >
            <div>Device ID</div>
            <div>Serial Number</div>
            <div>Location</div>
          </div>
          <div>
            {items.map((it, idx) => (
              <div
                key={`${it.serial_number}-${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  padding: "8px 12px",
                  borderTop: "1px solid #EAECF0",
                }}
              >
                <div style={{ color: "#475467" }}>{it.item_id}</div>
                <div style={{ color: "#475467" }}>{it.serial_number}</div>
                <div style={{ color: "#475467" }}>{it.warehouse}</div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}
        >
          <GrayButtonComponent
            title={"Close"}
            func={() => setOpenViewModal(false)}
            style={{ width: "fit-content" }}
          />
        </div>
      </div>
    );
  };

  const addXLSXDataIntoEventInventory = async () => {
    try {
      setLoadingState(true);
      const xlsxMap = new Map();
      for (const g of groupedByItemGroup) {
        const aggregated = [];
        for (const loc of g.locations) {
          const itemIdInfo = await updateItemWarehouseStatus({
            serials: loc.serials,
            companyId: user.sqlInfo.company_id,
          });
          if (!Array.isArray(itemIdInfo) || itemIdInfo.length === 0) {
            message.warning(
              `No matching database items found for ${loc.serials.length} serials at '${loc.location}'.`
            );
            continue;
          }
          await insertItemsIntoInventoryEvent({
            data: itemIdInfo,
            event,
          });
          await insertDeviceIntoEventTableRecord({
            data: itemIdInfo,
            event,
            deviceTitle: g.item_group,
          });
          aggregated.push(...itemIdInfo);
          message.success(
            `Queued ${itemIdInfo.length} items from '${loc.location}' for addition.`
          );
        }
        if (aggregated.length > 0) {
          xlsxMap.set(g.item_group, aggregated);
        }
      }
      if (xlsxMap.size === 0) {
        message.warning("No matching items found to add from the XLSX.");
        return;
      }
      await updateGlobalEventInventoryFromPool({
        event,
        dispatch,
        xlsxData: xlsxMap,
      });
      message.success("All items have been added to event inventory.");
      closeModal();
    } catch (error) {
      console.log(error);
      message.error("Failed to add XLSX data to event inventory.");
    } finally {
      setLoadingState(false);
    }
  };
  return (
    <>
      <ModalUX
        title={"Importing XLSX File"}
        openDialog={openImportingXLSXFileContainer}
        closeModal={() => closeModal()}
        body={modalBody()}
      />
      <ModalUX
        title={"Import Details"}
        openDialog={openViewModal}
        closeModal={() => setOpenViewModal(false)}
        body={renderViewModalBody()}
      />
      {openTour && (
        <TourModals
          open={openTour}
          setOpen={setOpenTour}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Import Template Guide</span>
              <Tooltip title="Download Template">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  size="small"
                />
              </Tooltip>
            </div>
          }
          description="Ensure your Excel file follows this structure."
          columns={tourColumns}
          dataSource={tourData}
          steps={tourSteps}
          width={1000}
        />
      )}
    </>
  );
};

export default ImportingXLSXFile;
