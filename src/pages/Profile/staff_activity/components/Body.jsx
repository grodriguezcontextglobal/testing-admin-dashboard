import { Grid, Typography } from "@mui/material";
import { Avatar, List, Tag } from "antd";
import PropTypes from "prop-types";
import "./Body.css";
import IconListTable from "./Icon";

const metaStyle = { color: "var(--gray-500, #777b73)", fontSize: "13px" };

/**
 * One line of the audit trail.
 *
 * The server started auditing every route it serves on 2026-10-05, and each
 * row has carried the route, the HTTP status, the request body, the caller's
 * IP and browser, and a worked-out `context` ever since. The list printed
 * "UPDATE Device" and a UTC timestamp, so none of it was visible and no row
 * could be told from the next.
 *
 * It is read by whoever has to answer "who touched this student's laptop", so
 * none of the server's own words reach it: no route, no HTTP status, no
 * request body. `PATCH /api/receiver/receivers-pool-update/:id` with
 * `{ "activity": false }` is shown as "Returned a device", and what it means
 * is spelled out in a sentence. Rows the machine wrote about itself — cache
 * clears — are not listed at all.
 */
const LogRow = ({ item }) => (
  <List.Item style={{ textAlign: "left" }}>
    <List.Item.Meta
      avatar={<Avatar src={<IconListTable />} />}
      title={
        <span style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
          <Typography component="span" style={{ fontWeight: 600 }}>
            {item?.staffName}
          </Typography>
          {item?.staffEmail && (
            <Typography component="span" style={{ ...metaStyle, color: "var(--gray-600, #5d615a)" }}>
              {item.staffEmail}
            </Typography>
          )}
        </span>
      }
      description={
        <span style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontWeight: 500, color: "var(--gray-700, #484d47)" }}>
              {item?.summary}
            </span>
            {item?.highlights?.map((highlight) => (
              <Tag key={highlight} style={{ margin: 0 }}>
                {highlight}
              </Tag>
            ))}
          </span>

          <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            {/* The reader's own clock: the trail answers "when did this
                happen", and it used to answer in UTC. */}
            <span style={metaStyle}>{new Date(`${item.time}`).toLocaleString()}</span>
            {item?.client && <span style={metaStyle}>· {item.client}</span>}
          </span>

          {(item?.explanation || item?.target || item?.ip) && (
            <details className="activity-row__details">
              <summary style={{ ...metaStyle, cursor: "pointer" }}>Details</summary>
              <dl className="activity-row__evidence">
                {item.explanation && (
                  <>
                    <dt>What changed</dt>
                    <dd>{item.explanation}</dd>
                  </>
                )}
                {item.target && (
                  <>
                    <dt>Record</dt>
                    <dd>{item.target}</dd>
                  </>
                )}
                {item.ip && (
                  <>
                    <dt>Computer</dt>
                    <dd>{[item.client, item.ip].filter(Boolean).join(" · ")}</dd>
                  </>
                )}
              </dl>
            </details>
          )}
        </span>
      }
    />
  </List.Item>
);

LogRow.propTypes = { item: PropTypes.object.isRequired };

const Body = ({ sortData, pagination }) => {
  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
      container
    >
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        marginY={0}
        item
        xs={12}
        sm={12}
        md={12}
      >
        <List
          style={{ width: "100%" }}
          pagination={pagination}
          itemLayout="horizontal"
          dataSource={sortData}
          renderItem={(item) => <LogRow item={item} />}
        />
      </Grid>
    </Grid>
  );
};

Body.propTypes = {
  sortData: PropTypes.array,
  pagination: PropTypes.object,
};

export default Body;
