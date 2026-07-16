import { resolveRoleType } from "../../../config/roles";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid } from "@mui/material";
import { Card, Tooltip } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import UpdateListOfNotesPerConsumer from "./ModalDeleteNote";
import AddNoteModal from "./AddNoteModal";

const formatNoteDate = (dateStr) => {
  try {
    return new Date(dateStr)
      .toString()
      .split(" ")
      .slice(1, 5)
      .join(" ");
  } catch {
    return dateStr;
  }
};

const NotesRendering = ({ props, title }) => {
  const { user } = useSelector((state) => state.admin);
  const [openDeleteNoteModal, setOpenDeleteNoteModal] = useState(false);
  const [openAddNoteModal, setOpenAddNoteModal] = useState(false);

  const isAdmin = resolveRoleType(user) === "root_admin";

  const notesForCompany = props
    .slice()
    .reverse()
    .filter((item) => item.company === user.companyData.id);

  return (
    <>
      <Card
        data-testid="notes-card"
        style={{
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #ddded6)",
          background: "var(--base-white, #FFF)",
          boxShadow: "var(--shadow-xs)",
          height: "100%",
        }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        {/* Card header */}
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          sx={{ marginBottom: 1.5 }}
        >
          <span
            style={{
              fontFamily: "Inter",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--gray-700, #484d47)",
              lineHeight: "18px",
            }}
          >
            {title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tooltip title="Add note">
              <Icon
                onClick={() => setOpenAddNoteModal(true)}
                icon="ic:round-add"
                width={18}
                style={{ cursor: "pointer", color: "var(--blue-dark-600, #155EEF)" }}
              />
            </Tooltip>
            {isAdmin && (
              <Tooltip title="Manage notes">
                <Icon
                  onClick={() => setOpenDeleteNoteModal(true)}
                  icon="uil:ellipsis-v"
                  width={20}
                  style={{ cursor: "pointer", color: "var(--gray-400, #98A2B3)" }}
                />
              </Tooltip>
            )}
          </div>
        </Grid>

        {/* Notes list */}
        <div
          data-testid="notes-list"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {notesForCompany.length === 0 ? (
            <EmptyState
              compact
              icon="tabler:notes"
              title="No notes yet"
              description="Use the + button to add a note about this consumer."
            />
          ) : (
            notesForCompany.map((item, idx) => (
              <div
                key={`${item.date}-${idx}`}
                style={{
                  borderBottom:
                    idx < notesForCompany.length - 1
                      ? "1px solid var(--gray-100, #F2F4F7)"
                      : "none",
                  paddingBottom: idx < notesForCompany.length - 1 ? "10px" : 0,
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: "Inter",
                    fontSize: "11px",
                    color: "var(--gray-400, #9fa39b)",
                    lineHeight: "16px",
                    marginBottom: "2px",
                  }}
                >
                  {formatNoteDate(item.date)}
                </span>
                <p
                  style={{
                    fontFamily: "Inter",
                    fontSize: "13px",
                    color: "var(--gray-700, #484d47)",
                    lineHeight: "18px",
                    textAlign: "left",
                    margin: 0,
                  }}
                >
                  {item.notes}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      {openDeleteNoteModal && (
        <UpdateListOfNotesPerConsumer
          openDeleteNoteModal={openDeleteNoteModal}
          setOpenDeleteNoteModal={setOpenDeleteNoteModal}
          renderingNotesPerCustomer={() => notesForCompany}
        />
      )}
      {openAddNoteModal && (
        <AddNoteModal
          openAddNoteModal={openAddNoteModal}
          setOpenAddNoteModal={setOpenAddNoteModal}
        />
      )}
    </>
  );
};

export default NotesRendering;
