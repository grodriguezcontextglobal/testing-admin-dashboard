import { Grid } from "@mui/material";
import RenderingConsumersChartsBehavior from "../RenderingConsumersChartsBehavior";

const ChartComponent = ({allConsumersBasedOnEventsPerCompany}) => {
  return (
    <Grid
      justifyContent={"space-between"}
      alignItems={"center"}
      gap={1}
      container
    >
      <Grid
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignSelf: "flex-start",
        }}
        item
        xs={12}
        sm={12}
        md={5}
        lg={5}
      >
        {" "}
        <RenderingConsumersChartsBehavior
          active={{
            title: "Active",
            number:
              allConsumersBasedOnEventsPerCompany?.data?.data?.result
                ?.activeTransactions ?? 0,
          }}
          inactive={{
            title: "Inactive",
            number:
              allConsumersBasedOnEventsPerCompany?.data?.data?.result
                ?.inactiveTransactions ?? 0,
          }}
          props={{
            title: "General activity",
            description:
              "Active consumers refers to those users currently holding one or more devices.", // from the database
            total:
              allConsumersBasedOnEventsPerCompany?.data?.data?.result?.total ??
              0,
          }}
        />
      </Grid>
      <Grid
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignSelf: "flex-start",
        }}
        item
        xs={12}
        sm={12}
        md={5}
        lg={5}
      >
        {" "}
        <RenderingConsumersChartsBehavior
          active={{
            title: "Event",
            number:
              allConsumersBasedOnEventsPerCompany?.data?.data?.result
                ?.totalConsumersFromEvents ?? 0,
          }}
          inactive={{
            title: "General",
            number:
              allConsumersBasedOnEventsPerCompany?.data?.data?.result?.lease ??
              0,
          }}
          props={{
            title: "Consumer origin",
            description:
              "Consumers from an event typically spend a shorter time with your devices.",
            total:
              Number(
                allConsumersBasedOnEventsPerCompany?.data?.data?.result
                  ?.totalConsumersFromEvents ?? 0
              ) +
              Number(
                allConsumersBasedOnEventsPerCompany?.data?.data?.result
                  ?.lease ?? 0
              ),
          }}
        />
      </Grid>
    </Grid>
  );
};

export default ChartComponent;
