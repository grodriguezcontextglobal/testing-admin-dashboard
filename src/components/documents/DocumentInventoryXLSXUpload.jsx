import { message, Modal } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { read, utils } from "xlsx";
import { Subtitle } from "../../styles/global/Subtitle";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import GrayButtonComponent from "../UX/buttons/GrayButton";
import { devitrakApi } from "../../api/devitrakApi";
import { verifyAndCreateLocation } from "../../pages/inventory/actions/utils/verifyLocationBeforeCreateNewInventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { onTrackBackgroundJob } from "../../store/slices/backgroundJobsSlice";
import generateIdempotencyKey from "../../utils/actions/generateIdempotencyKey";
import { formatDate } from "../../pages/inventory/utils/dateFormat";
import {
    headerFor,
    RECOMMENDED_IMPORT_FIELDS,
    REQUIRED_IMPORT_FIELDS,
} from "../../pages/inventory/utils/inventoryImportTemplate";
import {
    inventoryCacheKeys,
    inventoryPageQueryKeys,
} from "../../pages/inventory/utils/inventoryQueryKeys";
import { parseInventoryImportRows } from "../../pages/inventory/utils/inventoryImportRows";
import { readWorkbookCellImages } from "../../pages/inventory/utils/readWorkbookCellImages";
import {
    IMPORT_MODES,
    buildImportPlan,
} from "../../pages/inventory/utils/inventoryImportPlan";
import { buildGroupRequest } from "../../pages/inventory/utils/inventoryImportPayload";
import { uploadImportImages } from "../../pages/inventory/utils/uploadImportImages";

/** "A, B and C" — reads the required/recommended field notes from the same
 * two arrays the parser enforces, so the message can't drift from them again. */
const joinWithAnd = (items) => {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

const requiredHeaders = REQUIRED_IMPORT_FIELDS.map(headerFor);
const recommendedHeaders = RECOMMENDED_IMPORT_FIELDS.map(headerFor);

/** Requests in flight at once. The queue takes them all either way; this keeps
 * one import from crowding out everything else the tab is doing. */
const CONCURRENT_REQUESTS = 4;

/** The columns a device shares across all its units, named as the file names
 * them — `imageMediaPath` is our word for it, not the customer's. */
const SHARED_FIELD_LABELS = {
    brand: "Brand",
    descript_item: "Description",
    imageMediaPath: "picture",
};

/** Runs `task` over `items`, `limit` at a time, in order of completion. */
const runWithLimit = async (items, limit, task) => {
    const results = [];
    let cursor = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await task(items[index], index);
        }
    });
    await Promise.all(workers);
    return results;
};

const panelStyle = {
    background: "var(--gray-50, #f7f7f4)",
    border: "1px solid var(--gray-200, #ddded6)",
    color: "var(--gray-600, #5d615a)",
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
};

const DocumentInventoryXLSXUpload = ({ closeModal }) => {
    const { user } = useSelector((state) => state.admin);
    const dispatch = useDispatch();
    const [openModal, setOpenModal] = useState(false);
    const [fileName, setFileName] = useState("");
    const [loadingState, setLoadingState] = useState(false);
    const [progress, setProgress] = useState("");
    /* What the file turned out to contain. Held as one object so the preview
       and the dispatch always read the same reading of the file. */
    const [preview, setPreview] = useState(null);
    const queryClient = useQueryClient();
    const alphaNumericInsertItemMutation = useMutation({
        mutationFn: ({ template, idempotencyKey }) =>
            devitrakApi.post("/db_item/bulk-item-alphanumeric", template, {
                headers: { "Idempotency-Key": idempotencyKey },
            }),
    });

    /**
     * Reads the file twice: SheetJS for the grid, and the archive itself for
     * the pictures placed inside cells, which SheetJS and ExcelJS both miss.
     */
    const processFile = async (originalFile) => {
        const arrayBuffer = await originalFile.arrayBuffer();
        const workbook = read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = utils.sheet_to_json(worksheet, { defval: "" });

        const { byRow, media } = await readWorkbookCellImages(arrayBuffer);
        const { units, skipped, ignoredImageValues } = parseInventoryImportRows(
            rows,
            { imagesByRow: byRow }
        );

        return {
            rowCount: rows.length,
            units,
            skipped,
            ignoredImageValues,
            media,
            /* One request per device name, with each unit's own cost, location
               and the rest travelling per serial number. How the file is cut
               into requests is our problem, not something to ask the person
               importing it about — see the note on IMPORT_MODES. */
            plan: buildImportPlan(units, { mode: IMPORT_MODES.PER_SERIAL }),
        };
    };

    const handleFileChange = async (e) => {
        const originalFile = e.target.files?.[0];
        if (!originalFile) return;
        setFileName(originalFile.name);
        setLoadingState(true);
        setProgress("Reading the file…");
        try {
            const result = await processFile(originalFile);
            setPreview(result);
            if (result.units.length === 0) {
                message.warning("No valid rows could be read from this file.");
            }
        } catch (error) {
            console.error("Error processing file:", error);
            setPreview(null);
            message.error(
                "Failed to read the file. Please check the headers against the template."
            );
        } finally {
            setProgress("");
            setLoadingState(false);
        }
    };

    const handleUpload = async () => {
        const plan = preview?.plan;
        if (!plan || plan.groups.length === 0) {
            return message.warning("Nothing to import. Please select a valid file.");
        }

        setLoadingState(true);
        try {
            /* 1. Locations, once each. This used to run per group, so five
                  locations spread over eighteen groups meant eighteen calls. */
            setProgress(`Checking ${plan.stats.locations.length} location(s)…`);
            for (const locationName of plan.stats.locations) {
                await verifyAndCreateLocation({
                    locationName,
                    companyId: user.sqlInfo.company_id,
                    queryClient,
                    user,
                });
            }

            /* 2. Pictures, once per distinct file. */
            let urlByMediaPath = new Map();
            if (preview.media.size > 0) {
                setProgress(`Uploading ${preview.media.size} image(s)…`);
                const uploaded = await uploadImportImages({
                    media: preview.media,
                    groups: plan.groups,
                    user,
                    onProgress: (done, total) =>
                        setProgress(`Uploading images ${done}/${total}…`),
                });
                urlByMediaPath = uploaded.urlByMediaPath;
                if (uploaded.failed.length > 0) {
                    message.warning(
                        `${uploaded.failed.length} image(s) could not be uploaded. Those units are imported without a picture.`
                    );
                }
            }

            /* 3. One request per batch. */
            const timestamp = formatDate(new Date());
            const requests = plan.groups.flatMap((group) =>
                group.batches.map((batch) => ({ group, batch }))
            );

            /* Counted in units, not in requests. How many requests it takes is
               an implementation detail; how many of their devices are in is
               not. */
            let unitsSent = 0;
            const outcomes = await runWithLimit(
                requests,
                CONCURRENT_REQUESTS,
                async ({ group, batch }) => {
                    const { body, perSerialFields } = buildGroupRequest({
                        group,
                        batch,
                        company: user.sqlInfo.company_name,
                        companyId: user.sqlInfo.company_id,
                        imageUrlByMediaPath: urlByMediaPath,
                        timestamp,
                    });

                    try {
                        const { data: response } =
                            await alphaNumericInsertItemMutation.mutateAsync({
                                template: body,
                                idempotencyKey: generateIdempotencyKey(),
                            });

                        dispatch(
                            onTrackBackgroundJob({
                                jobId: response.jobId,
                                type: "bulk-inventory-insert",
                                successMessage: `"${group.item_group}" — ${batch.length} unit(s) added to inventory.`,
                                failureMessage: `The import of "${group.item_group}" failed.`,
                                invalidateKeys: inventoryPageQueryKeys(
                                    user.sqlInfo.company_id
                                ),
                                clearCacheKeys: inventoryCacheKeys({
                                    companyMongoId: user.companyData.id,
                                }),
                            })
                        );
                        return { ok: true, units: batch.length };
                    } catch (error) {
                        console.error("bulk-item-alphanumeric", group.item_group, error);
                        /* A request carrying per-unit values that the server
                           does not read yet comes back complaining about the
                           scalar it did not find. Repeating that to the person
                           importing a spreadsheet explains nothing — they did
                           nothing wrong and there is nothing for them to fix in
                           the file. */
                        const serverMessage =
                            error?.response?.data?.msg ?? error.message ?? "Request failed";
                        return {
                            ok: false,
                            group: group.item_group,
                            units: batch.length,
                            reason:
                                perSerialFields.length > 0 &&
                                error?.response?.status === 400
                                    ? "This file needs a server update that isn't live yet."
                                    : serverMessage,
                        };
                    } finally {
                        unitsSent += batch.length;
                        setProgress(
                            `Importing ${unitsSent} of ${plan.stats.units} unit(s)…`
                        );
                    }
                }
            );

            const rejected = outcomes.filter((outcome) => !outcome.ok);
            const unitsRejected = rejected.reduce(
                (total, outcome) => total + outcome.units,
                0
            );
            const unitsAccepted = plan.stats.units - unitsRejected;

            if (rejected.length > 0) {
                message.error(
                    `${unitsRejected} unit(s) could not be imported. ${rejected[0].reason}`
                );
            }
            if (unitsAccepted > 0) {
                message.success(
                    `${unitsAccepted} unit(s) queued for import. You'll be notified as they are added.`
                );
                clearStateAndClose();
                if (typeof closeModal === "function") closeModal();
            }
        } catch (error) {
            console.error(error);
            message.error(
                `Upload failed: ${error.response?.data?.message || error.message}`
            );
        } finally {
            setProgress("");
            setLoadingState(false);
        }
    };

    const clearStateAndClose = () => {
        setFileName("");
        setPreview(null);
        setProgress("");
        const fileInput = document.getElementById("xlsx-importer");
        if (fileInput) {
            fileInput.value = "";
        }
        setOpenModal(false);
    };

    const active = preview?.plan?.stats;

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
                                    setPreview(null);
                                    const fileInput =
                                        document.getElementById("xlsx-importer");
                                    if (fileInput) fileInput.value = "";
                                }}
                                /* `width: fit-content` was dead here until the
                                   `style` -> `styles` rename in 586829c4 made
                                   it live, and it squashed the button: this is
                                   a flex row, where the button already sizes to
                                   its label, and a definite width let it shrink
                                   below that beside a wide file input. The
                                   Import trigger above keeps its own
                                   `fit-content` -- that one is not in a flex
                                   row, so without it the button stretches to
                                   the full width of the page. */
                                styles={{ flexShrink: 0 }}
                            />
                        )}
                    </div>

                    {/* What the file actually contains, before anything is sent.
                        A 500-row import used to start with one click and no
                        number in front of the person clicking it. */}
                    {preview && (
                        <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 10 }}>
                            <div>
                                <strong>{preview.units.length}</strong> unit(s) read from{" "}
                                <strong>{preview.rowCount}</strong> row(s).
                                {preview.media.size > 0 && (
                                    <>
                                        {" "}
                                        <strong>{preview.media.size}</strong> image(s) found
                                        inside cells, used by{" "}
                                        {preview.units.filter((u) => u.imageMediaPath).length}{" "}
                                        unit(s).
                                    </>
                                )}
                            </div>

                            {preview.skipped.length > 0 && (
                                <div style={{ color: "var(--danger-600, #b42318)" }}>
                                    <strong>{preview.skipped.length}</strong> row(s) skipped for
                                    missing mandatory columns — first is row{" "}
                                    {preview.skipped[0].rowNumber} (
                                    {preview.skipped[0].missing.join(", ")}).
                                </div>
                            )}

                            {preview.ignoredImageValues?.length > 0 && (
                                <div>
                                    <strong>{preview.ignoredImageValues.length}</strong> row(s)
                                    have text typed in the Image column — it is not used. Place
                                    the picture inside the cell instead (Insert &gt; Picture &gt;
                                    Place in Cell). First is row{" "}
                                    {preview.ignoredImageValues[0].rowNumber}.
                                </div>
                            )}

                            {active?.duplicateSerials.length > 0 && (
                                <div style={{ color: "var(--danger-600, #b42318)" }}>
                                    <strong>{active.duplicateSerials.length}</strong> serial
                                    number(s) appear more than once — e.g.{" "}
                                    {active.duplicateSerials[0].serial_number} on rows{" "}
                                    {active.duplicateSerials[0].rows.join(", ")}.
                                </div>
                            )}

                            {active?.conflicts.length > 0 && (
                                <div>
                                    &ldquo;{active.conflicts[0].item_group}&rdquo; has more than
                                    one {SHARED_FIELD_LABELS[active.conflicts[0].field] ??
                                        active.conflicts[0].field}{" "}
                                    in this file
                                    {active.conflicts.length > 1
                                        ? `, and so do ${active.conflicts.length - 1} other device(s)`
                                        : ""}
                                    . Every unit of a device shares one, so the most common is
                                    used.
                                </div>
                            )}

                            <div>
                                {active?.locations.length} location(s) will be checked and
                                created if missing: {active?.locations.join(", ")}.
                            </div>
                        </div>
                    )}

                    <div style={panelStyle}>
                        <strong>Note:</strong> <strong>{joinWithAnd(requiredHeaders)}</strong> are
                        mandatory — a row missing any of them is skipped, and the preview above
                        says which rows those are. We recommend filling in{" "}
                        <strong>{joinWithAnd(recommendedHeaders)}</strong> too: the row is
                        imported without them, but you will have to correct device by device.
                        For the Image column, place the picture <em>inside</em> the cell
                        (Insert &gt; Picture &gt; Place in Cell) — it travels with the file,
                        so nothing has to be hosted anywhere first. See the &ldquo;Inventory
                        Import Template Guide&ldquo; for aliases, accepted values and defaults.
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            marginTop: 10,
                        }}
                    >
                        <span style={{ ...Subtitle, color: "var(--gray-600, #5d615a)" }}>
                            {progress}
                        </span>
                        <div style={{ display: "flex", gap: 10 }}>
                            <GrayButtonComponent title="Cancel" func={clearStateAndClose} />
                            <BlueButtonComponent
                                title={
                                    active
                                        ? `Import ${active.units} unit(s)`
                                        : "Import Items"
                                }
                                func={handleUpload}
                                loadingState={loadingState}
                                disabled={!preview?.units.length || loadingState}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default DocumentInventoryXLSXUpload;
