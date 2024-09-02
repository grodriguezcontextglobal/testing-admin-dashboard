import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card, Input, Tooltip } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Subtitle } from "../../../styles/global/Subtitle";
import UpdateListOfNotesPerConsumer from "./ModalDeleteNote";
const { TextArea } = Input;
const NotesRendering = ({ props, title }) => {
  const { user } = useSelector((state) => state.admin);
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const [openDeleteNoteModal, setOpenDeleteNoteModal] = useState(false);
  const renderingNotesPerCustomer = () => {
    let notes = "";
    props
      .slice()
      .reverse()
      .map((item, index) => {
        if (item.company === user.companyData.id) {
          notes += `${new Date(item.date)
            .toString()
            .split(" ")
            .slice(1, 5)
            .toString()
            .replaceAll(",", " ")}:  ${item.notes}`;
          if (index !== props.length - 1) {
            notes += "\n";
          }
        }
      });
    return notes;
  };
  const renderingOnlyNotesBasedOnCompany = () => {
    let notes = [];
    props
      .slice()
      .reverse()
      .map((item) => {
        if (item.company === user.companyData.id) {
          notes = [...notes, item];
        }
      });
    return notes;
  };
  return (
    <>
      <Grid
        padding={`${
          isSmallDevice || isMediumDevice || isLargeDevice
            ? "10px 0px"
            : "10px 10px 10px 0"
        }`}
        item
        xs={12}
      >
        <Card
          style={{
            borderRadius: "12px",
            border: "1px solid var(--gray-200, #EAECF0)",
            background: "var(--base-white, #FFF)",
            boxShadow:
              "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
          }}
        >
          <Grid
            display={"flex"}
            justifyContent={"space-around"}
            alignItems={"center"}
            container
          >
            <Grid
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography
                textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
                style={Subtitle}
              >
                {title}
              </Typography>
              <Typography
                textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
                style={Subtitle}
              >
                {user.companyData.employees.filter(
                  (ele) => ele.user === user.email
                )[0].role < 1 && (
                  <Tooltip title="Click to delete note">
                    <Icon
                      onClick={() => setOpenDeleteNoteModal(true)}
                      icon="uil:ellipsis-v"
                      width={25}
                    />
                  </Tooltip>
                )}
              </Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid
              display={"flex"}
              flexDirection={"column"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <TextArea
                disabled
                rows={4}
                style={{
                  ...Subtitle,
                  border: "transparent",
                  background: "transparent",
                }}
                placeholder="Add a note by clicking on the button at the top right corner named 'Edit'"
                value={renderingNotesPerCustomer()}
              />
            </Grid>
          </Grid>
        </Card>
      </Grid>{" "}
      {openDeleteNoteModal && (
        <UpdateListOfNotesPerConsumer
          openDeleteNoteModal={openDeleteNoteModal}
          setOpenDeleteNoteModal={setOpenDeleteNoteModal}
          renderingNotesPerCustomer={renderingOnlyNotesBasedOnCompany}
        />
      )}
    </>
  );
};

export default NotesRendering;
