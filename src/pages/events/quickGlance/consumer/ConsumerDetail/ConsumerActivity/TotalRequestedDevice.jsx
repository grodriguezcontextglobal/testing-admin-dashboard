import { Grid } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { PackageCheck } from "lucide-react";

const TotalRequestedDevice = ({ totalDevicesRequestedPerConsumer }) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  return (
    <Grid
      display={"flex"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      item
      xs={12}
      sm={12}
      md={12}
    >
      <Grid
        padding={`${
          isSmallDevice || isMediumDevice ? "10px 0px" : "10px 10px 10px 0"
        }`}
        item
        xs={12}
      >
        <div
          style={{
            border: "1px solid var(--gray-200, #EAECF0)",
            borderRadius: "12px",
            padding: "20px",
            background: "#fff",
            boxShadow:
              "0px 1px 2px rgba(16, 24, 40, 0.06), 0px 1px 3px rgba(16, 24, 40, 0.10)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "var(--blue-dark-100, #d1e0ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <PackageCheck size={20} color="var(--blue-dark-600, #155eef)" />
          </div>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "700",
              color: "var(--gray-900, #101828)",
              fontFamily: "Inter",
            }}
          >
            {totalDevicesRequestedPerConsumer}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "var(--gray-500, #667085)",
              fontFamily: "Inter",
            }}
          >
            Total devices requested
          </div>
        </div>
      </Grid>
    </Grid>
  );
};

export default TotalRequestedDevice;
