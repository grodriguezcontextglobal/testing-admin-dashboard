import { Grid } from "@mui/material";
import { Card } from "antd";
import PropTypes from "prop-types";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import ActivityGauge from "./ActivityGauge";

const cardTokens = {
  borderRadius: "12px",
  border: "1px solid var(--gray-200, #EAECF0)",
  background: "var(--base-white, #FFF)",
  boxShadow:
    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
};

const StatTile = ({ value, label, accentColor, "data-testid": testId }) => (
  <Card
    data-testid={testId}
    style={{ ...cardTokens, height: "100%" }}
    styles={{ body: { padding: "16px 20px" } }}
  >
    <span
      style={{
        display: "block",
        fontFamily: "Inter",
        fontSize: "24px",
        fontWeight: 600,
        lineHeight: "32px",
        color: accentColor ?? "var(--gray-900, #101828)",
      }}
    >
      {value ?? 0}
    </span>
    <span
      style={{
        display: "block",
        fontFamily: "Inter",
        fontSize: "13px",
        lineHeight: "18px",
        color: "var(--gray-500, #667085)",
        marginTop: "4px",
      }}
    >
      {label}
    </span>
  </Card>
);

const ConsumerStatsSection = ({ data }) => {
  const result = data?.data?.result ?? {};
  const total = result.totalConsumers ?? 0;
  const active = result.activeTransactions ?? 0;
  const inactive = result.inactiveTransactions ?? 0;
  const fromEvents = result.totalConsumersFromEvents ?? 0;

  return (
    <Grid spacing={2} container sx={{ marginY: 2 }} alignItems="flex-start" data-testid="consumer-stats-section">
      <Grid item xs={12} sx={{ marginBottom: 1.5 }}>
        <p
          style={{
            ...TextFontsize18LineHeight28,
            textAlign: "left",
            width: "100%",
            color: "var(--Base-Black, #000)",
          }}
        >
          Quick glance
        </p>
        <p style={{ ...Subtitle, textAlign: "left", width: "100%" }}>
          Overview of your consumer base.
        </p>
      </Grid>

      {/* Stat tiles — 2×2 grid */}
      <Grid item xs={12} md={7} lg={8}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <StatTile
              value={total}
              label="Total consumers"
              data-testid="stat-total"
            />
          </Grid>
          <Grid item xs={6}>
            <StatTile
              value={active}
              label="Active"
              accentColor="var(--success-600, #039855)"
              data-testid="stat-active"
            />
          </Grid>
          <Grid item xs={6}>
            <StatTile
              value={inactive}
              label="Inactive"
              accentColor="var(--gray-600, #475467)"
              data-testid="stat-inactive"
            />
          </Grid>
          <Grid item xs={6}>
            <StatTile
              value={fromEvents}
              label="From events"
              accentColor="var(--blue-dark-600, #155EEF)"
              data-testid="stat-from-events"
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Activity gauge */}
      <Grid
        item
        xs={12}
        md={5}
        lg={4}
        sx={{
          marginTop: { xs: 2, md: 0 },
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ActivityGauge active={active} inactive={inactive} total={total} />
      </Grid>
    </Grid>
  );
};

ConsumerStatsSection.propTypes = {
  data: PropTypes.object,
};

StatTile.propTypes = {
  value: PropTypes.number,
  label: PropTypes.string.isRequired,
  accentColor: PropTypes.string,
  "data-testid": PropTypes.string,
};

export default ConsumerStatsSection;
