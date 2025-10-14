import { devitrakApi } from "../../../api/devitrakApi";
import { message } from "antd";
import generateOptimizedXLSXFile from "../../../pages/inventory/details/OwnershipDetail/components/suppliers/actions/generateOptimizedXLSXFile";
import { checkRequestSize } from "../../utils/checkRequestSize";

const EmailReturnRentalItems = async ({ items, setProgress, supplier_id, user }) => {
  try {
    setProgress({
      current: 0,
      total: 1,
      step: "Preparing email notification",
    });
    let query;
    let values;
    const supplierInfo = await devitrakApi.post(
      `/company/provider-company/${supplier_id}`,
      {
        creator: user?.companyData?.id,
        provider_id: supplier_id,
      }
    );
    const props = Array.from(items);

    // Create proper SQL placeholders for the IN clause
    const placeholders = props.map(() => "?").join(",");

    if (supplier_id) {
      query = `SELECT item_id, serial_number, item_group FROM item_inv WHERE item_id IN (${placeholders}) AND ownership = ? AND company_id = ? AND supplier_info = ?`;
      values = [...props, "Rent", user.sqlInfo.company_id, supplier_id];
    } else {
      query = `SELECT item_id, serial_number, item_group FROM item_inv WHERE item_id IN (${placeholders}) AND ownership = ? AND company_id = ?`;
      values = [...props, "Rent", user.sqlInfo.company_id];
    }

    const itemsData = await devitrakApi.post(
      "/db_company/inventory-based-on-submitted-parameters",
      {
        query: query,
        values: values,
      }
    );
    if (itemsData.data.result.length === 0) {
      return message.warning("No items found to return");
    }
    const itemsDataResult = itemsData.data.result;
    // Generate XLSX file with size optimization

    const xlsxAttachment = generateOptimizedXLSXFile({ itemsDataResult });

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

      const response = await devitrakApi.post(
        "/nodemailer/returned-items-summary-notification",
        summaryPayload
      );
      if (response.data) {
        return message.success(
          "Items returned and summary notification sent (file too large for attachment)."
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
          "Items returned and notification sent with XLSX attachment."
        );
      }
    }
  } catch (error) {
    console.error("Error in email notification:", error);
    if (error.response?.status === 413) {
      message.error(
        "Email attachment too large. Summary notification sent instead."
      );
      // Fallback to summary email without attachment
      try {
        await devitrakApi.post(
          "/nodemailer/returned-items-summary-notification",
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
        message.success("Summary notification sent successfully.");
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
