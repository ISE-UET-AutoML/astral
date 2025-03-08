import React, { useEffect, useState } from 'react'
import { useLocation, useOutletContext, useNavigate } from 'react-router-dom'
import { getExperiment } from 'src/api/experiment'
import {
	Card,
	Row,
	Col,
	Alert,
	Typography,
	Space,
	Progress,
	Divider,
	Tag,
	Spin,
	Skeleton,
	Button,
	Tooltip,
} from 'antd'
import {
	ExperimentOutlined,
	LineChartOutlined,
	CheckCircleOutlined,
	InfoCircleOutlined,
	BarChartOutlined,
	DashboardOutlined,
	CalendarOutlined,
	HourglassOutlined,
	RadarChartOutlined,
} from '@ant-design/icons'
import { useSpring, animated } from '@react-spring/web'
import {
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip as RechartsTooltip,
	Legend,
	ResponsiveContainer,
	Area,
	AreaChart,
} from 'recharts'

const { Title, Text, Paragraph } = Typography

// Training Metric Card Component - replacement for AnimatedStatistic
const TrainingMetricCard = ({
	title,
	value,
	prefix,
	suffix,
	loading,
	icon,
}) => {
	return (
		<Card className="h-max shadow-md">
			{loading ? (
				<Skeleton active paragraph={{ rows: 1 }} />
			) : (
				<div className="flex">
					<div className="text-lg font-semibold text-gray-600 flex items-center">
						{icon && <span className="mr-2">{icon}</span>}
						{title}
					</div>
					<div className="text-xl font-bold text-blue-600 ml-8">
						{prefix && <span className="mr-1">{prefix}</span>}
						{typeof value === 'number'
							? value % 1 === 0
								? value
								: value.toFixed(2)
							: value}
						{suffix && <span className="ml-1">{suffix}</span>}
					</div>
				</div>
			)}
		</Card>
	)
}

// Enhanced Line Graph Component
const EnhancedLineGraph = ({ data, loading, maxTrainingTime }) => {
	if (loading) {
		return (
			<div className="flex justify-center items-center h-64 w-full">
				<Spin size="large" tip="Loading chart data..." />
			</div>
		)
	}

	if (!data || data.length === 0) {
		return (
			<div className="flex justify-center items-center h-64 w-full border border-dashed border-gray-300 rounded-lg">
				<Space direction="vertical" align="center">
					<LineChartOutlined
						style={{ fontSize: 48, color: '#d9d9d9' }}
					/>
					<Text type="secondary">Waiting for training data...</Text>
				</Space>
			</div>
		)
	}

	return (
		<ResponsiveContainer width="100%" height={300}>
			<AreaChart
				data={data}
				margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
			>
				<defs>
					<linearGradient
						id="colorAccuracy"
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop
							offset="5%"
							stopColor="#1890ff"
							stopOpacity={0.8}
						/>
						<stop
							offset="95%"
							stopColor="#1890ff"
							stopOpacity={0.1}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
				<XAxis
					dataKey="time"
					label={{
						value: 'Time (min)',
						position: 'insideBottomRight',
						offset: -5,
					}}
					tick={{ fontSize: 12 }}
					domain={[0, maxTrainingTime ? maxTrainingTime : 'auto']}
				/>
				<YAxis
					label={{
						value: 'Accuracy',
						angle: -90,
						position: 'insideLeft',
					}}
					domain={[0, 1]}
					tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
					tick={{ fontSize: 12 }}
				/>
				<RechartsTooltip
					formatter={(value) => [
						`${(value * 100).toFixed(2)}%`,
						'Accuracy',
					]}
					labelFormatter={(label) => `Time: ${label} min`}
					contentStyle={{
						backgroundColor: '#fff',
						borderRadius: '4px',
						boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
					}}
				/>
				<Legend />
				<Area
					type="monotone"
					dataKey="accuracy"
					stroke="#1890ff"
					strokeWidth={3}
					fillOpacity={1}
					fill="url(#colorAccuracy)"
					activeDot={{
						r: 8,
						stroke: '#1890ff',
						strokeWidth: 2,
						fill: '#fff',
					}}
					name="Validation Accuracy"
				/>
				{maxTrainingTime && (
					<Line
						type="monotone"
						dataKey="threshold"
						stroke="transparent"
						strokeWidth={0}
						name="Max Training Time"
					/>
				)}
			</AreaChart>
		</ResponsiveContainer>
	)
}

// Training Information Card
const TrainingInfoCard = ({
	experimentName,
	trainingInfo,
	elapsedTime,
	status,
	maxTrainingTime,
	onViewResults,
	trainProgress,
}) => {
	// Calculate time-based progress
	const timeProgress = maxTrainingTime
		? Math.min((elapsedTime / maxTrainingTime) * 100, 100).toFixed(1)
		: 0
	const getProgressStatus = () => {
		if (status === 'DONE') return 'success'
		if (trainProgress >= 100) return 'exception'
		return 'active'
	}
	// return (
	// 	<Card
	// 		title={
	// 			<Title level={5}>
	// 				<DashboardOutlined /> Training Information:{' '}
	// 				<Tag color="blue" icon={<ExperimentOutlined />}>
	// 					{experimentName}
	// 				</Tag>
	// 			</Title>
	// 		}
	// 		className="shadow-md hover:shadow-lg transition-shadow duration-300"
	// 		extra={
	// 			<>
	// 				{status === 'DONE' && (
	// 					<div className="text-center">
	// 						<button
	// 							onClick={onViewResults}
	// 							className="border border-green-500 bg-green-50 text-green-500 p-2 rounded-md hover:bg-green-500 hover:text-white "
	// 						>
	// 							<CheckCircleOutlined className="mr-2" />
	// 							View Training Results
	// 						</button>
	// 					</div>
	// 				)}
	// 			</>
	// 		}
	// 	>
	// 		<Space direction="vertical" size="middle" style={{ width: '100%' }}>
	// 			<Row>
	// 				<div className="w-[28%]">
	// 					<TrainingMetricCard
	// 						title="Current Epoch"
	// 						value={trainingInfo.latestEpoch}
	// 						icon={<ExperimentOutlined />}
	// 						loading={
	// 							!trainingInfo.latestEpoch &&
	// 							status === 'TRAINING'
	// 						}
	// 					/>
	// 				</div>
	// 				<div className="w-[28%] ml-10">
	// 					<TrainingMetricCard
	// 						title="Validation Accuracy"
	// 						value={trainingInfo.accuracy * 100}
	// 						suffix="%"
	// 						icon={<BarChartOutlined />}
	// 						loading={
	// 							!trainingInfo.accuracy && status === 'TRAINING'
	// 						}
	// 					/>
	// 				</div>
	// 			</Row>

	// 			<Divider orientation="left">Training Progress</Divider>

	// 			<Row gutter={[16, 16]}>
	// 				{maxTrainingTime > 0 && (
	// 					<Col span={24}>
	// 						<Progress
	// 							percent={trainProgress}
	// 							status={
	// 								trainProgress >= 100 ? 'success' : 'active'
	// 							}
	// 							strokeColor={{
	// 								'0%': '#87d068',
	// 								'100%': '#fa8c16',
	// 							}}
	// 						/>
	// 						<div className="mt-2">
	// 							<Text type="secondary">
	// 								{timeProgress < 100
	// 									? `Training time remaining approximately ${(maxTrainingTime - elapsedTime).toFixed(1)} minutes`
	// 									: 'Maximum training time reached'}
	// 							</Text>
	// 						</div>
	// 					</Col>
	// 				)}
	// 			</Row>
	// 		</Space>
	// 	</Card>
	// )

	return (
		<Card
			title={
				<Title level={5}>
					<DashboardOutlined /> Training Information:{' '}
					<Tag color="blue" icon={<ExperimentOutlined />}>
						{experimentName}
					</Tag>
				</Title>
			}
			className="shadow-md hover:shadow-lg transition-shadow duration-300"
			extra={
				<>
					{status === 'DONE' && (
						<div className="text-center">
							<button
								onClick={onViewResults}
								className="border border-green-500 bg-green-50 text-green-500 p-2 rounded-md hover:bg-green-500 hover:text-white"
							>
								<CheckCircleOutlined className="mr-2" />
								View Training Results
							</button>
						</div>
					)}
				</>
			}
		>
			<Space direction="vertical" size="middle" style={{ width: '100%' }}>
				<Row>
					<div className="w-[28%]">
						<TrainingMetricCard
							title="Current Epoch"
							value={trainingInfo.latestEpoch}
							icon={<ExperimentOutlined />}
							loading={
								!trainingInfo.latestEpoch &&
								status === 'TRAINING'
							}
						/>
					</div>
					<div className="w-[28%] ml-10">
						<TrainingMetricCard
							title="Validation Accuracy"
							value={trainingInfo.accuracy * 100}
							suffix="%"
							icon={<BarChartOutlined />}
							loading={
								!trainingInfo.accuracy && status === 'TRAINING'
							}
						/>
					</div>
					<div className="w-[28%] ml-10">
						<TrainingMetricCard
							title="Time Elapsed"
							value={elapsedTime}
							suffix="min"
							icon={<CalendarOutlined />}
							loading={status === 'PENDING'}
						/>
					</div>
				</Row>

				<Divider orientation="left">Training Progress</Divider>

				<Row gutter={[16, 16]}>
					{maxTrainingTime > 0 && (
						<Col span={24}>
							<Progress
								percent={trainProgress}
								status={getProgressStatus()}
								strokeColor={{
									'0%': '#108ee9',
									'100%': '#87d068',
								}}
								format={(percent) =>
									status === 'DONE'
										? 'Completed'
										: `${percent.toFixed(1)}%`
								}
							/>
							<div className="mt-2">
								<Text type="secondary">
									{status === 'DONE'
										? `Training completed in ${elapsedTime.toFixed(2)} minutes`
										: timeProgress < 100
											? `Training time remaining approximately ${(maxTrainingTime - elapsedTime).toFixed(2)} minutes`
											: 'Maximum training time reached'}
								</Text>
								{status === 'TRAINING' &&
									trainProgress >= 100 && (
										<Alert
											message="Time limit reached"
											description="Training has reached the maximum time limit and will complete soon."
											type="warning"
											showIcon
											style={{ marginTop: '8px' }}
										/>
									)}
							</div>
						</Col>
					)}
				</Row>
			</Space>
		</Card>
	)
}

// Main Component
const Training = () => {
	const { projectInfo, updateFields } = useOutletContext()
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const experimentName = searchParams.get('experimentName')
	const [trainingInfo, setTrainingInfo] = useState({
		latestEpoch: 0,
		accuracy: 0,
	})
	const [chartData, setChartData] = useState([])
	const [startTime, setStartTime] = useState(null)
	const [elapsedTime, setElapsedTime] = useState(0)
	const [status, setStatus] = useState('PENDING')
	const [loading, setLoading] = useState(true)
	const [maxTrainingTime, setMaxTrainingTime] = useState(null)
	const metricExplain = projectInfo.metrics_explain
	const [trainProgress, setTrainProgress] = useState(0)

	// Handle view results button click
	const handleViewResults = () => {
		navigate(
			`/app/project/${projectInfo._id}/build/trainResult?experimentName=${experimentName}`
		)
	}

	// Calculate elapsed time based on current time and start time
	const calculateElapsedTime = (startTimeValue) => {
		if (!startTimeValue) return 0

		const currentTime = new Date()
		return ((currentTime - startTimeValue) / (1000 * 60)).toFixed(2)
	}

	// Update elapsed time on interval
	useEffect(() => {
		if (status === 'TRAINING' && startTime) {
			const timer = setInterval(() => {
				const elapsed = calculateElapsedTime(startTime)
				setElapsedTime(parseFloat(elapsed))

				if (maxTrainingTime) {
					const progress = Math.min(
						(parseFloat(elapsed) / maxTrainingTime) * 100,
						100
					)
					setTrainProgress(parseFloat(progress.toFixed(1)))
				}
			}, 1000)

			return () => clearInterval(timer)
		}
	}, [startTime, status, maxTrainingTime])

	// Utility Functions
	const updateChartData = (data) => {
		if (data.trainInfo.status === 'TRAINING') {
			if (!startTime) {
				setStartTime(new Date())
			}

			const currentElapsedTime = calculateElapsedTime(startTime)
			setElapsedTime(parseFloat(currentElapsedTime))

			setChartData((prev) => [
				...prev,
				{
					time: parseFloat(currentElapsedTime),
					accuracy: data.trainInfo.metrics.val_acc,
				},
			])
		}
	}

	useEffect(() => {
		let timeout
		const interval = setInterval(async () => {
			try {
				timeout = setTimeout(() => {
					clearInterval(interval)
				}, 60000)

				clearTimeout(timeout)
				setLoading(true)

				const res = await getExperiment(experimentName)

				console.log('res', res)
				if (res.status === 422 || res.status === 500) {
					clearInterval(interval)
					setLoading(false)
					return
				}

				if (res.status === 200) {
					setStatus(res.data.experiment.status)

					// Extract max_training_time from experiment properties if available
					if (
						res.data.experiment &&
						res.data.experiment.max_training_time
					) {
						setMaxTrainingTime(
							res.data.experiment.max_training_time / 60
						)

						if (startTime) {
							const currentElapsed =
								calculateElapsedTime(startTime)
							const progress = Math.min(
								(currentElapsed /
									(res.data.experiment.max_training_time /
										60)) *
									100,
								100
							)
							setTrainProgress(parseFloat(progress.toFixed(1)))
						}
					}

					if (res.data.experiment.status === 'DONE') {
						clearInterval(interval)
						updateFields({
							trainingInfo,
							elapsedTime: calculateElapsedTime(startTime),
						})
						// Save final data before redirecting
						if (res.data.trainInfo) {
							setTrainingInfo({
								latestEpoch:
									res.data.trainInfo.latest_epoch || 0,
								accuracy:
									res.data.trainInfo.metrics.val_acc || 0,
							})
						}
						setTrainProgress(100)
					} else if (res.data.trainInfo.status === 'TRAINING') {
						setTrainingInfo({
							latestEpoch: res.data.trainInfo.latest_epoch || 0,
							accuracy: res.data.trainInfo.metrics.val_acc || 0,
						})

						// Ensure startTime is set once at the beginning
						setStartTime(
							(prevStartTime) => prevStartTime || new Date()
						)
						updateChartData(res.data)

						// Check if training time has exceeded the limit
						const currentElapsedTime =
							calculateElapsedTime(startTime)
						if (
							maxTrainingTime &&
							currentElapsedTime >= maxTrainingTime
						) {
							console.log('Training time limit reached')
						}
					}
				}
				setLoading(false)
			} catch (err) {
				clearInterval(interval)
				setLoading(false)
			}
		}, 5000)

		return () => {
			clearInterval(interval)
			clearTimeout(timeout)
		}
	}, [experimentName, startTime, maxTrainingTime, projectInfo._id])

	// Create chart data with time limit reference line
	const enhancedChartData = React.useMemo(() => {
		if (!maxTrainingTime || chartData.length === 0) return chartData

		// Add a threshold reference that can be used for visual cues
		return chartData.map((point) => ({
			...point,
			threshold: point.time <= maxTrainingTime ? null : 0,
		}))
	}, [chartData, maxTrainingTime])

	return (
		<div className="p-4">
			<animated.div
				style={useSpring({
					from: { opacity: 0, transform: 'translateY(20px)' },
					to: { opacity: 1, transform: 'translateY(0)' },
					config: { tension: 280, friction: 20 },
				})}
			>
				<Space
					direction="vertical"
					size="large"
					style={{ width: '100%' }}
				>
					<TrainingInfoCard
						experimentName={experimentName}
						trainingInfo={trainingInfo}
						elapsedTime={elapsedTime}
						status={status}
						maxTrainingTime={maxTrainingTime}
						onViewResults={handleViewResults}
						trainProgress={trainProgress}
					/>

					<Card
						title={
							<Title level={5}>
								<LineChartOutlined /> Accuracy Trend
							</Title>
						}
						className="shadow-md hover:shadow-lg transition-shadow duration-300"
						extra={
							maxTrainingTime ? (
								<Tag
									color="orange"
									icon={<HourglassOutlined />}
								>
									Time Limit: {maxTrainingTime} min
								</Tag>
							) : null
						}
					>
						<EnhancedLineGraph
							data={enhancedChartData}
							loading={loading && chartData.length === 0}
							maxTrainingTime={maxTrainingTime}
						/>

						{maxTrainingTime && status === 'TRAINING' && (
							<div className="mt-4">
								<Alert
									type={
										elapsedTime >= maxTrainingTime
											? 'warning'
											: 'info'
									}
									message={
										elapsedTime >= maxTrainingTime
											? 'Training Time Limit Reached'
											: 'Training Time Limit'
									}
									description={
										elapsedTime >= maxTrainingTime
											? 'The training has reached its maximum allocated time. It may automatically stop soon.'
											: `This experiment is configured to run for maximum ${maxTrainingTime} minutes.`
									}
									showIcon
								/>
							</div>
						)}
					</Card>

					<Alert
						description={
							<div>
								<Paragraph>
									<RadarChartOutlined className="mr-2" />
									<Text strong>Understand Metrics:</Text>{' '}
									{metricExplain}
								</Paragraph>

								{maxTrainingTime && (
									<Paragraph>
										<Tooltip title="Time constraints can affect model performance">
											<HourglassOutlined className="mr-2" />
											<Text strong>
												Training Time Limit:
											</Text>{' '}
											This experiment has a maximum
											training time of {maxTrainingTime}{' '}
											minutes. If the training doesn't
											converge within this time, consider
											adjusting model complexity or
											training parameters.
										</Tooltip>
									</Paragraph>
								)}
							</div>
						}
						type="info"
					/>
				</Space>
			</animated.div>
		</div>
	)
}

export default Training
