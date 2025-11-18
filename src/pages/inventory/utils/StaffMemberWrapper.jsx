import { Grid } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Space } from "antd";
import CardLocations from "./CardLocations";

const StaffMemberWrapper = ({ item, setSelectedStaffEmail }) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );

  return (
    <div
      style={{
        maxWidth: "1400px",
        minWidth: "320px",
        width: "100%",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        padding: "0 1rem",
      }}
    >
      <Space
        align="start"
        size={[8, 16]}
        wrap
        style={{ maxWidth: "1400px", minWidth: "320px", width: "100%" }}
      >
        {(item.data || []).map((opt) => {
          const token = String(opt?.key || "")
            .split("/")
            .map((p) => p.trim())
            .filter(Boolean);
          const name = token[0] || "";
          const email = token[1] || "";
          if (!email || !email.includes("@")) return null;

          return (
            <Grid
              padding={`${
                isSmallDevice || isMediumDevice || isLargeDevice
                  ? "10px 0px"
                  : "10px 10px 10px 0"
              }`}
              item
              xs={12}
              key={`${item.key}-${opt?.key}`}
            >
              {/* <Card
                onClick={() => setSelectedStaffEmail(email)}
                style={{
                  borderRadius: "12px",
                  border: "1px solid var(--gray-200, #EAECF0)",
                  background: "var(--base-white, #FFF)",
                  boxShadow:
                    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    lineHeight: "28px",
                    marginBottom: "6px",
                  }}
                >
                  {name}
                  <br />
                  <span style={Subtitle}>{email}</span>
                </div>
                <div
                  style={{
                    color: "var(--gray-600, #475467)",
                    fontSize: "14px",
                    lineHeight: "20px",
                  }}
                >
                  {opt?.value} total devices
                </div>
              </Card> */}
              <button
                style={{
                  width: "100%",
                  outline: "none",
                  border: "none",
                  margin: 0,
                  padding: 0,
                  backgroundColor: "transparent",
                }}
                type="button"
                onClick={() => setSelectedStaffEmail(email)}
              >
                <CardLocations
                  props={`${opt?.value} total devices`}
                  title={`${name} | ${email}`}
                  optional={null}
                />
              </button>
            </Grid>
          );
        })}
      </Space>
    </div>
  );
};

export default StaffMemberWrapper;
