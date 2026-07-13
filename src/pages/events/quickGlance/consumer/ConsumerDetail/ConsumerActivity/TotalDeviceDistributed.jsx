import { Grid } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Tablet } from "lucide-react";

const TotalDevicesDistributed = ({ displayAllAssignedDeviceDistributed }) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  return (
    <Grid
      padding={`${
        isSmallDevice || isMediumDevice ? "10px 0px" : "10px"
      }`}
      item
      xs={12}
      sm={12}
      md={12}
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
          <Tablet size={20} color="var(--blue-dark-600, #155eef)" />
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: "700",
            color: "var(--gray-900, #101828)",
            fontFamily: "Inter",
          }}
        >
          {displayAllAssignedDeviceDistributed}
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "var(--gray-500, #667085)",
            fontFamily: "Inter",
          }}
        >
          Total devices distributed
        </div>
      </div>
    </Grid>
  );
};

export default TotalDevicesDistributed;
