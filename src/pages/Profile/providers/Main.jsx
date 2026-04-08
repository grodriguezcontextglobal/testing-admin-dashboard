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
import DocumentUpload from "./actions/UploadDocument";
import HistoryDocumentProvider from "./components/HistoryDocumentProvider";
import ProviderCard from "./components/ProviderCard";
import UpdateProvider from "./components/UpdateProvider";
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
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [openDocumentHistory, setOpenDocumentHistory] = useState(false);
  const [uploadDocumentModal, setUploadDocumentModal] = useState(false);
  const [documentSortOrder, setDocumentSortOrder] = useState("desc");
  const [newProvider, setNewProvider] = useState({
      companyName: "",
      industry: "not needed",
      services: ["not needed"],
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "USA",
      },
      contactInfo: {
        name:"",
        email: "",
        phone: "",
        website: "",
      },
      status: "active",
      documents: [],
  });

  useEffect(() => {
    setProviders(providersList?.data?.data?.providerCompanies);
  }, [providersList.data, providersList.isRefetching]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setNewProvider((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else if (name === "services") {
      setNewProvider((prev) => ({
        ...prev,
        services: value.split(",").map((service) => service.trim()),
      }));
    } else {
      setNewProvider((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleViewDocuments = (provider) => {
    setSelectedProvider(provider);
    setOpenDocumentHistory(true);
  };

  const handleEditClick = (provider) => {
    setSelectedProvider(provider);
    setNewProvider(provider);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const sortDocuments = (documents) => {
    return [...documents].sort((a, b) => {
      const dateA = new Date(a.uploadDate);
      const dateB = new Date(b.uploadDate);
      return documentSortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  };

  const clearUpForm = () => {
    return setNewProvider({
      companyName: "",
      industry: "",
      services: [],
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "USA",
      },
      contactInfo: {
        email: "",
        phone: "",
        website: "",
      },
      status: "active",
      documents: [],
    });
  };
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
          creator: user.companyData.id, // Replace with actual company ID from your auth context
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (dialogMode === "add") {
          const newResp = await devitrakApi.post(
            "/company/new_provider",
            providerData
          );
          if (newResp.data.ok) {
            queryClient.invalidateQueries([
              "providersCompanyQuery",
              user?.companyData?.id,
            ]);
            providersList.refetch();
            clearUpForm();
            setOpenDialog(false);
          }
        } else {
          const updateResponse = await devitrakApi.patch(
            `/company/update_provider/${providerData.id}`,
            providerData
          );
          if (updateResponse.data.ok) {
            queryClient.invalidateQueries([
              "providersCompanyQuery",
              user?.companyData?.id,
            ]);
            clearUpForm();
            providersList.refetch();
            setOpenDialog(false);
          }
        }
      } catch (error) {
        console.error("Error saving provider:", error);
        message.error("Error saving provider");
      }
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

  if (providersList.isLoading) {
    // console.log(providersList.error.message);
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading providers: {providersList.error.message}
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
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            fontSize: isMobile ? "1.25rem" : "1.5rem",
          }}
        >
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

      {providers?.map((provider) => (
        <Grid item xs={12} md={6} key={provider.id}>
          <ProviderCard
            provider={provider}
            handleEditClick={handleEditClick}
            handleViewDocuments={handleViewDocuments}
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
          setDocumentSortOrder={setDocumentSortOrder}
          sortDocuments={sortDocuments}
          documentSortOrder={documentSortOrder}
        />
      )}

      {uploadDocumentModal && (
        <DocumentUpload
          openDialog={uploadDocumentModal}
          setOpenDialog={setUploadDocumentModal}
          providerId={selectedProvider?.id}
        />
      )}
    </Grid>
  );
};

export default Main;
