import { message, Modal } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { read, utils } from "xlsx";
import { Subtitle } from "../../styles/global/Subtitle";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import GrayButtonComponent from "../UX/buttons/GrayButton";
import { devitrakApi } from "../../api/devitrakApi";
import { onTrackBackgroundJob } from "../../store/slices/backgroundJobsSlice";
import generateIdempotencyKey from "../../utils/actions/generateIdempotencyKey";
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
import { uploadImportImages } from "../../pages/inventory/utils/uploadImportImages";
import {
    MAX_IMPORT_UNITS,
    buildSpreadsheetImportRequest,
    describeImportRejection,
    summarizeImportUnits,
} from "../../pages/inventory/utils/spreadsheetImportRequest";

/** "A, B and C" — reads the required/recommended field notes from the same
 * two arrays the parser enforces, so the message can't drift from them again. */
const joinWithAnd = (items) => {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

const requiredHeaders = REQUIRED_IMPORT_FIELDS.map(headerFor);
const recommendedHeaders = RECOMMENDED_IMPORT_FIELDS.map(headerFor);

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
        const {
            units,
            skipped,
            ignoredImageValues,
            missingColumns,
            unrecognizedColumns,
        } = parseInventoryImportRows(rows, { imagesByRow: byRow });

        return {
            rowCount: rows.length,
            units,
            skipped,
            ignoredImageValues,
            missingColumns,
            unrecognizedColumns,
            media,
            /* The file goes in one request, so there is nothing to plan — only
               the two things worth saying before it is sent. */
            summary: summarizeImportUnits(units),
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
        if (!preview?.units.length) {
            return message.warning("Nothing to import. Please select a valid file.");
        }

        /* The endpoint answers "Company ID and Location Name are required" for a
           missing company exactly as it does for a missing location, so without
           this the same 400 has two very different causes and the screen has to
           guess which. */
        if (!user?.sqlInfo?.company_id) {
            return message.error(
                "Your session has no company on it. Sign out and back in, then try again."
            );
        }

        /* The server's own ceiling, enforced before the upload rather than
           after it. A 400 carries the real number in `limit`; this constant is
           only for refusing early. */
        if (preview.units.length > MAX_IMPORT_UNITS) {
            return message.error(
                `This file has ${preview.units.length} units and the limit is ${MAX_IMPORT_UNITS.toLocaleString()}. Split it and import the parts.`
            );
        }

        setLoadingState(true);
        try {
            /* 1. Pictures, once per distinct file. Ours either way — the server
                  does not download anything. */
            let urlByMediaPath = new Map();
            if (preview.media.size > 0) {
                setProgress(`Uploading ${preview.media.size} image(s)…`);
                const uploaded = await uploadImportImages({
                    media: preview.media,
                    units: preview.units,
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

            /* 2. The whole file, in one request.

                  Tried first, every time. It answers 404 until the server that
                  implements it is deployed, and on that 404 the old
                  one-request-per-group path below runs instead — so the day it
                  goes live nothing has to be released here. Everything after
                  this block is that older path, and deleting it is the first
                  thing to do once the endpoint is confirmed live. */
            const whole = buildSpreadsheetImportRequest({
                units: preview.units,
                company: user.sqlInfo.company_name,
                companyId: user.sqlInfo.company_id,
                imageUrlByMediaPath: urlByMediaPath,
            });

            try {
                setProgress(`Importing ${preview.units.length} unit(s)…`);
                const { data: response } = await devitrakApi.post(
                    "/db_item/bulk-item-from-spreadsheet",
                    whole.body,
                    { headers: { "Idempotency-Key": generateIdempotencyKey() } }
                );

                dispatch(
                    onTrackBackgroundJob({
                        jobId: response.jobId,
                        type: "spreadsheet-inventory-import",
                        successMessage: `${preview.units.length} unit(s) imported from ${fileName}.`,
                        failureMessage: `The import of ${fileName} failed.`,
                        invalidateKeys: inventoryPageQueryKeys(user.sqlInfo.company_id),
                        clearCacheKeys: inventoryCacheKeys({
                            companyMongoId: user.companyData.id,
                        }),
                    })
                );

                if (response.skipped > 0) {
                    message.warning(
                        `${response.skipped} row(s) repeat a serial number that is already in the file and were left out.`
                    );
                }
                message.success(
                    `${response.units} unit(s) queued for import. You'll be notified when it finishes.`
                );
                clearStateAndClose();
                if (typeof closeModal === "function") closeModal();
                return;
            } catch (error) {
                const status = error?.response?.status;

                if (status === 400) {
                    return message.error(
                        describeImportRejection(error.response.data, whole.rowByIndex)
                    );
                }
                /* 403 names the location or category that is outside the role's
                   scope, and a scoped role cannot create a location it does not
                   already have. Both are things the person can act on, so the
                   server's sentence is better than ours. */
                if (status === 403) {
                    return message.error(
                        error.response.data?.msg ?? "You cannot import into that location."
                    );
                }
                /* The reservation is SET NX, so the same key while the first
                   attempt is still in flight answers 409 rather than 202. */
                if (status === 409) {
                    return message.warning(
                        "This import is already running. Wait for it to finish before starting another."
                    );
                }
                /* Deployed 2026-09-22. A 404 now means the environment this
                   tab is pointed at has not been updated, not that the feature
                   is unfinished — and there is no longer a slower path to fall
                   back to, because it could never import a realistic file
                   inside the rate limit. */
                if (status === 404) {
                    return message.error(
                        "This server does not have the spreadsheet import yet. Check you are pointed at an updated environment."
                    );
                }
                throw error;
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

    const active = preview?.summary;

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

                            {preview.missingColumns?.length > 0 && (
                                <div style={{ color: "var(--danger-600, #b42318)" }}>
                                    This file has no{" "}
                                    <strong>{preview.missingColumns.join(", ")}</strong>{" "}
                                    column
                                    {preview.unrecognizedColumns?.length > 0 && (
                                        <>
                                            , but it does have{" "}
                                            <strong>
                                                {preview.unrecognizedColumns.join(", ")}
                                            </strong>
                                        </>
                                    )}
                                    . Column names cannot be changed — download the template
                                    and type into it.
                                </div>
                            )}

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

                            {/* Not "will be created": a role scoped to certain
                                locations cannot create one it does not already
                                have — creating it and then writing to it would
                                widen its own permission — and gets a 403 naming
                                the location instead. Promising the creation
                                would make that refusal look like a fault. */}
                            <div>
                                This file uses {active?.locations.length} location(s):{" "}
                                {active?.locations.join(", ")}. Any that do not exist yet are
                                created during the import, if your role can create them.
                            </div>
                        </div>
                    )}

                    <div style={panelStyle}>
                        <strong>Note:</strong> <strong>{joinWithAnd(requiredHeaders)}</strong> are
                        mandatory — a row missing any of them is skipped, and the preview above
                        says which rows those are. We recommend filling in{" "}
                        <strong>{joinWithAnd(recommendedHeaders)}</strong> too: the row is
                        imported without them, but you will have to correct device by device.
                        <strong> Do not change the column names</strong> — they are the only
                        spellings the import recognises. For the Image column, place the
                        picture <em>inside</em> the cell (Insert &gt; Picture &gt; Place in
                        Cell) — it travels with the file, so nothing has to be hosted
                        anywhere first. See the &ldquo;Inventory Import Template Guide&ldquo;
                        for what each column means.
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
