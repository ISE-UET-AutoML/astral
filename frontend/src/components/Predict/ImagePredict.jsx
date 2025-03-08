import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
	Typography,
	Image,
	Progress,
	Button,
	Card,
	Space,
	Modal,
	Badge,
	Alert,
	Divider,
	Spin,
	Statistic,
	Layout,
} from 'antd'
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	QuestionCircleOutlined,
	LeftOutlined,
	RightOutlined,
	UndoOutlined,
	BulbOutlined,
} from '@ant-design/icons'
import SolutionImage from 'src/assets/images/Solution.png'
import * as experimentAPI from 'src/api/experiment'

const { Title, Text, Paragraph } = Typography
const { Content } = Layout

const ImagePredict = ({ predictResult, uploadedFiles, projectInfo }) => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const experimentName = searchParams.get('experimentName')
	const [explainImageUrl, setExplainImageUrl] = useState(
		Array(uploadedFiles.length).fill(SolutionImage)
	)
	const [explanationModalVisible, setExplanationModalVisible] =
		useState(false)
	const [loadingExplanation, setLoadingExplanation] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [incorrectPredictions, setIncorrectPredictions] = useState([])
	const [statistics, setStatistics] = useState({
		correct: 0,
		incorrect: 0,
		accuracy: 0,
	})
	const [showExplanation, setShowExplanation] = useState(
		Array(uploadedFiles.length).fill(false)
	)

	// New state to track whether to show explanation or original image

	const handlePredictionToggle = (index) => {
		setIncorrectPredictions((prev) =>
			prev.includes(index)
				? prev.filter((i) => i !== index)
				: [...prev, index]
		)
	}

	const currentPrediction = predictResult[currentIndex] || {}
	// Thumbnail gallery
	const renderThumbnails = () => (
		<Space className="w-full overflow-x-auto py-4" size="small">
			{uploadedFiles.map((data, index) => (
				<Badge
					key={index}
					count={
						incorrectPredictions.includes(index) ? (
							<CloseCircleOutlined style={{ color: '#f5222d' }} />
						) : null
					}
				>
					<Image
						// src={data.name}
						src={URL.createObjectURL(data)}
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

	console.log('uploadFiles', uploadedFiles)

	// Initialize explanation images
	useEffect(() => {
		if (uploadedFiles.length > 0 && explainImageUrl.length === 0) {
			setExplainImageUrl(Array(uploadedFiles.length).fill(SolutionImage))
		}

		// Initialize incorrect predictions based on confidence
		const initialIncorrect = predictResult
			.map((result, idx) => (result.confidence < 0.5 ? idx : null))
			.filter((idx) => idx !== null)
		setIncorrectPredictions(initialIncorrect)
	}, [uploadedFiles])

	// Update statistics when predictions change
	useEffect(() => {
		const incorrect = incorrectPredictions.length
		const total = uploadedFiles.length
		setStatistics({
			correct: total - incorrect,
			incorrect,
			accuracy: total
				? (((total - incorrect) / total) * 100).toFixed(1)
				: 0,
		})
	}, [incorrectPredictions, uploadedFiles])

	const handleExplainSelectedImage = async (index) => {
		const formData = new FormData()
		setLoadingExplanation(true)

		formData.append('files', uploadedFiles[index])
		formData.append('task', projectInfo.type)

		try {
			const { data } = await experimentAPI.explainData(
				experimentName,
				formData
			)
			const base64ImageString = data.explanation
			const fetchedImageUrl = `data:image/jpeg;base64,${base64ImageString}`

			setExplainImageUrl((prev) => {
				const updatedArray = [...prev]
				updatedArray[index] = fetchedImageUrl
				return updatedArray
			})

			// Set this image to show explanation
			setShowExplanation((prev) => {
				const updatedArray = [...prev]
				updatedArray[index] = true
				return updatedArray
			})

			console.log('Fetch successful')
			setLoadingExplanation(false)
		} catch (error) {
			console.error('Fetch error:', error.message)
			setLoadingExplanation(false)
		}
	}

	// Function to toggle between original and explanation image
	const toggleExplanationView = (index) => {
		setShowExplanation((prev) => {
			const updatedArray = [...prev]
			updatedArray[index] = !updatedArray[index]
			return updatedArray
		})
	}

	const renderExplanationHelpModal = () => {
		return (
			<Modal
				title="Understanding AI Explanations"
				open={explanationModalVisible}
				onCancel={() => setExplanationModalVisible(false)}
				footer={[
					<Button
						key="close"
						onClick={() => setExplanationModalVisible(false)}
					>
						Close
					</Button>,
				]}
			>
				<Space
					direction="vertical"
					size="middle"
					style={{ width: '100%' }}
				>
					<Image
						src={explainImageUrl[currentIndex]}
						alt="AI Explanation"
						style={{ width: '100%' }}
					/>

					<Divider>How to Interpret</Divider>

					<Paragraph>
						The highlighted areas show the regions of the image that
						most influenced the AI's decision:
					</Paragraph>

					<ul>
						<li>
							<Text strong>Yellow/bright areas:</Text> These
							regions strongly support the predicted class
						</li>
					</ul>

					<Alert
						message="This is based on LIME (Local Interpretable Model-agnostic Explanations)"
						description="LIME works by modifying small parts of the image and observing how the prediction changes, helping identify which features the model relies on."
						type="info"
						showIcon
					/>
				</Space>
			</Modal>
		)
	}

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
							value={uploadedFiles.length}
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
							>{`Image ${currentIndex + 1} of ${uploadedFiles.length}`}</Text>
							<Button
								type="primary"
								icon={<RightOutlined />}
								disabled={
									currentIndex === uploadedFiles.length - 1
								}
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
							<Card
								title={
									<Space>
										<Text strong>
											{showExplanation[currentIndex]
												? 'Explanation View'
												: 'Original Image'}
										</Text>
										{explainImageUrl[currentIndex] !==
											SolutionImage && (
											<Button
												type="text"
												icon={<UndoOutlined />}
												onClick={() =>
													toggleExplanationView(
														currentIndex
													)
												}
												style={{
													backgroundColor: '#E6F7FF',
													color: '#0050B3',
												}} // Xanh nhạt và text xanh đậm
											>
												{showExplanation[currentIndex]
													? 'Show Original'
													: 'Show Explanation'}
											</Button>
										)}
									</Space>
								}
							>
								{loadingExplanation ? (
									<div
										style={{
											padding: '40px 0',
											textAlign: 'center',
										}}
									>
										<Spin tip="Generating explanation..." />
									</div>
								) : (
									<Image
										src={
											showExplanation[currentIndex] &&
											explainImageUrl[currentIndex] !==
												SolutionImage
												? explainImageUrl[currentIndex]
												: URL.createObjectURL(
														uploadedFiles[
															currentIndex
														]
													)
										}
										alt={
											showExplanation[currentIndex]
												? 'Explanation Image'
												: 'Original Image'
										}
										className="w-full object-contain"
									/>
								)}
							</Card>

							{/* Prediction Details */}
							<Card>
								<Space direction="vertical" className="w-full">
									<Title level={4}>Prediction Results</Title>
									<Alert
										message={
											<Space>
												<Text>
													{`Predicted Class:`}
												</Text>
												<Text
													strong
													style={{
														textTransform:
															'uppercase',
													}}
												>
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
									<div className="flex items-center">
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
												handlePredictionToggle(
													currentIndex
												)
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
										{/* Generate Explanation Button */}
										<Button
											type="primary"
											icon={<BulbOutlined />}
											onClick={() =>
												handleExplainSelectedImage(
													currentIndex
												)
											}
											loading={loadingExplanation}
											style={{ marginLeft: 'auto' }}
											disabled={
												explainImageUrl[
													currentIndex
												] !== SolutionImage
											}
										>
											{explainImageUrl[currentIndex] !==
											SolutionImage
												? 'Explanation Generated'
												: 'Generate Explanation'}
										</Button>
									</div>

									{/* AI Explanation Info */}
									<Card
										title="How to Interpret Explanations"
										size="small"
										style={{ marginTop: '16px' }}
									>
										<Space
											direction="vertical"
											size="small"
										>
											<Text>
												<Text strong>
													Yellow/bright areas:
												</Text>{' '}
												Regions that strongly support
												the predicted class
											</Text>
											<Text type="secondary">
												Based on LIME (Local
												Interpretable Model-agnostic
												Explanations) which identifies
												what features the model focused
												on.
											</Text>
											<Button
												type="link"
												onClick={() =>
													setExplanationModalVisible(
														true
													)
												}
											>
												Learn more
											</Button>
										</Space>
									</Card>

									{renderExplanationHelpModal()}
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

export default ImagePredict
