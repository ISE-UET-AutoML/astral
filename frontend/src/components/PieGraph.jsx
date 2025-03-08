import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, Label } from 'recharts'

const PieGraph = ({ data }) => {
	const COLORS = ['#0088FE', '#FF6F61']

	return (
		<div className="flex justify-center items-center p-4">
			<PieChart width={400} height={400}>
				<Pie
					data={data}
					cx={200}
					cy={200}
					outerRadius={120}
					fill="#8884d8"
					paddingAngle={1}
					dataKey="value"
					startAngle={90}
					endAngle={-270}
					label={({ value }) => `${value}%`}
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={COLORS[index % COLORS.length]}
						/>
					))}
				</Pie>
				<Tooltip />
				<Legend />
			</PieChart>
		</div>
	)
}

export default PieGraph
