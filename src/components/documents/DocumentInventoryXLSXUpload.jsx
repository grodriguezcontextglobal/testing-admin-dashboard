import { message, Modal } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { read, utils } from "xlsx";
import { Subtitle } from "../../styles/global/Subtitle";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import GrayButtonComponent from "../UX/buttons/GrayButton";
import { devitrakApi } from "../../api/devitrakApi";
import { groupBy } from "lodash";
import { verifyAndCreateLocation } from "../../pages/inventory/actions/utils/verifyLocationBeforeCreateNewInventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { onTrackBackgroundJob } from "../../store/slices/backgroundJobsSlice";
import generateIdempotencyKey from "../../utils/actions/generateIdempotencyKey";
import { formatDate } from "../../pages/inventory/utils/dateFormat";
import { normalizeOwnership } from "../../pages/inventory/actions/utils/ownershipUtils";
import {
    aliasesFor,
    headerFor,
    missingRequiredFields,
    normalizeHeader,
    RECOMMENDED_IMPORT_FIELDS,
    REQUIRED_IMPORT_FIELDS,
} from "../../pages/inventory/utils/inventoryImportTemplate";
import {
    inventoryCacheKeys,
    inventoryPageQueryKeys,
} from "../../pages/inventory/utils/inventoryQueryKeys";
import { encodeExtraIdentifiers } from "../../pages/inventory/utils/extraIdentifiers";

/** "A, B and C" — reads the required/recommended field notes from the same
 * two arrays the parser enforces, so the message can't drift from them again. */
const joinWithAnd = (items) => {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

const requiredHeaders = REQUIRED_IMPORT_FIELDS.map(headerFor);
const recommendedHeaders = RECOMMENDED_IMPORT_FIELDS.map(headerFor);

const DocumentInventoryXLSXUpload = ({ closeModal }) => {
    const { user } = useSelector((state) => state.admin);
    const dispatch = useDispatch();
    const [openModal, setOpenModal] = useState(false);
    const [fileName, setFileName] = useState("");
    const [loadingState, setLoadingState] = useState(false);
    const [processedRows, setProcessedRows] = useState([]);
    const queryClient = useQueryClient();
    const alphaNumericInsertItemMutation = useMutation({
        mutationFn: ({ template, idempotencyKey }) =>
            devitrakApi.post("/db_item/bulk-item-alphanumeric", template, {
                headers: { "Idempotency-Key": idempotencyKey },
            }),
    });

    const processFile = async (originalFile) => {
        try {
            const arrayBuffer = await originalFile.arrayBuffer();
            const workbook = read(arrayBuffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json(worksheet, { defval: "" });

            const processedData = jsonData.map(row => {
                // Header spellings live in inventoryImportTemplate.js, next to the
                // guide and the downloadable template. They were inlined here, which
                // is how the guide came to document columns this parser never read
                // and to omit four it did.
                const val = (field) => {
                    for (const alias of aliasesFor(field)) {
                        if (row[alias] !== undefined) return row[alias];
                        const foundKey = Object.keys(row).find(
                            (k) => normalizeHeader(k) === normalizeHeader(alias)
                        );
                        if (foundKey) return row[foundKey];
                    }
                    return "";
                };

                const requiredValues = REQUIRED_IMPORT_FIELDS.reduce((acc, field) => {
                    acc[field] = val(field);
                    return acc;
                }, {});

                if (missingRequiredFields(requiredValues).length > 0) {
                    return null;
                }

                const { category_name, item_group, serial_number, brand, location, main_warehouse } = requiredValues;
                const ownership = normalizeOwnership(requiredValues.ownership);
                const costRaw = requiredValues.cost;
                const descriptionFromFile = val("descript_item");
                const subLocationRaw = val("sub_location");
                // eslint-disable-next-line no-useless-escape
                const subLocationArray = typeof subLocationRaw === "string" ? String(subLocationRaw).replace(/[\\\[\\\]\\\"]/g, '').split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'null') : [];

                return {
                    category_name,
                    item_group,
                    serial_number,
                    cost: parseFloat(String(costRaw).replace(",", ".")) || 0,
                    brand,
                    descript_item: descriptionFromFile || `${category_name} ${item_group} ${brand} ${ownership === "Rent" ? "for rent" : ""} ${location}`,
                    ownership,
                    main_warehouse,
                    // Warehouse, Assignable, Container, Container Capacity and
                    // "Stored in container?" are no longer columns: asking the
                    // customer to answer five yes/no questions per row confused
                    // more people than it served, and the answer was the same
                    // almost every time. They are fixed here at that answer —
                    // in stock, handout-enabled, not a container — and a unit
                    // that needs otherwise is changed from the item page.
                    warehouse: 1,
                    location,
                    current_location: location,
                    extra_serial_number: val("extra_serial_number"),
                    return_date: val("return_date") || null,
                    container: 0,
                    containerSpotLimit: null,
                    image_url: val("image_url"),
                    enableAssignFeature: 1,
                    isItInContainer: 0,
                    containerId: JSON.stringify([]),
                    display_item: 1,
                    returnedRentedInfo: "",
                    sub_location: subLocationArray,
                    supplier_info: val("supplier_info"),
                    company: user.sqlInfo.company_name,
                    company_id: user.sqlInfo.company_id,
                };
            }).filter(Boolean);

            if (processedData.length > 0) {
                message.success(
                    `${processedData.length} items processed and ready for import.`
                );
            } else {
                message.warning("No valid items could be processed from the file.");
            }
            return processedData;
        } catch (error) {
            console.error("Error processing file:", error);
            message.error("Failed to process file. Please check headers and data format.");
            return [];
        }
    };

    // Not memoized: this goes straight onto an <input onChange>, and a DOM
    // element gains nothing from a stable handler identity. The useCallback that
    // used to be here declared [user.sqlInfo] while calling processFile, which
    // is recreated every render and reads user.sqlInfo itself — so the array was
    // both pointless and wrong, and a stale company could have been baked into
    // the handler.
    const handleFileChange = async (e) => {
        const originalFile = e.target.files?.[0];
        if (!originalFile) return;
        setFileName(originalFile.name);
        setLoadingState(true);
        const processed = await processFile(originalFile);
        setProcessedRows(processed);
        setLoadingState(false);
    };

    const handleUpload = async () => {
        if (processedRows.length === 0)
            return message.warning("No item groups to import. Please select a valid file.");
        setLoadingState(true);
        try {
            const groupedByCategory = groupBy(processedRows, "category_name");
            const templatesForApi = [];

            for (const categoryName in groupedByCategory) {
                const itemsInCategory = groupedByCategory[categoryName];
                const groupedByItemGroup = groupBy(itemsInCategory, "item_group");

                for (const itemGroupName in groupedByItemGroup) {
                    const itemList = groupedByItemGroup[itemGroupName];
                    const firstItem = itemList[0];

                    const serialNumbers = itemList.map(item => `${item.serial_number}`);

                    // Keyed by serial, then encoded through the shared codec.
                    // This used to JSON.stringify the object as-is, which is a
                    // shape no other writer produces and the item edit modal
                    // could not read — imported identifiers were invisible
                    // there, and then overwritten on the next edit.
                    const moreInfo = new Map();
                    itemList.forEach(item => {
                        if (item.extra_serial_number) {
                            const extraInfoArray = String(item.extra_serial_number).split(';').map(pair => {
                                const [key, value] = pair.split('=');
                                return { keyObject: (key || "").trim(), valueObject: (value || "").trim() };
                            }).filter(p => p.keyObject && p.keyObject !== '[]');
                            if (extraInfoArray.length > 0) {
                                moreInfo.set(item.serial_number, extraInfoArray);
                            }
                        }
                    });

                    await verifyAndCreateLocation({
                        locationName: firstItem.location,
                        companyId: user.sqlInfo.company_id,
                        queryClient,
                        user,
                    });
                    const template = {
                        category_name: categoryName,
                        item_group: itemGroupName,
                        cost: firstItem.cost,
                        brand: firstItem.brand,
                        descript_item: firstItem.descript_item,
                        ownership: firstItem.ownership,
                        list: serialNumbers,
                        warehouse: (String(firstItem.warehouse).toLocaleLowerCase() === "yes" || String(firstItem.warehouse).toLocaleLowerCase() === "true"|| firstItem.warehouse === 1) ? 1 : 0,
                        main_warehouse: firstItem.main_warehouse,
                        company: firstItem.company,
                        location: firstItem.location,
                        current_location: firstItem.current_location,
                        sub_location: JSON.stringify(firstItem.sub_location),
                        extra_serial_number: encodeExtraIdentifiers(moreInfo),
                        company_id: firstItem.company_id,
                        return_date: firstItem.return_date,
                        returnedRentedInfo: firstItem.returnedRentedInfo,
                        container: firstItem.container,
                        containerSpotLimit: firstItem.containerSpotLimit,
                        isItInContainer: firstItem.isItInContainer,
                        containerId: firstItem.containerId,
                        display_item: 1,
                        enableAssignFeature: firstItem.enableAssignFeature,
                        image_url: firstItem.image_url,
                        supplier_info: firstItem.supplier_info,
                        created_at: formatDate(new Date()),
                        update_at: formatDate(new Date()),
                    };
                    const idempotencyKey = generateIdempotencyKey();
                    const { data: response } = await alphaNumericInsertItemMutation.mutateAsync({
                        template,
                        idempotencyKey,
                    });
                    dispatch(
                        onTrackBackgroundJob({
                            jobId: response.jobId,
                            type: "bulk-inventory-insert",
                            successMessage: `"${itemGroupName}" was successfully created in inventory.`,
                            failureMessage: `The import of "${itemGroupName}" failed.`,
                            invalidateKeys: inventoryPageQueryKeys(
                                user.sqlInfo.company_id
                            ),
                            clearCacheKeys: inventoryCacheKeys({
                                companyMongoId: user.companyData.id,
                            }),
                        })
                    );
                    templatesForApi.push(template);
                }
            }

            if (templatesForApi.length > 0) {
                message.warning(
                    `${templatesForApi.length} item group(s) queued for import. You'll be notified as each one completes.`
                );
                clearStateAndClose();
                if (typeof closeModal === "function") closeModal();
                return;
            } else {
                message.warning("No item groups could be formed from the processed items.");
            }
        } catch (error) {
            console.error(error);
            message.error(`Upload failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoadingState(false);
        }
    };

    const clearStateAndClose = () => {
        setFileName("");
        setProcessedRows([]);
        const fileInput = document.getElementById("xlsx-importer");
        if (fileInput) {
            fileInput.value = "";
        }
        setOpenModal(false);
    };

    return (
        <>
            <BlueButtonComponent
                title="Import Inventory (.xlsx)"
                func={() => setOpenModal(true)}
                styles={{ width: "fit-content" }}
            />

            <Modal
                title="Import Inventory from XLSX"
                open={openModal}
                onCancel={clearStateAndClose}
                footer={null}
                width={800}
                maskClosable={false}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ ...Subtitle, color: "var(--gray-600, #5d615a)" }}>
                        Select an Excel file to import inventory items. Ensure the columns
                        match the template.
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input
                            id="xlsx-importer"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            disabled={loadingState}
                        />
                        {fileName && (
                            <GrayButtonComponent
                                title="Clear"
                                func={() => {
                                    setFileName("");
                                    setProcessedRows([]);
                                    const fileInput = document.getElementById("xlsx-importer");
                                    if (fileInput) fileInput.value = "";
                                }}
                                styles={{ width: "fit-content" }}
                            />
                        )}
                    </div>

                    <div
                        style={{
                            background: "var(--gray-50, #f7f7f4)",
                            border: "1px solid var(--gray-200, #ddded6)",
                            color: "var(--gray-600, #5d615a)",
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 13,
                        }}
                    >
                        <strong>Note:</strong> <strong>{joinWithAnd(requiredHeaders)}</strong> are
                        mandatory — a row missing any of them is skipped, not imported with a
                        hole in it. We recommend filling in{" "}
                        <strong>{joinWithAnd(recommendedHeaders)}</strong> too: the row is
                        imported without them, but you will have to correct device by device.
                        Every other column is optional and falls back to a default. See the
                        &ldquo;Inventory Import Template Guide&ldquo; for aliases, accepted values and
                        defaults.
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 10,
                            marginTop: 10,
                        }}
                    >
                        <GrayButtonComponent title="Cancel" func={clearStateAndClose} />
                        <BlueButtonComponent
                            title="Import Items"
                            func={handleUpload}
                            loadingState={loadingState}
                            disabled={!processedRows.length || loadingState}
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default DocumentInventoryXLSXUpload;
