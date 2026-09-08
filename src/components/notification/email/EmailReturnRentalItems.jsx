import { devitrakApi } from "../../../api/devitrakApi";
import { message } from "antd";
import generateOptimizedXLSXFile from "../../../pages/inventory/details/OwnershipDetail/components/suppliers/actions/generateOptimizedXLSXFile";
import { checkRequestSize } from "../../utils/checkRequestSize";

/**
 * The report that goes out when rented equipment goes back to its supplier.
 *
 * This is the record of the return. The items are deleted straight afterwards,
 * so anything not in here does not survive — which is why the attachment now
 * carries the supplier, who returned them and when, instead of only three
 * columns and a date computed at report time.
 *
 * `resolvedItems` lets a caller that has already read the rows hand them over
 * rather than have them read twice; `items` alone still works.
 */
const EmailReturnRentalItems = async ({
  items,
  setProgress,
  supplier_id,
  user,
  resolvedItems = null,
  returnedAt = null,
}) => {
  try {
    setProgress({
      current: 0,
      total: 1,
      step: "Preparing email notification",
    });
    const supplierInfo = await devitrakApi.post(
      `/company/provider-company/${supplier_id}`,
      {
        creator: user?.companyData?.id,
        provider_id: supplier_id,
      }
    );
    const props = Array.from(items);

    // `ownership = 'Rent'` and the company scope are baked into the catalog
    // entry, so neither is sent. supplierId is optional — undefined drops the
    // supplier_info clause, which is what the old else-branch did.
    let itemsDataResult = resolvedItems;
    if (!Array.isArray(itemsDataResult)) {
      const itemsData = await devitrakApi.post(
        "/db_company/inventory-query",
        {
          queryName: "inventory.itemsByIds",
          params: { itemIds: props, supplierId: supplier_id || undefined },
        }
      );
      itemsDataResult = itemsData.data.result;
    }
    if (itemsDataResult.length === 0) {
      return message.warning("No items found to return");
    }

    const supplierName =
      supplierInfo.data.providerCompanies?.companyName ??
      supplierInfo.data.providerCompanies?.[0]?.companyName ??
      "";

    const xlsxAttachment = generateOptimizedXLSXFile({
      itemsDataResult,
      supplierName,
      returnedBy: user?.name,
      returnedAt: returnedAt ?? new Date().toISOString(),
    });

    // If file is too large, send summary email instead
    if (xlsxAttachment.size > 20) {
      const summaryPayload = {
        subject: "Returned items to renter - Summary",
        staffEmails: [
          ...user.companyData.employees
            .filter((element) => Number(element.role) < 2)
            .map((ele) => ele.user),
        ],
        supplierInfo: supplierInfo.data.providerCompanies,
        itemCount: props.length,
        returnDate: new Date().toISOString().split("T")[0],
        message: `Due to the large number of items (${props.length}), detailed information has been omitted. Please check the system for complete details.`,
      };

      /* `returned-items-summary-notification` does not exist -- the backend
         confirmed it in FRONTEND_api_payload_findings.md B3 -- so a return
         whose spreadsheet passed 20 MB reported nothing at all. The real route
         takes `attachments` as optional, so the same notification goes out
         without the file until that endpoint is built. */
      const response = await devitrakApi.post(
        "/nodemailer/returned-items-to-renter-notification",
        summaryPayload
      );
      if (response.data) {
        return message.success(
          "Items returned. Summary notification queued (file too large for attachment)."
        );
      }
    } else {
      // Send with attachment if file size is acceptable
      const emailPayload = {
        subject: "Returned items to renter",
        staffEmails: [
          ...user.companyData.employees
            .filter((element) => Number(element.role) < 2)
            .map((ele) => ele.user),
        ],
        supplierInfo: supplierInfo.data.providerCompanies,
        attachments: [
          {
            filename: xlsxAttachment.filename,
            content: xlsxAttachment.content,
            contentType: xlsxAttachment.contentType,
            encoding: "base64",
          },
        ],
      };

      // Check email payload size
      const emailSizeCheck = checkRequestSize(emailPayload);
      if (emailSizeCheck.isLarge) {
        console.warn(
          `Large email payload: ${emailSizeCheck.size.toFixed(2)} MB`
        );
      }

      const response = await devitrakApi.post(
        "/nodemailer/returned-items-to-renter-notification",
        emailPayload
      );

      if (response.data) {
        return message.success(
          "Items returned. Notification with XLSX attachment queued."
        );
      }
    }
  } catch (error) {
    console.error("Error in email notification:", error);
    if (error.response?.status === 413) {
      message.error(
        "Email attachment too large. Summary notification queued instead."
      );
      // Fallback to summary email without attachment
      try {
        await devitrakApi.post(
          // Same missing route as above.
          "/nodemailer/returned-items-to-renter-notification",
          {
            subject:
              "Returned items to renter - Summary (Attachment too large)",
            staffEmails: [
              ...user.companyData.employees
                .filter((element) => Number(element.role) < 2)
                .map((ele) => ele.user),
            ],
            itemCount: Array.from(items).length,
            returnDate: new Date().toISOString().split("T")[0],
          }
        );
        message.success("Summary notification queued successfully.");
      } catch (summaryError) {
        console.error("Failed to send summary notification:", summaryError);
        message.error("Failed to send any notification.");
      }
    } else {
      message.error("Failed to send email notification.");
    }
  }
};

export default EmailReturnRentalItems;
