import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid } from "@mui/material";
import { Tooltip } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import UpdateListOfNotesPerConsumer from "./ModalDeleteNote";

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

  const isAdmin =
    user.companyData.employees.filter((ele) => ele.user === user.email)[0]
      ?.role < 1;

  const notesForCompany = props
    .slice()
    .reverse()
    .filter((item) => item.company === user.companyData.id);

  return (
    <>
      <div
        data-testid="notes-card"
        style={{
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #EAECF0)",
          background: "var(--base-white, #FFF)",
          boxShadow:
            "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
          padding: "16px 20px",
          height: "60%",
        }}
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
              color: "var(--gray-700, #344054)",
              lineHeight: "18px",
            }}
          >
            {title}
          </span>
          {isAdmin && (
            <Tooltip title="Delete notes">
              <Icon
                onClick={() => setOpenDeleteNoteModal(true)}
                icon="uil:ellipsis-v"
                width={20}
                style={{ cursor: "pointer", color: "var(--gray-400, #98A2B3)" }}
              />
            </Tooltip>
          )}
        </Grid>

        {/* Notes list */}
        <div
          data-testid="notes-list"
          style={{
            maxHeight: "160px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {notesForCompany.length === 0 ? (
            <p
              style={{
                fontFamily: "Inter",
                fontSize: "13px",
                color: "var(--gray-400, #98A2B3)",
                textAlign: "left",
              }}
            >
              No notes yet. Click &apos;Edit&apos; to add one.
            </p>
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
                    color: "var(--gray-400, #98A2B3)",
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
                    color: "var(--gray-700, #344054)",
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
      </div>

      {openDeleteNoteModal && (
        <UpdateListOfNotesPerConsumer
          openDeleteNoteModal={openDeleteNoteModal}
          setOpenDeleteNoteModal={setOpenDeleteNoteModal}
          renderingNotesPerCustomer={() => notesForCompany}
        />
      )}
    </>
  );
};

export default NotesRendering;
