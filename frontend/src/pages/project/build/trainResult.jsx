import React, { useEffect, useState } from 'react'
import { useLocation, useOutletContext, useNavigate } from 'react-router-dom'
import {
	Card,
	Row,
	Col,
	Alert,
	Typography,
	Space,
	Statistic,
	Table,
	Tag,
	Button,
	Tooltip,
} from 'antd'
import {
	HistoryOutlined,
	CloudDownloadOutlined,
	TrophyOutlined,
	ClockCircleOutlined,
	RocketOutlined,
	BarChartOutlined,
	InfoCircleOutlined,
	ExperimentOutlined,
} from '@ant-design/icons'
import { ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import LineGraph from 'src/components/LineGraph'

import * as experimentAPI from 'src/api/experiment'
const { Title, Text } = Typography

// Performance Metrics Configuration
const performanceMetrics = [
	{
		key: '1',
		metric: 'Validation Accuracy',
		value: '95.2%',
		status: <Tag color="green">Excellent</Tag>,
		description: 'Percentage of correct predictions on validation dataset',
	},
	{
		key: '2',
		metric: 'Training Loss',
		value: '0.142',
		status: <Tag color="blue">Good</Tag>,
		description: "Measure of model's prediction error during training",
	},
	{
		key: '3',
		metric: 'F1 Score',
		value: '0.934',
		status: <Tag color="green">Excellent</Tag>,
		description: 'Balanced measure of precision and recall',
	},
	{
		key: '4',
		metric: 'Precision',
		value: '0.928',
		status: <Tag color="blue">Good</Tag>,
		description: 'Proportion of correct positive predictions',
	},
]

// Enhanced Table Columns with Tooltips
const columns = [
	{
		title: 'Metric',
		dataIndex: 'metric',
		key: 'metric',
		render: (text, record) => (
			<Tooltip title={record.description}>
				{text}{' '}
				<InfoCircleOutlined
					style={{ color: '#1890ff', marginLeft: 5 }}
				/>
			</Tooltip>
		),
	},
	{
		title: 'Value',
		dataIndex: 'value',
		key: 'value',
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
	},
]

const TrainResult = () => {
	const { projectInfo, trainingInfo, elapsedTime } = useOutletContext()
	console.log('Train Info', trainingInfo)
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const experimentName = searchParams.get('experimentName')

	const [GraphJSON, setGraphJSON] = useState({})
	const [val_lossGraph, setValLossGraph] = useState([])
	const [val_accGraph, setValAccGraph] = useState([])
	const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)

	// Existing data parsing logic
	const readChart = (contents, setGraph) => {
		const lines = contents.split('\n')
		const header = lines[0].split(',')
		let parsedData = []
		for (let i = 1; i < lines.length - 1; i++) {
			const line = lines[i].split(',')
			const item = {}

			for (let j = 1; j < header.length; j++) {
				const key = header[j]?.trim() || ''
				const value = line[j]?.trim() || ''
				item[key] = value
			}

			parsedData.push(item)
		}

		setGraph(parsedData)
	}

	useEffect(() => {
		experimentAPI.getTrainingHistory(experimentName).then((res) => {
			const data = res.data

			console.log('history', data)
			setGraphJSON(data)

			if (data.fit_history.scalars.val_loss) {
				readChart(data.fit_history.scalars.val_loss, setValLossGraph)
			}
			if (data.fit_history.scalars.val_acc) {
				readChart(data.fit_history.scalars.val_acc, setValAccGraph)
			}
		})
	}, [])

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<Space direction="vertical" size="large" className="w-full">
				{/* Key Metrics Cards */}
				<Row gutter={[16, 16]}>
					<Col xs={24} sm={12} md={8}>
						<Card className="shadow-md ">
							<Statistic
								title="Final Accuracy"
								value={trainingInfo?.accuracy || 0}
								precision={2}
								prefix={<TrophyOutlined />}
								suffix="%"
								valueStyle={{
									color: '#3f8600',
								}}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} md={8}>
						<Card className="shadow-md ">
							<Statistic
								title="Training Duration"
								value={elapsedTime || 0}
								valueStyle={{
									color: '#f0b100',
								}}
								prefix={<ClockCircleOutlined />}
								suffix="m"
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} md={8}>
						<Card className="shadow-md ">
							<Statistic
								title="Total Epochs"
								value={trainingInfo?.latestEpoch || 0}
								prefix={<ExperimentOutlined />}
								valueStyle={{
									color: '#2b7fff',
								}}
							/>
						</Card>
					</Col>
				</Row>

				<Card title="🚀 Next Steps" className="rounded-xl shadow-sm">
					<Row gutter={[16, 16]}>
						<Col xs={24} sm={8}>
							<Alert
								message="Deploy Model"
								description="Instantly transform your trained model into a production-ready solution for real-world predictions."
								type="success"
								showIcon
								style={{ height: 130 }}
							/>
							<Button
								type="primary"
								icon={<RocketOutlined />}
								onClick={() => {
									navigate(
										`/app/project/${projectInfo._id}/build/deployView?experimentName=${experimentName}`
									)
								}}
								size="large"
								style={{
									width: '100%',
									fontWeight: 'bold',
									marginTop: 15,
									backgroundColor: '#52c41a',
									borderColor: '#52c41a',
								}}
							>
								Deploy Now
							</Button>
						</Col>
						<Col xs={24} sm={8}>
							<Alert
								message="Download Weights"
								description="Securely export and preserve your model's learned parameters for future iterations or transfer learning."
								type="warning"
								showIcon
								style={{ height: 130 }}
							/>
							<Button
								type="default"
								icon={<CloudDownloadOutlined />}
								size="large"
								style={{
									width: '100%',
									fontWeight: 'bold',
									marginTop: 15,
									backgroundColor: '#faad14',
									color: 'white',
									borderColor: '#faad14',
								}}
							>
								Download
							</Button>
						</Col>
						<Col xs={24} sm={8}>
							<Alert
								message="Refine Model"
								description="Continuously improve your model's performance by initiating a new training cycle with enhanced data or parameters."
								type="info"
								showIcon
								style={{ height: 130 }}
							/>
							<Button
								type="default"
								icon={<HistoryOutlined />}
								size="large"
								style={{
									width: '100%',
									fontWeight: 'bold',
									marginTop: 15,
									backgroundColor: '#1890ff',
									color: 'white',
									borderColor: '#1890ff',
								}}
							>
								Retrain Model
							</Button>
						</Col>
					</Row>
				</Card>

				{/* Expandable Details Section */}
				<Card>
					<Button
						type="link"
						icon={<BarChartOutlined />}
						onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
						className="text-xl"
					>
						{isDetailsExpanded
							? 'Hide Details'
							: 'Show Detailed Results'}
					</Button>

					{isDetailsExpanded && (
						<Space
							direction="vertical"
							size="large"
							className="w-full mt-4"
						>
							{/* Performance Charts */}
							<Card title="Training Performance">
								<Row gutter={[16, 16]}>
									<Col xs={24} md={12}>
										<ResponsiveContainer
											width="100%"
											height={300}
										>
											<LineGraph
												data={val_lossGraph}
												label="Validation Accuracy Over Epochs"
											/>
										</ResponsiveContainer>
									</Col>
									<Col xs={24} md={12}>
										<ResponsiveContainer
											width="100%"
											height={300}
										>
											<LineGraph
												data={val_accGraph}
												label="Validation Loss Over Epochs"
											/>
										</ResponsiveContainer>
									</Col>
								</Row>
							</Card>

							{/* Detailed Metrics Table */}
							<Card title="Comprehensive Metrics">
								<Table
									columns={columns}
									dataSource={performanceMetrics}
									pagination={false}
								/>
							</Card>
						</Space>
					)}
				</Card>
			</Space>
		</div>
	)
}

export default TrainResult
