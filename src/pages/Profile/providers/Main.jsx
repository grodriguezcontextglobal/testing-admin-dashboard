import {
  Box,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import DocumentUpload from "./actions/UploadDocument";
import HistoryDocumentProvider from "./components/HistoryDocumentProvider";
import ProviderCard from "./components/ProviderCard";
import UpdateProvider from "./components/UpdateProvider";
import { emptyProviderForm, setProviderField } from "./utils/providerForm";
const Main = () => {
  const { user } = useSelector((state) => state.admin);
  const providersList = useQuery({
    queryKey: ["providersCompanyQuery", user?.companyData?.id],
    queryFn: () =>
      devitrakApi.get("/company/provider-companies", {
        params: {
          creator: user?.companyData?.id,
        },
      }),
    enabled: !!user?.companyData?.id,
    refetchOnMount: false,
    staleTime: 60 * 1000 * 5, // 5 minutes
  });
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [providers, setProviders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [openDocumentHistory, setOpenDocumentHistory] = useState(false);
  const [uploadDocumentModal, setUploadDocumentModal] = useState(false);
  const [newProvider, setNewProvider] = useState(emptyProviderForm());

  useEffect(() => {
    setProviders(providersList?.data?.data?.providerCompanies ?? []);
  }, [providersList.data, providersList.isRefetching]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProvider((prev) => setProviderField(prev, name, value));
  };

  /* Held by id rather than by value. It used to be the provider *object*: after
     filing a document the list refetched, but this still pointed at the copy
     taken before the upload, so the new document did not appear until the modal
     was closed and reopened. */
  const idOf = (provider) => provider?.id ?? provider?._id ?? null;
  const selectedProvider =
    providers.find((provider) => idOf(provider) === selectedProviderId) ?? null;

  const handleViewDocuments = (provider) => {
    setSelectedProviderId(idOf(provider));
    setUploadDocumentModal(false);
    setOpenDocumentHistory(true);
  };

  const handleUploadDocument = (provider) => {
    setSelectedProviderId(idOf(provider));
    setOpenDocumentHistory(false);
    setUploadDocumentModal(true);
  };

  const handleEditClick = (provider) => {
    setSelectedProviderId(idOf(provider));
    setNewProvider(provider);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  /* Was a second, hand-written literal that blanked `industry` and `services`
     — the two fields the endpoint requires — and dropped `contactInfo.name`
     altogether, so the form was left in a shape the next save would be rejected
     for. */
  const clearUpForm = () => setNewProvider(emptyProviderForm());
  const handleSubmit = async () => {
    const isValidAddress =
      newProvider.address.street &&
      newProvider.address.city &&
      newProvider.address.state &&
      newProvider.address.postalCode;

    const isValidContactInfo =
      newProvider.contactInfo.email && newProvider.contactInfo.phone;

    const cleanedServices = newProvider.services
      .map((service) => service.trim())
      .filter((service) => service.length > 0);

    if (
      newProvider.companyName &&
      newProvider.industry &&
      cleanedServices.length > 0 &&
      isValidAddress &&
      isValidContactInfo
    ) {
      try {
        const providerData = {
          ...newProvider,
          services: cleanedServices,
          creator: user?.companyData?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (dialogMode === "add") {
          const newResp = await devitrakApi.post(
            "/company/new_provider",
            providerData
          );
          if (newResp?.data?.ok) {
            queryClient.invalidateQueries([
              "providersCompanyQuery",
              user?.companyData?.id,
            ]);
            providersList.refetch();
            clearUpForm();
            setOpenDialog(false);
            message.success("Provider added successfully");
          } else {
            message.error(newResp?.data?.msg || "Failed to add provider");
          }
        } else {
          const updateResponse = await devitrakApi.patch(
            `/company/update_provider/${providerData.id}`,
            providerData
          );
          if (updateResponse?.data?.ok) {
            queryClient.invalidateQueries([
              "providersCompanyQuery",
              user?.companyData?.id,
            ]);
            clearUpForm();
            providersList.refetch();
            setOpenDialog(false);
            message.success("Provider updated successfully");
          } else {
            message.error(
              updateResponse?.data?.msg || "Failed to update provider"
            );
          }
        }
      } catch (error) {
        message.error("Error saving provider");
      }
    } else {
      message.error("Please complete all required provider fields.");
    }
  };

  // Add loading and error states
  if (providersList.isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading providers...</Typography>
      </Box>
    );
  }

  if (providersList.isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading providers:{" "}
          {providersList.error?.message || "Unknown error"}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={isMobile ? 2 : 3}>
      <Grid
        item
        xs={12}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography sx={{ ...TextFontsize18LineHeight28 }}>
          Company Suppliers
        </Typography>
        <BlueButtonComponent
        title={"Add Provider"}
        func={() => {
          setDialogMode("add");
          setOpenDialog(true);
        }}
        />
      </Grid>

      {(!providers || providers.length === 0) && (
        <Grid item xs={12}>
          <EmptyState
            icon="tabler:building-store"
            title="No suppliers yet"
            description="Add your first supplier company to keep contact details and shared documents in one place."
            action={
              <BlueButtonComponent
                title="Add Provider"
                func={() => {
                  setDialogMode("add");
                  setOpenDialog(true);
                }}
              />
            }
          />
        </Grid>
      )}

      {providers?.map((provider) => (
        <Grid item xs={12} md={6} key={provider.id || provider._id}>
          <ProviderCard
            provider={provider}
            handleEditClick={handleEditClick}
            handleViewDocuments={handleViewDocuments}
            handleUploadDocument={handleUploadDocument}
          />
        </Grid>
      ))}

      {openDialog && (
        <UpdateProvider
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          newProvider={newProvider}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          dialogMode={dialogMode}
          setNewProvider={setNewProvider}
        />
      )}

      {openDocumentHistory && (
        <HistoryDocumentProvider
          openDocumentHistory={openDocumentHistory}
          setOpenDocumentHistory={setOpenDocumentHistory}
          selectedProvider={selectedProvider}
          onUploadDocument={handleUploadDocument}
        />
      )}

      {uploadDocumentModal && (
        <DocumentUpload
          openDialog={uploadDocumentModal}
          setOpenDialog={setUploadDocumentModal}
          providerId={selectedProviderId}
          providerName={selectedProvider?.companyName}
          refetch={() => providersList.refetch()}
          onUploaded={() => {
            setUploadDocumentModal(false);
            setOpenDocumentHistory(true);
          }}
        />
      )}
    </Grid>
  );
};

export default Main;
