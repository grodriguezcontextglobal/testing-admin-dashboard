import { lazy, Suspense, useState } from "react";
import { Grid, Typography } from "@mui/material";
import { Card, Tooltip } from "antd";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import Loading from "../../../../../components/animation/Loading";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
// import UpdateEventContactInfo from "../../updateEvent/UpdateEventContactInfo";
const UpdateEventContactInfo = lazy(() =>
  import("../../updateEvent/UpdateEventContactInfo")
);
const ContactInformation = () => {
  const { event } = useSelector((state) => state.event);
  const [openUpdateEventModal, setOpenUpdateEventModal] = useState(false);
  const styling = {
    textAlign: "left",
    fontFamily: "Inter",
    fontSize: "18px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "28px",
    color: "var(--gray-900, #101828)",
  };
  const renderTitle = () => {
    return <Typography style={styling}>Point of contact</Typography>;
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Card
        title={renderTitle()}
        extra={
          event?.active && (
            <Tooltip title="Update this section of the event">
              <Icon
                onClick={() => setOpenUpdateEventModal(true)}
                icon="uil:ellipsis-v"
                width={25}
              />
            </Tooltip>
          )
        }
        style={{
          border: "1px solid var(--gray-200, #EAECF0)",
          borderRadius: "12px",
          width: "100%",
        }}
        styles={{
          header: {
            borderBottom: "1px solid var(--gray-200, #EAECF0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "var(--main-background-color)",
          },
          body: {
            background: "var(--main-background-color)",
            textAlign: "left",
            width: "100%",
            padding: "16px",
          },
        }}
      >
        <Grid container>
          <Grid item xs={12}>
            <Typography style={{ ...styling, fontWeight: 500 }}>
              {event?.contactInfo?.name}
            </Typography>
          </Grid>
          <Grid item xs={12} style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon icon="mdi:email-outline" width={16} style={{ color: "var(--gray-500, #667085)", flexShrink: 0 }} />
              <Typography style={{ ...Subtitle, fontWeight: 400 }}>
                {event?.contactInfo?.email}
              </Typography>
            </div>
            {event?.contactInfo?.phone?.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon icon="mdi:phone-outline" width={16} style={{ color: "var(--gray-500, #667085)", flexShrink: 0 }} />
                <Typography style={{ ...Subtitle, fontWeight: 400 }}>
                  {item}
                </Typography>
              </div>
            ))}
          </Grid>
        </Grid>
      </Card>
      {openUpdateEventModal && openUpdateEventModal && (
        <UpdateEventContactInfo
          openUpdateEventModal={openUpdateEventModal}
          setOpenUpdateEventModal={setOpenUpdateEventModal}
          title={"Update contact info"}
        />
      )}
    </Suspense>
  );
};

export default ContactInformation;
