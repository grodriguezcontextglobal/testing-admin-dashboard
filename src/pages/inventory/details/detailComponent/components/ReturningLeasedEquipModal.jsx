import { Box, Grid, InputLabel, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { message, Modal, Progress } from "antd";
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import EmailReturnRentalItems from "../../../../../components/notification/email/EmailReturnRentalItems";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import "../../../../../styles/global/reactInput.css";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import "../../../../events/newEventProcess/style/NewEventInfoSetup.css";

const ReturningLeasedEquipModal = ({
  dataFound,
  openReturningModal,
  setOpenReturningModal,
  // setDataPropsCopy,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, step: "" });
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
  useEffect(() => {
    if (dataFound.supplier_info.length > 0 || dataFound.supplier_info !== "") {
      const checkingSupplier = async () => {
        const supplier = await devitrakApi.get("/company/provider-companies", {
          params: {
            creator: user?.companyData?.id,
          },
        });
        setSupplierInfo(
          supplier?.data?.providerCompanies.filter(
            (ele) => ele.id === dataFound.supplier_info
          )
        );
      };
      checkingSupplier();
    }
  }, []);

  const handleReturnRentalItem = async () => {
    setLoadingStatus(true);
    try {
      message.loading({
        content: `Processing item...`,
        key: "processing",
      });

      // Step 1: Return items to renter
      const returnDate = new Date().toISOString();
      const payload = {
        item_ids: [dataFound.item_id],
        warehouse: 1,
        enableAssignFeature: 0,
        returnedRentedInfo: JSON.stringify([]),
        return_date: returnDate,
      };
      await devitrakApi.post("/db_inventory/update-large-data", payload);

      message.loading({
        content: "Items returned to renter, now deleting records...",
        key: "processing",
      });

      // Step 2: Email notification to staff
      await EmailReturnRentalItems({
        items: [dataFound.item_id],
        supplier_id: dataFound.supplier_info,
        user: user,
        setProgress,
      });

      // Step 3: Delete items from records
      const deleteQuery = `DELETE FROM item_inv WHERE item_id = ? AND company_id = ?`;
      const deleteValues = [dataFound.item_id, dataFound.company_id];
      const payloadDelete = {
        query: deleteQuery,
        values: deleteValues,
      };
      await devitrakApi.post(
        "/db_company/inventory-based-on-submitted-parameters",
        payloadDelete
      );

      // Step 4: Clear cache memory
      await clearCacheMemory(`providerCompanies_${user.companyData.id}`);
      message.success({
        content: `Successfully returned item to the Rental Company`,
        key: "processing",
      });
      invalidatingQueriesForRefresh();
      return navigate("/inventory");
    } catch (error) {
      message.error({ content: "Failed to process items", key: "processing" });
      console.error("Error processing items:", error);
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
          width: "100%",
          marginBottom: "24px",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid var(--blue-200, #B2DDFF)",
          background: "var(--blue-50, #EFF8FF)",
        }}
      >
        <Typography
          style={{
            ...Subtitle,
            fontWeight: 600,
            marginBottom: "12px",
            color: "var(--blue-700, #175CD3)",
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
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--gray-600, #475467)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Company Name
              </Typography>
              <Typography
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--gray-900, #101828)",
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
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--gray-600, #475467)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Email
              </Typography>
              <Typography
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "var(--gray-700, #344054)",
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
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--gray-600, #475467)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Phone
              </Typography>
              <Typography
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "var(--gray-700, #344054)",
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
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--gray-600, #475467)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Address
              </Typography>
              <Typography
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "var(--gray-700, #344054)",
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
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            display: "flex",
            padding: "24px",
            flexDirection: "column",
            gap: "24px",
            alignSelf: "stretch",
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--gray-100, #F2F4F7)",
          }}
          className="form"
          onSubmit={handleSubmit(handleReturnRentalItem)}
        >
          {/* Supplier Information Section */}
          {supplierInfo ? renderSupplierInfo() : "Supplier information not found"}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
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
        <Box sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
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
