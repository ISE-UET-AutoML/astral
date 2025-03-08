import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
} from 'recharts'

const LineGraph = ({ data, label }) => (
	<>
		{data.length > 0 && (
			<div className="charts-container mx-auto relative flex items-center">
				<div className="chart flex justify-center">
					<LineChart
						width={400}
						height={290}
						data={data}
						margin={{
							top: 5,
							right: 30,
							left: 0,
							bottom: 5,
						}}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="step" />
						<YAxis />
						<Tooltip />
						<Line
							type="monotone"
							dataKey="value"
							stroke="#4e80ee"
							strokeWidth="3"
						/>
					</LineChart>
				</div>
				<h3 className="text-center">{label}</h3>
			</div>
		)}
	</>
)

export default LineGraph
