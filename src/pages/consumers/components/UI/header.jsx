import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { Button, Divider } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import AssigmentAction from "../AssigmentAction";
import NotesRendering from "../NotesCard";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { Link, useNavigate } from "react-router-dom";
import { BlueButton } from "../../../../styles/global/BlueButton";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import ConsumerDetailInformation from "../ConsumerDetailInformation";
import ConsumerDetailInfoCntact from "../ConsumerDetailinfoContact";
import CardActionsButton from "../CardActionsButton";
import CardRendered from "../../../inventory/utils/CardRendered";
import { onAddPaymentIntentSelected } from "../../../../store/slices/stripeSlice";

const CustomerHeader = () => {
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const substractingNotesAddedForCompany = () => {
    const result = customer?.data?.notes?.filter(
      (ele) => ele.company === user.companyData.id
    );
    if (result?.length > 0) {
      let final = [];
      final = [...final, ...result.map((item) => item)];
      // (note += item.notes)
      return final;
    }
    return [];
  };

  const handleBackAction = () => {
    dispatch(onAddPaymentIntentSelected(""));
    navigate(`/consumers/${customer.uid}`);
  };

  return (
    <>
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
      >
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "0 0 1.5dvh",
          }}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Typography textTransform={"none"} style={TextFontSize30LineHeight38}>
            Consumer
          </Typography>
          {/* /event/new_subscription */}
          <Link to="/create-event-page/event-detail">
            <Button
              style={{
                ...BlueButton,
                ...CenteringGrid,
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
                  ...BlueButtonText,
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
                ...TextFontsize18LineHeight28,
                textTransform: "capitalize",
                textAlign: "left",
                fontWeight: 600,
                color: "var(--blue-dark-600, #155EEF)",
                cursor: "pointer",
              }}
              onClick={() => handleBackAction()}
            >
              All consumers
            </Typography>
            <Typography
              style={{
                ...TextFontsize18LineHeight28,
                textTransform: "capitalize",
                textAlign: "left",
                fontWeight: 600,
                color: "var(--gray-900, #101828)",
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
      <Grid
        gap={"5px"}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        alignSelf={"flex-start"}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={3}
          lg={3}
        >
          <ConsumerDetailInformation />
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          alignSelf={"flex-start"}
          item
          xs={12}
          sm={12}
          md={4}
          lg={4}
        >
          <ConsumerDetailInfoCntact />
        </Grid>
        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          alignSelf={"flex-start"}
          item
          xs={12}
          sm={12}
          md={3}
          lg={3}
        >
          <CardActionsButton />
        </Grid>
      </Grid>
      <Divider />{" "}
      <Grid
        gap={"2px"}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        alignSelf={"flex-start"}
        container
      >
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={3} lg={3}>
          <CardRendered title={"Transactions"} props={`${0}`} optional={null} />
        </Grid>{" "}
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={3} lg={3}>
          <CardRendered title={"Events"} props={0} optional={null} />
        </Grid>
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={5} lg={5}>
          <NotesRendering
            title={"Notes"}
            props={substractingNotesAddedForCompany()}
          />
        </Grid>
      </Grid>
      <Divider />{" "}
      <p
        style={{
          ...TextFontsize18LineHeight28,
          width: "100%",
          textAlign: "left",
          margin: "0 0 1.5dvh",
        }}
      >
        Transactions
      </p>
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          alignSelf={"flex-start"}
          item
          xs={12}
          md={4}
          lg={4}
        >
          <OutlinedInput
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
          />
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          alignSelf={"flex-start"}
          item
          xs={12}
          md={5}
          lg={5}
        >
          <AssigmentAction />
        </Grid>
      </Grid>
    </>
  );
};

export default CustomerHeader;
