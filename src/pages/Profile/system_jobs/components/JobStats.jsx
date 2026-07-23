import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import ReusableCard from "../../../../components/UX/cards/ReusableCard";

const STAT_TILES = [
  { key: "pending", title: "Pending" },
  { key: "processing", title: "Processing" },
  { key: "done", title: "Done" },
  { key: "failed", title: "Failed" },
  { key: "dead", title: "Dead" },
  { key: "total", title: "Total" },
];

const JobStats = () => {
  const jobStatsQuery = useQuery({
    queryKey: ["jobQueueStats"],
    queryFn: () => devitrakApi.get("/jobs/stats"),
    refetchInterval: 15000,
  });

  const stats = jobStatsQuery.data?.data?.stats ?? {};

  return (
    <Grid container spacing={2}>
      {STAT_TILES.map((tile) => (
        <Grid item xs={6} sm={4} md={2} key={tile.key}>
          <ReusableCard title={tile.title} props={stats[tile.key] ?? "—"} />
        </Grid>
      ))}
    </Grid>
  );
};

export default JobStats;
