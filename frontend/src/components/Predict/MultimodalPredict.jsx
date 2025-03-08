import React, { useState, useEffect } from 'react'
import {
	Card,
	Layout,
	Typography,
	Table,
	Button,
	Space,
	Image,
	Badge,
	Alert,
	Statistic,
	Progress,
} from 'antd'
import {
	LeftOutlined,
	RightOutlined,
	QuestionCircleOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
} from '@ant-design/icons'
import Papa from 'papaparse'

const { Title, Text } = Typography
const { Content } = Layout

const MultimodalPredict = ({ predictResult, uploadedFiles, projectInfo }) => {
	const [csvData, setCsvData] = useState([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [incorrectPredictions, setIncorrectPredictions] = useState([])
	const [statistics, setStatistics] = useState({
		correct: 0,
		incorrect: 0,
		accuracy: 0,
	})

	// Parse CSV and initialize data
	useEffect(() => {
		if (uploadedFiles?.[0]?.name.endsWith('.csv')) {
			const reader = new FileReader()
			reader.onload = () => {
				Papa.parse(reader.result, {
					header: true,
					skipEmptyLines: true,
					complete: ({ data }) => {
						setCsvData(data)
						// Initialize incorrect predictions based on confidence
						const initialIncorrect = predictResult
							.map((result, idx) =>
								result.confidence < 0.5 ? idx : null
							)
							.filter((idx) => idx !== null)
						setIncorrectPredictions(initialIncorrect)
					},
				})
			}
			reader.readAsText(uploadedFiles[0])
		}
	}, [uploadedFiles, predictResult])

	// Update statistics when predictions change
	useEffect(() => {
		const incorrect = incorrectPredictions.length
		const total = csvData.length
		setStatistics({
			correct: total - incorrect,
			incorrect,
			accuracy: total
				? (((total - incorrect) / total) * 100).toFixed(1)
				: 0,
		})
	}, [incorrectPredictions, csvData])

	const handlePredictionToggle = (index) => {
		setIncorrectPredictions((prev) =>
			prev.includes(index)
				? prev.filter((i) => i !== index)
				: [...prev, index]
		)
	}

	const currentPrediction = predictResult[currentIndex] || {}
	const currentData = csvData[currentIndex] || {}

	// Format data for the information table
	const getTableColumns = () => [
		{
			title: 'Field',
			dataIndex: 'field',
			key: 'field',
			width: '30%',
			render: (text) => (
				<Text strong>
					{text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}
				</Text>
			),
		},
		{
			title: 'Value',
			dataIndex: 'value',
			key: 'value',
			render: (text) => <Text copyable>{text}</Text>,
		},
	]

	const getTableData = () => {
		return Object.entries(currentData).map(([key, value]) => ({
			key,
			field: key,
			value: value,
		}))
	}

	// Thumbnail gallery
	const renderThumbnails = () => (
		<Space className="w-full overflow-x-auto py-4" size="small">
			{csvData.map((data, index) => (
				<Badge
					key={index}
					count={
						incorrectPredictions.includes(index) ? (
							<CloseCircleOutlined style={{ color: '#f5222d' }} />
						) : null
					}
				>
					<Image
						src={data[projectInfo.img_column]}
						alt={`Thumbnail ${index + 1}`}
						width={80}
						height={80}
						className={`object-cover cursor-pointer rounded-lg ${currentIndex === index ? 'border-4 border-blue-500' : 'opacity-60'}`}
						preview={false}
						onClick={() => setCurrentIndex(index)}
					/>
				</Badge>
			))}
		</Space>
	)

	return (
		<Layout className=" bg-white">
			<Content className="p-4">
				{/* Header with Statistics */}
				<Card
					size="small"
					className="mb-4 border-green-500 bg-green-50 border-dashed"
				>
					<Space
						size="large"
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<Statistic
							title="Total Predictions"
							value={csvData.length}
							prefix={<QuestionCircleOutlined />}
						/>
						<Statistic
							title="Correct Predictions"
							value={statistics.correct}
							prefix={
								<CheckCircleOutlined
									style={{ color: '#52c41a' }}
								/>
							}
						/>
						<Statistic
							title="Incorrect Predictions"
							value={statistics.incorrect}
							prefix={
								<CloseCircleOutlined
									style={{ color: '#f5222d' }}
								/>
							}
						/>
						<Statistic
							title="Accuracy"
							value={statistics.accuracy}
							suffix="%"
							precision={1}
						/>
					</Space>
				</Card>

				{/* Main Content */}
				<Card className="mb-6">
					<Space direction="vertical" size="large" className="w-full">
						{/* Navigation Controls */}
						<Space className="w-full justify-between">
							<Button
								type="primary"
								icon={<LeftOutlined />}
								disabled={currentIndex === 0}
								onClick={() =>
									setCurrentIndex((prev) => prev - 1)
								}
							>
								Previous
							</Button>
							<Text
								strong
							>{`Image ${currentIndex + 1} of ${csvData.length}`}</Text>
							<Button
								type="primary"
								icon={<RightOutlined />}
								disabled={currentIndex === csvData.length - 1}
								onClick={() =>
									setCurrentIndex((prev) => prev + 1)
								}
							>
								Next
							</Button>
						</Space>

						{/* Main Content Area */}
						<div className="grid grid-cols-2 gap-6">
							{/* Image Display */}
							<Card>
								<Image
									src={currentData[projectInfo.img_column]}
									alt="Prediction Image"
									className="w-full object-contain"
								/>
							</Card>

							{/* Prediction Details */}
							<Card>
								<Space direction="vertical" className="w-full">
									<Title level={4}>Prediction Results</Title>

									<Alert
										message={
											<Space>
												<Text>
													{`Predicted ${projectInfo.target_column}:`}
												</Text>
												<Text strong>
													{currentPrediction.class}
												</Text>
											</Space>
										}
										type={
											incorrectPredictions.includes(
												currentIndex
											)
												? 'error'
												: 'success'
										}
										showIcon
									/>

									<div>
										<Space className="w-full justify-between mb-2">
											<Text strong>Confidence Score</Text>
										</Space>
										<Progress
											percent={Math.round(
												currentPrediction.confidence *
													100
											)}
											status={
												currentPrediction.confidence >=
												0.5
													? 'success'
													: 'exception'
											}
											format={(percent) => `${percent}%`}
										/>
									</div>

									<Button
										type={
											incorrectPredictions.includes(
												currentIndex
											)
												? 'primary'
												: 'default'
										}
										danger={
											!incorrectPredictions.includes(
												currentIndex
											)
										}
										onClick={() =>
											handlePredictionToggle(currentIndex)
										}
										icon={
											incorrectPredictions.includes(
												currentIndex
											) ? (
												<CheckCircleOutlined />
											) : (
												<CloseCircleOutlined />
											)
										}
									>
										{incorrectPredictions.includes(
											currentIndex
										)
											? 'Mark as Correct'
											: 'Mark as Incorrect'}
									</Button>

									<Table
										columns={getTableColumns()}
										dataSource={getTableData()}
										size="small"
										pagination={false}
										scroll={{ y: 300 }}
									/>
								</Space>
							</Card>
						</div>

						{/* Thumbnail Gallery */}
						{renderThumbnails()}
					</Space>
				</Card>
			</Content>
		</Layout>
	)
}

export default MultimodalPredict
