import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Button, message } from "antd";
import { useEffect, useState } from "react";
import { EditIcon } from "../../../components/icons/EditIcon";
// import { UploadIcon } from "../../../components/icons/UploadIcon";
import ViewIcon from "../../../components/icons/ViewIcon";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import UpdateProvider from "./components/UpdateProvider";
import HistoryDocumentProvider from "./components/HistoryDocumentProvider";
import { useSelector } from "react-redux";
import DocumentUpload from "./actions/UploadDocument";
import { devitrakApi } from "../../../api/devitrakApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Mock data structure updated with documents
// const mockProviders = [
//   {
//     id: 1,
//     companyName: "MC Equipment LLC",
//     industry: "Rental Equipment",
//     services: ["Audio Equipment"],
//     address: {
//       street: "9874 NE Asas Ave",
//       city: "Portland",
//       state: "OR",
//       postalCode: "55652",
//       country: "USA",
//     },
//     documents: [],
//     creator: "507f1f77bcf86cd799439011", // Mock ObjectId
//     contactInfo: {
//       email: "contact@mcequipment.com",
//       phone: "503-555-0123",
//       website: "www.mcequipment.com",
//     },
//     status: "active",
//     createdAt: new Date("2024-01-15").toISOString(),
//     updatedAt: new Date("2024-01-15").toISOString(),
//   },
//   {
//     id: 2,
//     companyName: "Sound Masters Pro",
//     industry: "Audio/Visual",
//     services: ["Professional Sound Systems", "Lighting Equipment"],
//     address: {
//       street: "1234 SW Tech Blvd",
//       city: "Portland",
//       state: "OR",
//       postalCode: "97201",
//       country: "USA",
//     },
//     documents: [],
//     creator: "507f1f77bcf86cd799439012", // Mock ObjectId
//     contactInfo: {
//       email: "info@soundmasterspro.com",
//       phone: "503-555-0124",
//       website: "www.soundmasterspro.com",
//     },
//     status: "active",
//     createdAt: new Date("2024-01-16").toISOString(),
//     updatedAt: new Date("2024-01-16").toISOString(),
//   },
//   {
//     id: 3,
//     companyName: "Stage Solutions Inc",
//     industry: "Event Production",
//     services: ["Stage Equipment", "Rigging Systems"],
//     address: {
//       street: "5678 SE Event Way",
//       city: "Portland",
//       state: "OR",
//       postalCode: "97215",
//       country: "USA",
//     },
//     documents: [],
//     creator: "507f1f77bcf86cd799439013", // Mock ObjectId
//     contactInfo: {
//       email: "contact@stagesolutions.com",
//       phone: "503-555-0125",
//       website: "www.stagesolutions.com",
//     },
//     status: "active",
//     createdAt: new Date("2024-01-17").toISOString(),
//     updatedAt: new Date("2024-01-17").toISOString(),
//   },
//   {
//     id: 4,
//     companyName: "Visual Tech Partners",
//     industry: "Audio/Visual",
//     services: ["Display Systems", "Video Equipment"],
//     address: {
//       street: "4321 NW Display Drive",
//       city: "Portland",
//       state: "OR",
//       postalCode: "97229",
//       country: "USA",
//     },
//     documents: [],
//     creator: "507f1f77bcf86cd799439014", // Mock ObjectId
//     contactInfo: {
//       email: "info@visualtechpartners.com",
//       phone: "503-555-0126",
//       website: "www.visualtechpartners.com",
//     },
//     status: "active",
//     createdAt: new Date("2024-01-18").toISOString(),
//     updatedAt: new Date("2024-01-18").toISOString(),
//   },
// ];
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

    if (
      newProvider.companyName &&
      newProvider.industry &&
      newProvider.services.length > 0 &&
      isValidAddress &&
      isValidContactInfo
    ) {
      try {
        const providerData = {
          ...newProvider,
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

  // Function to format address for display
  const formatAddress = (address) => {
    if (typeof address === "string") return address; // Handle old format
    const { street, city, state, postalCode } = address;
    return `${street}, ${city}, ${state} ${postalCode}`;
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
    console.log(providersList.error.message);
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
        <Button
          style={BlueButton}
          onClick={() => {
            setDialogMode("add");
            setOpenDialog(true);
          }}
        >
          <p style={BlueButtonText}>Add Provider</p>
        </Button>
      </Grid>

      {providers?.map((provider) => (
        <Grid item xs={12} md={6} key={provider.id}>
          <Card
            sx={{
              height: "100%",
              boxShadow:
                "0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)",
              borderRadius: "8px",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: isMobile ? "1rem" : "1.25rem",
                  }}
                >
                  {provider.companyName}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(provider)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDocuments(provider)}
                    sx={{ mr: 1 }}
                  >
                    <ViewIcon />
                  </IconButton>
                  {/* <IconButton
                    size="small"
                    onClick={() => setUploadDocumentModal(true)} //handleDocumentUpload(provider.id)
                  >
                    <UploadIcon />
                  </IconButton> */}
                </Box>
              </Box>

              <Typography
                sx={{
                  color: "text.secondary",
                  mb: 1,
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
              >
                {formatAddress(provider.address)}
              </Typography>

              <Typography
                sx={{
                  mb: 1,
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
              >
                <strong>Industry:</strong> {provider.industry}
              </Typography>

              <Typography
                sx={{
                  mb: 2,
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
              >
                <strong>Services/Equipment:</strong> {provider.services}
              </Typography>

              {provider?.documents?.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Documents
                  </Typography>
                  <List dense sx={{ bgcolor: "background.paper" }}>
                    {provider.documents.map((doc) => (
                      <ListItem key={doc.id}>
                        {/* <DescriptionIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} /> */}
                        <ListItemText
                          primary={doc.name}
                          secondary={new Date(
                            doc.uploadDate
                          ).toLocaleDateString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
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
