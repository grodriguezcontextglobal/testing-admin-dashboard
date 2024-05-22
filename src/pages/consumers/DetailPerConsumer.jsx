// import StripeTransactionHistoryByUser from '../Attendees/tables/StripeTransactionHistoryByUser';
import { Icon } from '@iconify/react';
import { Button, Grid, InputAdornment, OutlinedInput, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Divider } from 'antd';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { devitrakApi } from '../../api/devitrakApi';
import Loading from '../../components/animation/Loading';
import { CreditCardIcon, EditIcon, ReleaseDepositIcon } from '../../components/icons/Icons';
import CenteringGrid from '../../styles/global/CenteringGrid';
import { OutlinedInputStyle } from '../../styles/global/OutlinedInputStyle';
import TextFontsize18LineHeight28 from '../../styles/global/TextFontSize18LineHeight28';
import { TextFontSize30LineHeight38 } from '../../styles/global/TextFontSize30LineHeight38';
import CardRendered from '../inventory/utils/CardRendered';
import CardActionsButton from './components/CardActionsButton';
import ConsumerDetailInformation from './components/ConsumerDetailInformation';
import ConsumerDetailInfoCntact from './components/ConsumerDetailinfoContact';
import StripeTransactionPerConsumer from './tables/StripeTransactionPerConsumer';

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
                style={{
                  ...TextFontsize18LineHeight28, textTransform: "capitalize",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--blue-dark-600, #155EEF)",
                  cursor: "pointer"
                }}
                onClick={() => handleBackAction()}
              >
                All consumers
              </Typography>
              <Typography
                style={{
                  ...TextFontsize18LineHeight28, textTransform: "capitalize",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--gray-900, #101828)"
                }}

              >
                <Icon icon="mingcute:right-line" />
                {customer?.name} {customer?.lastName}
              </Typography>{" "}
            </Grid>
          </Grid>
          <Grid textAlign={"right"} item xs={4}></Grid>
        </Grid>
        <Divider />
        <Grid gap={'5px'} display={'flex'} justifyContent={'space-between'} alignItems={'center'} alignSelf={'flex-start'} container>
          <Grid display={'flex'} justifyContent={'flex-start'} alignItems={'center'} item xs={12} sm={12} md={4} lg={4}>
            <ConsumerDetailInformation />
          </Grid>
          <Grid display={'flex'} justifyContent={'flex-start'} alignItems={'center'} alignSelf={'flex-start'} item xs={12} sm={12} md={4} lg={4}>
            <ConsumerDetailInfoCntact />
          </Grid>
          <Grid display={'flex'} justifyContent={'flex-end'} alignItems={'center'} alignSelf={'flex-start'} item xs={12} sm={12} md={3} lg={3}>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "5px" }}>
              <button style={{
                outline: "none",
                display: 'flex',
                padding: '10px 16px',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                border: '1px solid var(--Blue-dark-50, #EFF4FF)',
                background: 'var(--Blue-dark-50, #EFF4FF)',
              }}><EditIcon />
                <p style={{
                  color: 'var(--Blue-dark-700, #004EEB)',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  lineHeight: '20px',
                }}>Edit</p>
              </button>
            </div>
          </Grid>
        </Grid >
        <Divider />{" "}
        <Grid alignSelf={'flex-start'} item xs={12} sm={12} md={6} lg={6} ><CardRendered title={'Group'} props={'No group provided'} optional={null} /></Grid>
        <Grid alignSelf={'flex-start'} item xs={12} sm={12} md={6} lg={6} ><CardActionsButton /></Grid>
        <Divider />{" "}
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          <p style={{ ...TextFontsize18LineHeight28, width: "100%", textAlign: "left" }}>Events attended</p>
          <Grid display={"flex"} justifyContent={"flex-start"} alignItems={"center"} item xs={3}>
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
          </Grid>
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
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={1}
          container
        >
          <button style={{
            width: "80%",
            outline: "none",
            display: 'flex',
            padding: '16px 28px',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            flex: '1 0 0',
            borderRadius: '8px',
            border: '1px solid var(--Error-300, #FDA29B)',
            background: 'var(--Base-White, #FFF)',
            /* Shadow/xs */
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)"
          }}>
            <CreditCardIcon /><p style={{ ...TextFontsize18LineHeight28, color: "var(--Error-700, #B42318)" }}>Charge for lost device</p>
          </button>
          <button style={{
            width: "80%",
            outline: "none",
            display: 'flex',
            padding: '16px 28px',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            flex: '1 0 0',
            borderRadius: '8px',
            border: '1px solid var(--Gray-300, #D0D5DD)',
            background: 'var(--Base-White, #FFF)',
            /* Shadow/xs */
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)"
          }}>
            <ReleaseDepositIcon /><p style={{ ...TextFontsize18LineHeight28, color: "var(--Gray-700, #344054)" }}>Release deposit</p>
          </button>
        </Grid>

      </Grid >
    );
  }
};


export default DetailPerConsumer