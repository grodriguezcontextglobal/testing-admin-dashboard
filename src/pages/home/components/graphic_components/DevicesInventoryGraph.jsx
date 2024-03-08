import { PieChart, Pie, Cell, ResponsiveContainer} from "recharts";

const COLORS = ["#00359E", "#155EEF", "#84ADFF", "#fb6b6b"];
const DevicesInventoryGraph = ({ dataToRender }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        width={600}
        height={600}
      >
        <Pie
          data={dataToRender}
          cx="50%"
          cy="50%"
          dataKey="value"
          innerRadius={60}
        >
          {dataToRender?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
export default DevicesInventoryGraph;
