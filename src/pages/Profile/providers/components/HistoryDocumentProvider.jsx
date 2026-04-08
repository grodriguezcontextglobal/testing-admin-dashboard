import {
  Box,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography
} from "@mui/material";
import { Button } from "antd";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";

const HistoryDocumentProvider = ({
  openDocumentHistory,
  setOpenDocumentHistory,
  selectedProvider,
  setDocumentSortOrder,
  sortDocuments,
  documentSortOrder,
}) => {
  const bodyModal = () => {
    return (
      <>
        <DialogTitle
          sx={{
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            onClick={() =>
              setDocumentSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            startIcon={documentSortOrder === "desc" ? "↓" : "↑"}
          >
            Sort by Date
          </Button>
        </DialogTitle>
        <DialogContent>
          {selectedProvider?.documents?.length > 0 ? (
            <List>
              {sortDocuments(selectedProvider.documents).map((doc) => (
                <ListItem
                  key={doc.id}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    mb: 1,
                    "&:last-child": { mb: 0 },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {doc.name}
                      </Typography>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 0.5,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Uploaded: {new Date(doc.uploadDate).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Size: {(doc.size / 1024).toFixed(2)} KB
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" sx={{ textAlign: "center", py: 3 }}>
              No documents uploaded yet
            </Typography>
          )}
        </DialogContent>
      </>
    )
  }
  return (
    <ModalUX
      title={<Typography variant="h6">
        Document History - {selectedProvider?.companyName}
      </Typography>
      }
      body={bodyModal()}
      openDialog={openDocumentHistory}
      closeModal={() => setOpenDocumentHistory(false)}
      width={800}
      closable={false}
      footer={
        <GrayButtonComponent
          title="Close"
          func={() => setOpenDocumentHistory(false)}
        />
      }
    />
  );
};

export default HistoryDocumentProvider;
