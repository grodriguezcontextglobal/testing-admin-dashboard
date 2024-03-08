// import StripeTransactionHistoryByUser from '../Attendees/tables/StripeTransactionHistoryByUser';
import { Icon } from '@iconify/react';
import { Button, Grid, InputAdornment, OutlinedInput, Typography } from '@mui/material';
import { Divider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import StripeTransactionPerConsumer from './tables/StripeTransactionPerConsumer';
import { devitrakApi } from '../../api/devitrakApi';
import CenteringGrid from '../../styles/global/CenteringGrid';
import Loading from '../../components/animation/Loading';
import FormatAttendeeDetailInfo from '../events/quickGlance/consumer/ConsumerDetail/Details';
import { OutlinedInputStyle } from '../../styles/global/OutlinedInputStyle';
import { TextFontSize30LineHeight38 } from '../../styles/global/TextFontSize30LineHeight38';

const DetailPerConsumer = () => {
  const { register, watch, setValue } = useForm();
  const { customer } = useSelector((state) => state.customer);
  const navigate = useNavigate();
  const stripeTransactionsSavedQuery = useQuery({
    queryKey: ["stripeTransactionsList"],
    queryFn: () => devitrakApi.get("/admin/users"),
  });

  if (stripeTransactionsSavedQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>
  if (stripeTransactionsSavedQuery.data) {
    const handleBackAction = () => {
      navigate("/consumers");
    };
    return (
      <Grid
        style={{
          padding: "5px",
          display: "flex",
          justifyContent: "center",
          // alignItems: "center",
          alignSelf: "stretch"
        }}
        container
      >
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }} item xs={12} sm={12} md={12} lg={12}>
            <Typography
              textTransform={"none"}
              style={TextFontSize30LineHeight38}
            >
              Consumer
            </Typography>
            <Link to="/event/new_subscription">
              <Button
                style={{
                  width: "fit-content",
                  border: "1px solid var(--blue-dark-600, #155EEF)",
                  borderRadius: "8px",
                  background: "var(--blue-dark-600, #155EEF)",
                  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                }}
              >
                <Icon
                  icon="ic:baseline-plus"
                  color="var(--base-white, #FFF"
                  width={20}
                  height={20}
                />
                &nbsp;
                <Typography
                  textTransform={"none"}
                  style={{
                    color: "var(--base-white, #FFF",
                    fontSize: "14px",
                    fontWeight: "600",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                  }}
                >
                  Add new event
                </Typography>
              </Button>
            </Link>
          </Grid>
        </Grid>
        <Grid
          style={{
            paddingTop: "0px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid marginY={0} item xs={8}>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={600}
                fontSize={"18px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--blue-dark-600, #155EEF)"}
                style={{ cursor: "pointer" }}
                onClick={() => handleBackAction()}
              >
                All consumers
              </Typography>
              <Typography
                textTransform={"capitalize"}
                textAlign={"left"}
                fontWeight={600}
                fontSize={"18px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--gray-900, #101828)"}
              >
                <Icon icon="mingcute:right-line" />
                {customer?.name} {customer?.lastName}
              </Typography>{" "}
            </Grid>
          </Grid>
          <Grid textAlign={"right"} item xs={4}></Grid>
        </Grid>
        <Divider />
        <Grid container>
          <Grid item xs={12}>
            <FormatAttendeeDetailInfo />
          </Grid>
        </Grid>
        <Divider />{" "}
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid justifyContent={"left"} alignItems={"center"} item xs={3}>
            <OutlinedInput
              {...register("searchEvent")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search a transaction here"
              startAdornment={
                <InputAdornment position="start">
                  <Icon
                    icon="radix-icons:magnifying-glass"
                    color="#344054"
                    width={20}
                    height={19}
                  />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <Icon
                    cursor={"pointer"}
                    icon="ic:baseline-delete-forever"
                    color="#1e73be"
                    width="25"
                    height="25"
                    opacity={`${watch("searchEvent")?.length > 0 ? 1 : 0}`}
                    onClick={() => {
                      setValue("searchEvent", "");
                    }}
                  />
                </InputAdornment>
              }
            />
          </Grid> <Grid textAlign={"right"} item xs></Grid>
        </Grid>
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          <Grid item xs={12}>
            <StripeTransactionPerConsumer
              searchValue={watch("searchEvent")}
            />
          </Grid>
        </Grid>
      </Grid>
    );
  }
};


export default DetailPerConsumer