import { Grid, Typography } from "@mui/material";
import { Button } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import CardSearchConsumersFound from "../utils/CardSearchConsumerFound";
import NoDataFound from "../utils/NoDataFound";
const SearchConsumerRef = ({ searchParams, data }) => {
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const [consumersData, setConsumersData] = useState([]);
  const active = eventsPerAdmin.active ?? [];
  const completed = eventsPerAdmin.completed ?? [];
  const allAllow = [...active, ...completed];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sortingDataBasedOnStaffCredentials = (props) => {
    const result = new Set();
    const eventIdListStaffCredentials = [ ...allAllow.map((event) => event.id)];
    props?.consumers.forEach((item) => {
      const eventIdList = [...item.event_providers.map((event) => event)];
      if (
        eventIdList.some((eventId) =>
          eventIdListStaffCredentials.includes(eventId)
        )
      ) {
        result.add(item);
      }
    });
    return setConsumersData({ ...props, consumers: Array.from(result) });
  };
  useEffect(() => {
    const controller = new AbortController();
    if (data?.consumers?.length > 0) {
      sortingDataBasedOnStaffCredentials(data);
    }
    return () => controller.abort();
  }, [data?.consumers?.length]);

  const handleConsumerInfo = (props) => {
    let userFormatData = {
      uid: props?.id,
      name: props?.name,
      lastName: props?.lastName,
      email: props?.email,
      phoneNumber: props?.phoneNumber,
      data: props,
    };
    dispatch(onAddCustomerInfo(userFormatData));
    dispatch(onAddCustomer(userFormatData));
    navigate(`/consumers/${userFormatData.uid}`);
  };

  const handleLoadingMoreData = async (props) => {
    const response = await devitrakApi.get(
      `/search/searching_consumer?variable=${searchParams}&company=${user.companyData.id}&lastId=${props}`
    );
    if (response.data.ok) {
      return sortingDataBasedOnStaffCredentials(response.data.consumers);
    }
  };

  return (
    <Grid
      container
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <Grid
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          alignSelf: "flex-start",
        }}
        item
        xs={12}
        sm={12}
        md={4}
        lg={4}
      >
        <Typography
          style={{
            ...TextFontSize30LineHeight38,
            fontSize: "36px",
            lineHeight: "44px",
            fontWeight: 600,
            width: "100%",
            textAlign: "left",
          }}
        >
          Search consumers{" "}
        </Typography>
        <br />
        <Typography
          style={{
            ...TextFontSize20LineHeight30,
            width: "100%",
            textAlign: "left",
          }}
        >
          All consumers matching the search keywords.
        </Typography>
      </Grid>

      <Grid item xs={12} sm={12} md={8} lg={8}>
        <Grid style={{ overflowX: "auto", display:"flex", justifyContent:"flex-end" }} container gap={1}>
          {consumersData?.consumers?.length > 0 ? (
            consumersData?.consumers?.map((item, index) => (
              <>
                <Grid key={item.id} item xs={12} sm={12} md={3} lg={3}>
                  <CardSearchConsumersFound
                    props={item}
                    fn={handleConsumerInfo}
                  />
                </Grid>
                {index > 8 && (
                  <Grid
                    key={"loading-more-data"}
                    item
                    xs={12}
                    sm={12}
                    md={3}
                    lg={3}
                    gap={1}
                  >
                    <Button
                      style={{ ...BlueButton, height: "100%", width: "100%" }}
                      onClick={() =>
                        handleLoadingMoreData(
                          consumersData?.consumers?.at(-1).id
                        )
                      }
                    >
                      <p
                        style={{
                          ...BlueButtonText,
                          height: "100%",
                          display: data.hasMore ? "flex" : "none",
                          textTransform: "capitalize",
                        }}
                      >
                        Load more data
                      </p>
                    </Button>
                  </Grid>
                )}
              </>
            ))
          ) : (
            <NoDataFound />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
  // }
};

export default SearchConsumerRef;
