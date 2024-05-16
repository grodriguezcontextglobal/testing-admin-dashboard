import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Divider } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { MagnifyIcon, WhitePlusIcon } from "../../components/icons/Icons";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import "../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import TablesConsumers from "./tables/TablesConsumers";
import { CreateNewConsumer } from "./utils/CreateNewUser";
import TextFontsize18LineHeight28 from "../../styles/global/TextFontSize18LineHeight28";

const MainPage = () => {
  const [loadingState, setLoadingState] = useState(false)
  const [createUserButton, setCreateUserButton] = useState(false);
  const [responseData, setResponseData] = useState([])
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event)
  const searching = watch("searchEvent")
  let counter = 0;
  const listOfEventsPerAdmin = useCallback(() => {
    let activeEvents = [];
    let completedEvents = [];
    if (eventsPerAdmin.active) {
      activeEvents = Object.values(eventsPerAdmin.active);
    } else {
      activeEvents = []
    }
    if (eventsPerAdmin.completed) {
      completedEvents = Object.values(eventsPerAdmin.completed);
    }
    else {
      completedEvents = []
    }
    return [...activeEvents, ...completedEvents];
  }, [user.company]);
  listOfEventsPerAdmin();

  const consumersPerAllowEvents = useMemo(async () => {
    setLoadingState(true)
    const result = new Set()
    if (listOfEventsPerAdmin()?.length > 0) {
      for (let data of listOfEventsPerAdmin()) {
        const resp = await devitrakApi.post('/auth/user-query', {
          provider: data.company,
          eventSelected: data.eventInfoDetail.eventName
        })
        if (resp.data) {
          const responseData = await resp.data.users
          for (let data of responseData) {
            const toString = JSON.stringify(data)
            if (!result.has(toString)) {
              result.add(toString)
            }
          }
        }
      }
      const finalReturn = new Set()
      for (let data of Array.from(result)) {
        const toJson = JSON.parse(data)
        finalReturn.add(toJson)
      }
      const formattingResponse = [...responseData, ...Array.from(finalReturn)]
      setLoadingState(false)
      return setResponseData(formattingResponse)
    }
  }, [listOfEventsPerAdmin().length, user.company]);

  const checkEventsPerCompany = () => {
    if (searching?.length > 0) {
      const check = responseData?.filter(
        (item) =>
          String(item?.name).toLowerCase().includes(String(searching).toLowerCase()) ||
          String(item?.lastName)
            ?.toLowerCase()
            .includes(String(searching).toLowerCase()) ||
          String(item?.email)?.toLowerCase().includes(String(searching).toLowerCase())
      );
      return check;
    }
    return responseData;
  };
  checkEventsPerCompany();

  const getInfoNeededToBeRenderedInTable = () => {
    let result = new Set();
    let mapTemplate = {};
    for (let data of checkEventsPerCompany()) {
      mapTemplate = {
        company: user.company,
        user: [data.name, data.lastName],
        email: data.email,
        key: data.id,
        entireData: data,
      };
      result.add(mapTemplate)
    }
    return Array.from(result).reverse()
  };

  const triggerFunctions = () => {
    getInfoNeededToBeRenderedInTable();
    return setLoadingState(false)
  };
  setTimeout(() => {
    counter = 1
  }, 2000)
  useEffect(() => {
    const controller = new AbortController()
    triggerFunctions()
    return () => {
      controller.abort()
    }
  }, [user.company])


  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
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
        <Grid item xs={6}>
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--gray-900, #101828)",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={600}
            fontFamily={"Inter"}
            fontSize={"30px"}
          >
            Consumers
          </Typography>
        </Grid>
        <Grid
          textAlign={"right"}
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          gap={1}
          item
          xs={6}
        >
          <Button
            onClick={() => setCreateUserButton(true)}
            style={BlueButton}
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
              style={BlueButtonText}
            >
              Add new consumer
            </Typography>
          </Button>
        </Grid>
      </Grid>
      <Divider/>
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid display={'flex'} justifyContent={"space-between"} alignItems={"center"} item xs={12} sm={12} md={12} lg={12}>
          <Typography style={{ ...TextFontsize18LineHeight28, color:"var(--gray900)", display: "flex", justifyContent: "flex-start", alignItems: "center", width: "fit-content" }}>All consumers&nbsp;</Typography>
        </Grid>
        <Divider style={{margin:"20px 0 24px"}} />
        <Grid display={'flex'} justifyContent={"space-between"} alignItems={"center"} item xs={12} sm={12} md={12} lg={12}>
          <Typography style={{ ...TextFontSize20LineHeight30, display: "flex", justifyContent: "flex-start", alignItems: "center", width: "fit-content" }}>Search consumers:&nbsp;</Typography>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searchEvent")}
              style={{ ...OutlinedInputStyle }}
              fullWidth
              placeholder="Search consumer here"
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
          </Grid>
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
        {Array.isArray(getInfoNeededToBeRenderedInTable()) && getInfoNeededToBeRenderedInTable().length > 0 ? (<Grid
          border={"1px solid var(--gray-200, #eaecf0)"}
          borderRadius={"12px 12px 0 0"}
          display={"flex"}
          alignItems={"center"}
          marginBottom={-2}
          paddingBottom={-2}
          item
          xs={12}
        >
          <Typography
            style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", }}
            textTransform={"none"}
            textAlign={"left"}
            fontWeight={600}
            fontSize={"18px"}
            fontFamily={"Inter"}
            lineHeight={"28px"}
            color={"var(--gray-900, #101828)"}
            padding={"24px"}
          > Consumers&nbsp;
            <div
              style={{
                borderRadius: "16px",
                background: "var(--blue-dark-50, #EFF4FF)",
                mixBlendMode: "multiply",
                width: "fit-content",
                height: "fit-content",
              }}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={500}
                fontSize={"12px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--blue-dark-700, #004EEB)"}
                padding={"0px 8px"}
              >
                {getInfoNeededToBeRenderedInTable().length ?? '0'} total
              </Typography>
            </div>
          </Typography>
        </Grid>) : (
          <div style={{ ...CenteringGrid, flexDirection: "column", width: "50%", margin: "40px auto" }}>
            <Typography
              textTransform={"none"}
              textAlign={"center"}
              fontWeight={500}
              fontSize={"36px"}
              fontFamily={"Inter"}
              lineHeight={"44px"}
              color={"var(--gray900)"}
              padding={"0px 8px"}
            >Add consumers</Typography>

            <Typography
              textTransform={"none"}
              textAlign={"center"}
              padding={"0px 8px"}
              style={TextFontSize20LineHeight30}
            >Consumers are users that will use the devices you provide with an intent to be returned. They can include.</Typography>
            <Button style={{ ...CenteringGrid, ...BlueButton, margin: "40px auto 0" }} onClick={() => setCreateUserButton(true)}>
              <WhitePlusIcon />&nbsp;<Typography style={BlueButtonText}>Add new consumer</Typography>
            </Button>
          </div>
        )}
        <Grid item xs={12}>
          {loadingState ? <Loading /> : <TablesConsumers key={counter} getInfoNeededToBeRenderedInTable={getInfoNeededToBeRenderedInTable()} />}
        </Grid>
      </Grid>
      {/* </Grid> */}
      {createUserButton && <CreateNewConsumer
        createUserButton={createUserButton}
        setCreateUserButton={setCreateUserButton}
      />}
    </Grid>
  );
};

export default MainPage;
