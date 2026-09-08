import { Box, Grid, InputLabel, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { message, Modal, Progress } from "antd";
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { registerStaffActivity } from "../../../../../api/activityLog";
import { devitrakApi } from "../../../../../api/devitrakApi";
import EmailReturnRentalItems from "../../../../../components/notification/email/EmailReturnRentalItems";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import "../../../../../styles/global/reactInput.css";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import {
  buildReturnAuditEntries,
  describeBlocked,
  partitionForReturn,
} from "../../OwnershipDetail/components/suppliers/utils/returnToSupplier";
import "../../../../events/newEventProcess/style/NewEventInfoSetup.css";

const ReturningLeasedEquipModal = ({
  dataFound,
  openReturningModal,
  setOpenReturningModal,
  // setDataPropsCopy,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [progress, setProgress] = useState({ current: 0, step: "", total: 0 });
  const [supplierInfo, setSupplierInfo] = useState(null);
  const { handleSubmit } = useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const closeModal = () => {
    return setOpenReturningModal(false);
  };
  const invalidatingQueriesForRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["currentStateDevicePerGroupName"],
    });
    queryClient.invalidateQueries({ queryKey: ["deviceInInventoryPerGroup"] });
    queryClient.invalidateQueries({
      queryKey: ["currentStateDevicePerCategory"],
    });
    queryClient.invalidateQueries({ queryKey: ["deviceInInventoryPerGroup"] });
    queryClient.invalidateQueries({
      queryKey: ["currentStateDevicePerCategory"],
    });
    queryClient.invalidateQueries({ queryKey: ["deviceInInventoryPerBrand"] });
    queryClient.invalidateQueries({ queryKey: ["currentStateDevicePerBrand"] });
    queryClient.invalidateQueries({ queryKey: ["deviceInInventoryPerGroup"] });
    return null;
  };
  /* Deps declared rather than left empty — a pre-existing lint failure in this
     file, which `max-warnings=0` was already tripping over. `supplier_info` is
     read defensively too: the condition called `.length` on it unguarded. */
  const supplierId = dataFound?.supplier_info;
  const companyId = user?.companyData?.id;
  useEffect(() => {
    if (!String(supplierId ?? "").trim()) return;
    const checkingSupplier = async () => {
      const supplier = await devitrakApi.get("/company/provider-companies", {
        params: { creator: companyId },
      });
      setSupplierInfo(
        (supplier?.data?.providerCompanies ?? []).filter(
          (ele) => ele.id === supplierId
        )
      );
    };
    checkingSupplier();
  }, [supplierId, companyId]);

  const handleReturnRentalItem = async () => {
    setLoadingStatus(true);
    try {
      message.loading({
        content: `Processing item...`,
        key: "processing",
      });

      /* The row the report and the audit log are built from. An id the server
         does not answer for is held back: there is nothing to report about it,
         and its absence is not a reason to delete it.

         This replaces the old first step, which wrote `warehouse`,
         `enableAssignFeature`, `returnedRentedInfo` and `return_date` onto a
         row that step 3 deletes. Nothing read any of it, and
         `update-large-data` was rejecting the call outright for carrying
         `returnedRentedInfo`. */
      const returnDate = new Date().toISOString();
      const stateResponse = await devitrakApi.post("/db_company/inventory-query", {
        queryName: "inventory.itemsByIds",
        params: {
          itemIds: [dataFound.item_id],
          supplierId: dataFound.supplier_info || undefined,
        },
      });
      const { returnable, blocked } = partitionForReturn({
        items: stateResponse.data?.result ?? [],
        requestedIds: [dataFound.item_id],
      });
      if (returnable.length === 0) {
        message.warning({
          content:
            describeBlocked(blocked) ??
            "This item could not be found in the inventory.",
          key: "processing",
        });
        return;
      }

      /* The report goes out before the delete, because it is the record: once
         the row is gone, nothing that is not in it survives. */
      await EmailReturnRentalItems({
        items: [dataFound.item_id],
        resolvedItems: returnable,
        returnedAt: returnDate,
        setProgress,
        supplier_id: dataFound.supplier_info,
        user: user,
      });

      /* The item record itself is about to be deleted, so this is the only
         place the return stays accounted for. Fire-and-forget by design. */
      await Promise.allSettled(
        buildReturnAuditEntries({
          items: returnable,
          supplierId: dataFound.supplier_info || null,
          returnedBy: user?.name,
          timestamp: returnDate,
        }).map((entry) => registerStaffActivity(entry))
      );

      // Step 3: Delete items from records.
      // `POST /api/db_item/:id` reads company_id and item_id from the BODY and
      // ignores the id in the path — it answers 400/403 without them, and this
      // call was sending no body at all.
      await devitrakApi.post(`/db_item/${dataFound.item_id}`, {
        company_id: user.sqlInfo.company_id,
        item_id: dataFound.item_id,
      });

      // Step 4: Clear cache memory
      await clearCacheMemory(`providerCompanies_${user.companyData.id}`);
      message.success({
        content: `Successfully returned item to the Rental Company`,
        key: "processing",
      });
      invalidatingQueriesForRefresh();
      return navigate("/inventory");
    } catch (error) {
      // "Failed to process items" was the same sentence for every cause, with
      // the server's reason left in the console.
      message.error({
        content:
          error?.response?.data?.msg ||
          error?.message ||
          "Failed to process items",
        key: "processing",
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const renderTitle = () => {
    return (
      <>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            style={TextFontSize30LineHeight38}
            color={"var(--gray-600, #475467)"}
          >
            Return leased equipment
          </Typography>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            textTransform={"none"}
            style={TextFontSize20LineHeight30}
            color={"var(--gray-600, #475467)"}
          >
            You can enter all the details related to returning the leased
            equipment.
          </Typography>
        </InputLabel>
      </>
    );
  };

  // Render supplier information component
  const renderSupplierInfo = () => {
    if (!supplierInfo || supplierInfo.length === 0) {
      return null;
    }

    const supplier = supplierInfo[0];

    return (
      <div
        style={{
          background: "var(--blue-50, #EFF8FF)",
          border: "1px solid var(--blue-200, #B2DDFF)",
          borderRadius: "8px",
          marginBottom: "24px",
          padding: "16px",
          width: "100%",
        }}
      >
        <Typography
          style={{
            ...Subtitle,
            color: "var(--blue-700, #175CD3)",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          Returning to Provider
        </Typography>

        <Grid container spacing={2}>
          {/* Company Name */}
          <Grid item xs={12} sm={6}>
            <div style={{ marginBottom: "8px" }}>
              <Typography
                style={{
                  color: "var(--gray-600, #475467)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Company Name
              </Typography>
              <Typography
                style={{
                  color: "var(--gray-900, #101828)",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginTop: "2px",
                }}
              >
                {supplier.companyName}
              </Typography>
            </div>
          </Grid>

          {/* Contact Email */}
          <Grid item xs={12} sm={6}>
            <div style={{ marginBottom: "8px" }}>
              <Typography
                style={{
                  color: "var(--gray-600, #475467)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Email
              </Typography>
              <Typography
                style={{
                  color: "var(--gray-700, #344054)",
                  fontSize: "14px",
                  fontWeight: 400,
                  marginTop: "2px",
                }}
              >
                {supplier.contactInfo.email}
              </Typography>
            </div>
          </Grid>

          {/* Contact Phone */}
          <Grid item xs={12} sm={6}>
            <div style={{ marginBottom: "8px" }}>
              <Typography
                style={{
                  color: "var(--gray-600, #475467)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Phone
              </Typography>
              <Typography
                style={{
                  color: "var(--gray-700, #344054)",
                  fontSize: "14px",
                  fontWeight: 400,
                  marginTop: "2px",
                }}
              >
                {supplier.contactInfo.phone}
              </Typography>
            </div>
          </Grid>

          {/* Address */}
          <Grid item xs={12} sm={6}>
            <div style={{ marginBottom: "8px" }}>
              <Typography
                style={{
                  color: "var(--gray-600, #475467)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Address
              </Typography>
              <Typography
                style={{
                  color: "var(--gray-700, #344054)",
                  fontSize: "14px",
                  fontWeight: 400,
                  marginTop: "2px",
                }}
              >
                {`${supplier.address.street}, ${supplier.address.city}, ${supplier.address.state} ${supplier.address.postalCode}, ${supplier.address.country}`}
              </Typography>
            </div>
          </Grid>
        </Grid>
      </div>
    );
  };

  return (
    <Modal
      key={dataFound.item_id}
      open={openReturningModal}
      onCancel={() => closeModal()}
      style={{ top: "20dv", zIndex: 30 }}
      width={1000}
      centered
      footer={[]}
    >
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        container
      >
        {renderTitle()}
        <form
          key={dataFound.item_id}
          id="handleReturningLeasedEquip"
          style={{
            alignItems: "center",
            alignSelf: "stretch",
            background: "var(--gray-100, #F2F4F7)",
            border: "1px solid var(--gray-300, #D0D5DD)",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            justifyContent: "flex-start",
            padding: "24px",
            textAlign: "left",
            width: "100%",
          }}
          className="form"
          onSubmit={handleSubmit(handleReturnRentalItem)}
        >
          {/* Supplier Information Section */}
          {supplierInfo ? renderSupplierInfo() : "Supplier information not found"}
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: "10px",
              justifyContent: "flex-start",
              textAlign: "left",
              width: "100%",
            }}
          >
            <GrayButtonComponent
              title={"Go back"}
              func={() => closeModal()}
              styles={{ width: "100%" }}
            />
            <BlueButtonComponent
              title={"Return item"}
              func={() => null}
              loadingState={loadingStatus}
              confirmationTitle={
                "Are you sure you want to return the item? This action can not be reversed."
              }
              buttonType={"submit"}
              styles={{ width: "100%" }}
            />
          </div>
        </form>
      </Grid>

      {/* Add this in the Modal content, before the Tabs component: */}
      {progress.total > 0 && (
        <Box sx={{ bgcolor: "background.paper", borderRadius: 1, mb: 2, p: 2 }}>
          <Typography variant="body2" gutterBottom>
            {progress.step}
          </Typography>
          <Progress
            percent={Math.round((progress.current / progress.total) * 100)}
            status="active"
            showInfo
            format={(percent) =>
              `${progress.current}/${progress.total} (${percent}%)`
            }
          />
        </Box>
      )}
    </Modal>
  );
};

export default ReturningLeasedEquipModal;
