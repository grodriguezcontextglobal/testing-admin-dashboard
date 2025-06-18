import { Grid, Typography } from "@mui/material";
import { Avatar, Card } from "antd";
import { GeneralDeviceIcon } from "../../../../components/icons/GeneralDeviceIcon";
import { CardStyle } from "../../../../styles/global/CardStyle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";

const DeviceInformationDetail = ({ dataFound }) => {
  console.log(dataFound);
  return (
    <Card
      style={{ ...CardStyle, padding: 0, width: "100%" }}
      styles={{
        body: {
          padding: "0px 0px 24px 0px",
        },
      }}
    >
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        textAlign={"left"}
        alignItems={"center"}
        container
      >
        <Grid
          sx={{
            display: "flex",
            justifyContent: {
              xs: "center",
              sm: "center",
              md: "flex-start",
              lg: "flex-start",
            },
          }}
          item
          xs={12}
          sm={12}
          md={4}
          lg={4}
          style={{
            alignSelf: "stretch",
            margin: "0 20px 0 0",
            width: "110px",
          }}
        >
          {(dataFound[0].image_url && dataFound[0].image_url.length > 0) ? (
            <img
              style={{
                objectFit: "contain",
                width: "65%",
                height: "85%",
              }}
              src={`${dataFound[0].image_url}`}
              alt="item_image"
              width={250}
              height={360}
            />
          ) : (
            <Avatar size={100}>
              <GeneralDeviceIcon
                dimensions={{ width: "150px", height: "auto" }}
              />
            </Avatar>
          )}
        </Grid>
        <Grid
          sx={{
            display: "flex",
            justifyContent: {
              xs: "center",
              sm: "center",
              md: "flex-start",
              lg: "flex-start",
            },
          }}
          item
          xs={12}
          sm={12}
          md={7}
          lg={7}
        >
          <Typography
            sx={{
              ...TextFontsize18LineHeight28,
              width: "100%",
              textAlign: {
                xs: "center",
                sm: "center",
                md: "center",
                lg: "center",
              },
              fontWeight: 600,
            }}
          >
            {dataFound[0]?.item_group}
            <br />
            <Typography
              sx={{
                ...TextFontsize18LineHeight28,
                width: "100%",
                textAlign: {
                  xs: "center",
                  sm: "center",
                  md: "center",
                  lg: "center",
                },
                fontWeight: 400,
              }}
            >
              {dataFound[0]?.category_name}
            </Typography>
            <br />
            <Typography
              sx={{
                ...TextFontsize18LineHeight28,
                width: "100%",
                textAlign: {
                  xs: "center",
                  sm: "center",
                  md: "center",
                  lg: "center",
                },
                fontWeight: 400,
              }}
            >
              {dataFound[0]?.company}
            </Typography>
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};

export default DeviceInformationDetail;
