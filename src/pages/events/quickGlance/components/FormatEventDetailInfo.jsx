import { Grid } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import ButtonSections from "./formatEventDetailInfo/ButtonSections";
import EventDateInformation from "./formatEventDetailInfo/EventDateInformation";
import ContactInformation from "./formatEventDetailInfo/ContactInformation";
import QRCodeDisplay from "./QRCode";

const FormatEventDetailInfo = () => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  return (
    <Grid container>
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignSelf={"flex-start"}
        margin={`${isSmallDevice && "1rem"}`}
        item
        xs={12}
        sm={5}
        md={6}
        lg={4}
      >
        <ContactInformation />
      </Grid>
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignSelf={"flex-start"}
        margin={`${isSmallDevice && "1rem"}`}
        item
        xs={12}
        sm={5}
        md={6}
        lg={4}
      >
        <EventDateInformation />
      </Grid>
      <Grid
        margin={`${isSmallDevice && "1rem"}`}
        display={"flex"}
        justifyContent={"flex-start"}
        alignSelf={"flex-start"}
        item
        xs={12}
        md={12}
        lg={4}
      ><Grid display={'flex'} flexDirection={'column'} item xs={12} sm={12} md={12} lg={12}>
          <ButtonSections />
          <QRCodeDisplay />
        </Grid>

      </Grid>
    </Grid>
  );
};
export default FormatEventDetailInfo;