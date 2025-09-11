import { message } from "antd";
import { useState } from "react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import UpdateProvider from "../../../../Profile/providers/components/UpdateProvider";

const NewSupplier = ({
  setSupplierModal,
  user,
  queryClient,
  providersList,
  supplierModal,
  refetchingAfterNewSupplier,
}) => {
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
  const handleNewProviderSubmit = async () => {
    const isValidAddress =
      newProvider.address.street &&
      newProvider.address.city &&
      newProvider.address.state &&
      newProvider.address.postalCode;
  
    const isValidContactInfo =
      newProvider.contactInfo.email && newProvider.contactInfo.phone;
  
    // Clean services array by removing empty strings and trimming whitespace
    const cleanedServices = newProvider.services
      .map(service => service.trim())
      .filter(service => service.length > 0);
  
    if (
      newProvider.companyName &&
      newProvider.industry &&
      cleanedServices.length > 0 && // Use cleaned services for validation
      isValidAddress &&
      isValidContactInfo
    ) {
      try {
        const providerData = {
          ...newProvider,
          services: cleanedServices, // Use cleaned services in payload
          creator: user.companyData.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
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
          refetchingAfterNewSupplier();
          setSupplierModal(false);
        }
      } catch (error) {
        console.error("Error saving provider:", error);
        message.error("Error saving provider");
      }
    }
  };

  return (
    <UpdateProvider
      openDialog={supplierModal}
      setOpenDialog={setSupplierModal}
      newProvider={newProvider}
      handleInputChange={handleInputChange}
      handleSubmit={handleNewProviderSubmit}
      dialogMode={"add"}
      setNewProvider={setNewProvider}
    />
  );
};

export default NewSupplier;
