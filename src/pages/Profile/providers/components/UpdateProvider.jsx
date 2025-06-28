import {
    Box,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select
} from "@mui/material";
import { Button, Modal } from "antd";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";

const UpdateProvider = ({
    openDialog,
    setOpenDialog,
    newProvider,
    handleInputChange,
    handleSubmit,
    dialogMode,
    setNewProvider
}) => {

    const closeModal = () => {
        setOpenDialog(false);
        setNewProvider({
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
    }
  return (
      <Modal
        open={openDialog}
        onClose={() => closeModal()}
        onCancel={() => closeModal()}
        centered
        width={1000}
        footer={null}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {dialogMode === "add" ? "Add New Provider" : "Edit Provider"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <InputLabel required sx={{ mb: 1 }}>
                Company Name
              </InputLabel>
              <OutlinedInput
                fullWidth
                name="companyName"
                value={newProvider.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
                style={OutlinedInputStyle}
              />
            </Box>

            <Box>
              <InputLabel required sx={{ mb: 1 }}>
                Industry
              </InputLabel>
              <OutlinedInput
                fullWidth
                name="industry"
                value={newProvider.industry}
                onChange={handleInputChange}
                placeholder="Enter industry type"
                style={OutlinedInputStyle}
              />
            </Box>

            <Box>
              <InputLabel required sx={{ mb: 1 }}>
                Services/Equipment
              </InputLabel>
              <OutlinedInput
                fullWidth
                name="services"
                value={newProvider?.services?.map((item) => item).join(", ")}
                onChange={handleInputChange}
                placeholder="Enter services or equipment (comma-separated)"
                style={OutlinedInputStyle}
              />
            </Box>

            {/* Address Section */}
            <Box>
              <InputLabel required sx={{ mb: 1 }}>
                Address
              </InputLabel>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <OutlinedInput
                  fullWidth
                  name="address.street"
                  value={newProvider.address.street}
                  onChange={handleInputChange}
                  placeholder="Street Address"
                  style={OutlinedInputStyle}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <OutlinedInput
                    fullWidth
                    name="address.city"
                    value={newProvider.address.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    style={OutlinedInputStyle}
                  />
                  <OutlinedInput
                    fullWidth
                    name="address.state"
                    value={newProvider.address.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    style={OutlinedInputStyle}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <OutlinedInput
                    fullWidth
                    name="address.postalCode"
                    value={newProvider.address.postalCode}
                    onChange={handleInputChange}
                    placeholder="Postal Code"
                    style={OutlinedInputStyle}
                  />
                  <OutlinedInput
                    fullWidth
                    name="address.country"
                    value={newProvider.address.country}
                    onChange={handleInputChange}
                    placeholder="Country"
                    style={OutlinedInputStyle}
                    defaultValue="USA"
                  />
                </Box>
              </Box>
            </Box>

            {/* Contact Information */}
            <Box>
              <InputLabel required sx={{ mb: 1 }}>
                Contact Information
              </InputLabel>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <OutlinedInput
                  fullWidth
                  name="contactInfo.email"
                  value={newProvider.contactInfo.email}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                  type="email"
                  style={OutlinedInputStyle}
                />
                <OutlinedInput
                  fullWidth
                  name="contactInfo.phone"
                  value={newProvider.contactInfo.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  style={OutlinedInputStyle}
                />
                <OutlinedInput
                  fullWidth
                  name="contactInfo.website"
                  value={newProvider.contactInfo.website}
                  onChange={handleInputChange}
                  placeholder="Website (Optional)"
                  style={OutlinedInputStyle}
                />
              </Box>
            </Box>

            {/* Status */}
            <Box>
              <InputLabel sx={{ mb: 1 }}>Status</InputLabel>
              <Select
                fullWidth
                name="status"
                value={newProvider.status}
                onChange={handleInputChange}
                style={OutlinedInputStyle}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => closeModal()}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
          style={BlueButton}
            onClick={handleSubmit}
            disabled={
              !newProvider.companyName ||
              !newProvider.industry ||
              newProvider.services.length === 0 ||
              !newProvider.address.street ||
              !newProvider.address.city ||
              !newProvider.address.state ||
              !newProvider.address.postalCode ||
              !newProvider.contactInfo.email ||
              !newProvider.contactInfo.phone
            }
          >
            <p style={BlueButtonText}>{dialogMode === "add" ? "Add Provider" : "Update Provider"}</p>
          </Button>
        </DialogActions>
      </Modal>
  )
}

export default UpdateProvider
