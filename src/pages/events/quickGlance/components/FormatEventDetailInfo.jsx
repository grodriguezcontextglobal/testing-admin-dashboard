import { Grid } from "@mui/material";
import ButtonSections from "./formatEventDetailInfo/ButtonSections";
import ContactInformation from "./formatEventDetailInfo/ContactInformation";
import EventDateInformation from "./formatEventDetailInfo/EventDateInformation";
import QRCodeDisplay from "./QRCode";

const FormatEventDetailInfo = () => {
  return (
    <Grid container spacing={2}>
      <Grid display="flex" justifyContent="flex-start" alignSelf="flex-start" item xs={12} sm={6} md={6} lg={3}>
        <ContactInformation />
      </Grid>
      <Grid display="flex" justifyContent="flex-start" alignSelf="flex-start" item xs={12} sm={6} md={6} lg={3}>
        <EventDateInformation />
      </Grid>
      <Grid display="flex" justifyContent="flex-start" alignSelf="flex-start" item xs={12} md={12} lg={3}>
        <ButtonSections />
      </Grid>
      <Grid display="flex" justifyContent="flex-start" alignSelf="flex-start" item xs={12} sm={6} md={6} lg={3}>
        <QRCodeDisplay />
      </Grid>
    </Grid>
  );
};

export default FormatEventDetailInfo;
