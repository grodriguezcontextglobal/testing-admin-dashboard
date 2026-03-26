import PropTypes from 'prop-types';
import { Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import './UntitledUIReactPiaChartComponent.css';

// Placeholder for ChartTooltipContent
const ChartTooltipContent = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="chart-tooltip-content">
                <p className="tooltip-label">{`${data.name} : ${data.value}`}</p>
            </div>
        );
    }
    return null;
};

ChartTooltipContent.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
};


// Placeholder for ChartLegendContent
const ChartLegendContent = (props) => {
    const { payload } = props;
    return (
        <ul className="chart-legend-content">
            {
                payload.map((entry, index) => (
                    <li key={`item-${index}`} style={{ color: entry.color }}>
                        <span className="legend-icon" style={{ backgroundColor: entry.color }} />
                        {entry.value}
                    </li>
                ))
            }
        </ul>
    );
};

ChartLegendContent.propTypes = {
    payload: PropTypes.array,
};


const UntitledUIReactPieChartComponent = ({ data, colors }) => {
    return (
        <ResponsiveContainer width="100%" height={240}>
            <RechartsPieChart margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <Legend
                    verticalAlign="top"
                    align="right"
                    layout="vertical"
                    content={<ChartLegendContent />}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Pie
                    isAnimationActive={false}
                    startAngle={-270}
                    endAngle={-630}
                    stroke="none"
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
            </RechartsPieChart>
        </ResponsiveContainer>
    );
};

UntitledUIReactPieChartComponent.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
        })
    ).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default UntitledUIReactPieChartComponent;
