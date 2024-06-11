import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Card } from "antd";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import { CardStyle } from "../../../../styles/global/CardStyle";
import CenteringGrid from "../../../../styles/global/CenteringGrid";

const DeviceInformationDetail = ({ dataFound }) => {
  const { user } = useSelector((state) => state.admin);
  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItem"],
    queryFn: () =>
      devitrakApi.post("/image/images", {
        company: user.company,
        category: dataFound[0]?.category_name,
        item_group: dataFound[0]?.item_group,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    listImagePerItemQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [dataFound[0]?.category_name, dataFound[0]?.item_group]);
  if (listImagePerItemQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (listImagePerItemQuery.data) {
    return (
      <Grid
        padding={"0px"}
        display={"flex"}
        justifyContent={"flex-start"}
        textAlign={"left"}
        alignItems={"flex-start"}
        alignSelf={"stretch"}
        item
        xs={12}
        sm={12}
        md={12}
      >
        <Card style={CardStyle}>
          <Grid
            display={"flex"}
            justifyContent={"space-around"}
            alignItems={"center"}
            container
          >
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              textAlign={"left"}
              alignItems={"center"}
              item
              xs={12}
            >
              <div
                style={{
                  alignSelf: "stretch",
                  margin: "0 20px 0 0",
                  width: "110px",
                }}
              >
                <div style={{ width: "100px", height: "100px" }}>
                  {listImagePerItemQuery.data.data.item.length > 0 && (
                    <img
                      style={{
                        objectFit: "contain",
                        width: "65%",
                        height: "85%",
                      }}
                      src={`${
                        listImagePerItemQuery.data.data.item.length > 0 &&
                        listImagePerItemQuery.data.data.item[0]?.source
                      }`}
                      alt="item_image"
                      width={250}
                      height={360}
                    />
                  )}
                </div>
              </div>
              <Typography
                textAlign={"left"}
                fontFamily={"Inter"}
                fontSize={"18px"}
                fontStyle={"normal"}
                fontWeight={600}
                lineHeight={"28px"}
                color={"var(--gray-900, #101828)"}
              >
                {dataFound[0]?.item_group}
                <br />
                <Typography
                  textAlign={"left"}
                  fontFamily={"Inter"}
                  fontSize={"18px"}
                  fontStyle={"normal"}
                  fontWeight={400}
                  lineHeight={"28px"}
                  color={"var(--gray-900, #101828)"}
                >
                  {dataFound[0]?.category_name}
                </Typography>
                <br />
                <Typography
                  textAlign={"left"}
                  fontFamily={"Inter"}
                  fontSize={"18px"}
                  fontStyle={"normal"}
                  fontWeight={400}
                  lineHeight={"28px"}
                  color={"var(--gray-900, #101828)"}
                >
                  {dataFound[0]?.company}
                </Typography>
              </Typography>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    );
  }
};

export default DeviceInformationDetail;
