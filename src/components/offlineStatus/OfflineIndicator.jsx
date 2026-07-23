import { Box } from "@mui/material";
import { useNetworkState } from "@uidotdev/usehooks";
import { WifiOff } from "lucide-react";

// Global, survives navigation — mirrors how <BackgroundJobsTracker /> is
// mounted once in App.jsx rather than per-page.
const OfflineIndicator = () => {
  const { online } = useNetworkState();

  if (online !== false) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "8px",
        backgroundColor: "var(--gray-900, #101828)",
        color: "var(--basewhite, #fff)",
        fontSize: "14px",
      }}
    >
      <WifiOff size={16} />
      Offline — actions will retry automatically
    </Box>
  );
};

export default OfflineIndicator;
