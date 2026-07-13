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
import EmptyState from "../../../../components/UX/emptyState/EmptyState";
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
          >
            {documentSortOrder === "desc" ? "↓" : "↑"} Sort by Date
          </Button>
        </DialogTitle>
        <DialogContent>
          {selectedProvider?.documents?.length > 0 ? (
            <List>
              {sortDocuments(selectedProvider.documents).map((doc, index) => (
                <ListItem
                  key={doc?.id || doc?._id || `${doc?.name}-${index}`}
                  sx={{
                    border: "1px solid var(--gray-200, #ddded6)",
                    borderRadius: "8px",
                    mb: 1,
                    "&:last-child": { mb: 0 },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 500,
                          color: "var(--gray-900, #171d1a)",
                        }}
                      >
                        {doc?.name || doc?.title || "Untitled document"}
                      </Typography>
                    }
                    secondaryTypographyProps={{ component: "div" }}
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "var(--gray-600, #5d615a)" }}
                        >
                          Uploaded:{" "}
                          {doc?.uploadDate
                            ? new Date(doc.uploadDate).toLocaleString()
                            : "Unknown"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "var(--gray-600, #5d615a)" }}
                        >
                          {typeof doc?.size === "number"
                            ? `Size: ${(doc.size / 1024).toFixed(2)} KB`
                            : ""}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyState
              icon="tabler:file-off"
              title="No documents uploaded yet"
              description="Documents uploaded for this supplier will appear here."
              compact
            />
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
