import { message } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { read, utils } from "xlsx";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import insertDeviceIntoEventTableRecord from "./actions/useInsertDeviceIntoEventTableRecord";
import updateItemWarehouseStatus from "./actions/useUpdateItemWarehouseStatus";
import insertItemsIntoInventoryEvent from "./actions/useInsertItemsIntoInventoryEvent";
import checkGlobalForUpdateEventInventory from "./actions/checkGlobalForUpdateEventInventory";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";

// Normalize header names to snake_case-like keys
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
  serial_number: ["serial_number", "serial", "serialnumber", "sn"],
  warehouse: ["warehouse", "location", "site"],
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
    "device name",
  ],
  category_name: ["category_name", "categoryname"],
};

const resolveKey = (normalizedKey) => {
  for (const target in headerAliasMap) {
    if (headerAliasMap[target].includes(normalizedKey)) return target;
  }
  return null;
};

const isYes = (val) => {
  const s = String(val ?? "")
    .trim()
    .toLowerCase();
  // Treat "Assignable" as a positive flag as per provided sheet
  return ["yes", "y", "true", "1", 1, "assignable"].includes(s);
};

const ImportingXlsx = ({
  addingDeviceFromLocations,
  blockingButton,
  itemQuery,
  Subtitle,
  deviceTitle,
  closeModal,
}) => {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loadingState, setLoadingState] = useState(false)
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  // Build a map of valid serial numbers by location from itemQuery (current item_group)
  const validSerialsByLocation = useMemo(() => {
    const map = new Map();
    const items = itemQuery?.data?.data?.items || {};
    for (const [location, value] of Object.entries(items)) {
      const list = Array.isArray(value?.serialNumberList)
        ? value.serialNumberList
        : [];
      map.set(location, new Set(list.map(String)));
    }
    return map;
  }, [itemQuery?.data]);

  const allValidSerials = useMemo(() => {
    const set = new Set();
    for (const s of validSerialsByLocation.values()) {
      s.forEach((v) => set.add(v));
    }
    return set;
  }, [validSerialsByLocation]);

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
        const warehouseVal = String(nr.warehouse || "").trim();
        const enableVal = nr.enableFeature;
        // Required fields check
        if (!nr.item_id || !nr.serial_number || !nr.warehouse) {
          errs.push(
            `Row ${idx + 1}: missing item_id, serial_number, or warehouse`
          );
          return; // skip
        }
        // Filter: must not be In-Use and must be enabled
        if (warehouseVal.toLowerCase() === "in-use") return; // skip
        if (!isYes(enableVal)) return; // skip

        // Only include serials that belong to the current item_group inventory
        const serialStr = String(nr.serial_number);
        if (!allValidSerials.has(serialStr)) {
          // Not present in current item_group inventory; skip but note
          errs.push(
            `Row ${
              idx + 1
            }: serial_number ${serialStr} not in current '${deviceTitle}' inventory`
          );
          return;
        }
        normalized.push({
          item_id: String(nr.item_id),
          serial_number: serialStr,
          warehouse: warehouseVal,
          enableFeature: enableVal,
        });
      });
      setErrors(errs);
      setRows(normalized);
    } catch (err) {
      setErrors([`Failed to read file: ${err?.message || String(err)}`]);
      setRows([]);
    }
  };

  // Group rows by warehouse (location)
  const groupedByLocation = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const key = r.warehouse;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries()).map(([location, list]) => ({
      location,
      count: list.length,
      serials: list.map((x) => x.serial_number),
    }));
  }, [rows]);

  // Add a grouped selection via existing flow
  const addGroupToSelection = useCallback(
    async ({ location, serials }) => {
      try {
        setLoadingState(true);
        const leanUpLocationName = String(location).split(" (In-Stock)")[0];
        if (
          !leanUpLocationName ||
          !Array.isArray(serials) ||
          serials.length === 0
        ) {
          return message.warning("No items to add for this location.");
        }

        // Confirm serials exist under this location in the current query
        const validSet = validSerialsByLocation.get(leanUpLocationName);
        if (!validSet) {
          return message.warning(
            `Location '${leanUpLocationName}' not available for ${deviceTitle}.`
          );
        }
        const filtered = serials.filter((s) => validSet.has(String(s)));
        if (filtered.length === 0) {
          return message.warning(
            `No valid items for location '${leanUpLocationName}' in current inventory.`
          );
        }
        const itemIdInfo = await updateItemWarehouseStatus({
          serials: filtered,
          companyId: user.sqlInfo.company_id,
        });
        if (!Array.isArray(itemIdInfo) || itemIdInfo.length === 0) {
          return message.warning(
            `No matching database items found for ${filtered.length} serials at '${leanUpLocationName}'.`
          );
        }
        // Set parent selection context so addingDeviceFromLocations sees the location
        await insertDeviceIntoEventTableRecord({
          data: itemIdInfo,
          event,
          deviceTitle,
        });
        await insertItemsIntoInventoryEvent({
          data: itemIdInfo,
          event,
        });

        await checkGlobalForUpdateEventInventory({
          event,
          newData: itemIdInfo,
          dispatch,
        });
        return message.success(
          `Queued ${filtered.length} items from '${location}' for addition.`
        );
      } catch (error) {
        return message.error(
          `Failed to add items from '${location}': ${error?.message || String(error)}`
        );
      } finally{
        setLoadingState(false);
      }
    },
    [addingDeviceFromLocations, validSerialsByLocation, deviceTitle, closeModal]
  );

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
          <div style={{ marginTop: 8, color: "#667085" }}>File: {fileName}</div>
        ) : null}
        <GrayButtonComponent
          func={() => {
            setErrors([]);
            setRows([]);
            setFileName("");
          }}
          style={{ marginLeft: "auto", width: "fit-content" }}
          title="Clear"
        />
      </div>

      <div style={{ margin: "0 0 1rem" }}>
        <div style={{ color: "#475467" }}>Required columns:</div>
        <ul style={{ margin: 4 }}>
          <li>Device ID (database)</li>
          <li>Serial Number</li>
          <li>Warehouse (must be different to &quot;In-Use&quot;)</li>
          <li>Assignable (must be equal to &quot;Assignable&quot;)</li>
        </ul>
      </div>

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

      {groupedByLocation.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontWeight: 600, color: "#344054" }}>
            Groups detected ({rows.length} items total):
          </div>
          {groupedByLocation.map((g) => (
            <div
              key={g.location}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "1px solid #EAECF0",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{g.location}</div>
                <div style={{ color: "#667085" }}>{g.count} items</div>
              </div>
              <BlueButtonComponent title={"Add from this location"} buttonType="button" func={() => addGroupToSelection(g)} loading={loadingState} disabled={blockingButton} />
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
          disabled={blockingButton}
          loading={loadingState}  
        />
      </div>
    </div>
  );
};

export default ImportingXlsx;
