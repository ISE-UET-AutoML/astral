import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

export const TrainingChart = ({ data, color = '#8884d8' }) => {
	return (
		<div style={{ width: '100%' }}>
			<ResponsiveContainer width="100%" height={300}>
				<LineChart
					width={500}
					height={200}
					data={data}
					margin={{
						top: 10,
						right: 30,
						left: 0,
						bottom: 0,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="name" />
					<YAxis />
					<Tooltip />
					<Line
						connectNulls
						type="linear"
						dataKey="value"
						stroke={color}
						fill={color}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};
