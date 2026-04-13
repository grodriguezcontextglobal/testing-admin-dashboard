import { message, Modal } from "antd";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { read, utils } from "xlsx";
import { Subtitle } from "../../styles/global/Subtitle";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import GrayButtonComponent from "../UX/buttons/GrayButton";
import { devitrakApi } from "../../api/devitrakApi";
import { groupBy } from "lodash";
import { verifyAndCreateLocation } from "../../pages/inventory/actions/utils/verifyLocationBeforeCreateNewInventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clearCacheMemory from "../../utils/actions/clearCacheMemory";
import { formatDate } from "../../pages/inventory/utils/dateFormat";

const DocumentInventoryXLSXUpload = ({ closeModal }) => {
    const { user } = useSelector((state) => state.admin);
    const [openModal, setOpenModal] = useState(false);
    const [fileName, setFileName] = useState("");
    const [loadingState, setLoadingState] = useState(false);
    const [processedRows, setProcessedRows] = useState([]);
    const queryClient = useQueryClient();
    const alphaNumericInsertItemMutation = useMutation({
        mutationFn: (template) =>
            devitrakApi.post("/db_item/bulk-item-alphanumeric", template),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["listOfItemsInStock"],
                exact: true,
                refetchType: "active",
            });
            queryClient.invalidateQueries({
                queryKey: ["ItemsInInventoryCheckingQuery"],
                exact: true,
                refetchType: "active",
            });
            queryClient.invalidateQueries({
                queryKey: ["RefactoredListInventoryCompany"],
                exact: true,
                refetchType: "active",
            });
            clearCacheMemory(
                `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`
            );
            clearCacheMemory(`providerCompanies_${user.companyData.id}`);
        },
    });

    const processFile = async (originalFile) => {
        try {
            const arrayBuffer = await originalFile.arrayBuffer();
            const workbook = read(arrayBuffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json(worksheet, { defval: "" });

            const processedData = jsonData.map(row => {
                const val = (keys) => {
                    if (!Array.isArray(keys)) keys = [keys];
                    for (const key of keys) {
                        if (row[key] !== undefined) return row[key];
                        const foundKey = Object.keys(row).find(
                            (k) =>
                                k.trim().replace("*", "").toLowerCase() ===
                                key.trim().toLowerCase()
                        );
                        if (foundKey) return row[foundKey];
                    }
                    return "";
                };

                const category_name = val(["Category", "category_name", "category"]);
                const item_group = val(["device name", "item_group", "device_name", "Device Name"]);
                const serial_number = val(["serial number", "serial_number", "Serial Number"]);

                if (!category_name || !item_group || !serial_number) {
                    return null;
                }
                const ownership = val(["ownership", "Ownership"]);
                const location = val(["location", "Location"]);
                const brand = val(["brand", "Brand"]);
                const descriptionFromFile = val(["description", "descript_item", "Description"]);
                const warehouseValue = val(["warehouse", "Warehouse"]);
                const costRaw = val(["cost", "Cost"]);
                const assignable = val(["assignable", "enableAssignFeature", "enable_assign_feature"]);
                const storedInContainer = val(["stored in container?", "isItInContainer", "is_it_in_container"]);
                const subLocationRaw = val(["sub locations", "sub_location", "Sub Locations"]);
                console.log("subLocationRaw:", subLocationRaw);
                // eslint-disable-next-line no-useless-escape
                const subLocationArray = typeof subLocationRaw === "string" ? String(subLocationRaw).replace(/[\\\[\\\]\\\"]/g, '').split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'null') : [];
                const containerSpotLimitRaw = val(["container capacity", "containerSpotLimit", "Container Capacity"]);
                const containerSpotLimit = parseInt(containerSpotLimitRaw, 10);

                return {
                    category_name,
                    item_group,
                    serial_number,
                    cost: parseFloat(String(costRaw).replace(",", ".")) || 0,
                    brand,
                    descript_item: descriptionFromFile || `${category_name} ${item_group} ${brand} ${ownership === "Rent" ? "for rent" : ""} ${location}`,
                    ownership,
                    main_warehouse: val(["main warehouse", "main_warehouse", "Main Warehouse"]),
                    warehouse: (warehouseValue === "Yes" || warehouseValue === true) ? 1 : 0,
                    location,
                    current_location: location,
                    extra_serial_number: val(["exra info", "extra_serial_number", "Extra Info"]),
                    return_date: val(["return date", "return_date", "Return Date"]) || null,
                    container: String(val(["container", "Container"])).trim().toUpperCase() === "YES",
                    containerSpotLimit: !isNaN(containerSpotLimit) ? containerSpotLimit : null,
                    image_url: val(["image", "image_url", "Image"]),
                    enableAssignFeature: String(assignable).trim().toUpperCase() === "YES" ? 1 : 0,
                    isItInContainer: String(storedInContainer).trim().toUpperCase() === "YES" ? 1 : 0,
                    containerId: JSON.stringify([]),
                    display_item: 1,
                    returnedRentedInfo: "",
                    sub_location: subLocationArray,
                    supplier_info: val(["supplier info", "supplier_info", "Supplier Info"]),
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

    const handleFileChange = useCallback(
        async (e) => {
            const originalFile = e.target.files?.[0];
            if (!originalFile) return;
            setFileName(originalFile.name);
            setLoadingState(true);
            const processed = await processFile(originalFile);
            setProcessedRows(processed);
            setLoadingState(false);
        },
        [user.sqlInfo]
    );

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

                    const moreInfo = {};
                    itemList.forEach(item => {
                        if (item.extra_serial_number) {
                            const extraInfoArray = String(item.extra_serial_number).split(';').map(pair => {
                                const [key, value] = pair.split('=');
                                return { keyObject: (key || "").trim(), valueObject: (value || "").trim() };
                            }).filter(p => p.keyObject && p.keyObject !== '[]');
                            if (extraInfoArray.length > 0) {
                                moreInfo[item.serial_number] = extraInfoArray;
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
                        extra_serial_number: JSON.stringify(moreInfo),
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
                    await alphaNumericInsertItemMutation.mutate(template);
                    templatesForApi.push(template);
                }
            }

            if (templatesForApi.length > 0) {
                message.warning(`Items were successfully imported. ${templatesForApi.length} item groups were created.`);
                return closeModal();
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
                style={{ width: "fit-content" }}
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
                    <div style={{ ...Subtitle, color: "#667085" }}>
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
                                style={{ width: "fit-content" }}
                            />
                        )}
                    </div>

                    <div
                        style={{
                            background: "#F9FAFB",
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 13,
                        }}
                    >
                        <strong>Note:</strong> All columns described in the &ldquo;Inventory
                        Import Template Guide&ldquo; are mandatory. Please refer to the
                        guide for details on aliases and expected values.
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
