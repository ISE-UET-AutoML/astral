import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useOutletContext, useNavigate } from 'react-router-dom'
import {
	Steps,
	Card,
	Row,
	Col,
	Alert,
	Typography,
	Space,
	Statistic,
	Button,
	Badge,
	Tag,
	message,
	Progress,
	Timeline,
	Spin,
	Tooltip,
	Divider,
	Input,
	Modal,
	List,
} from 'antd'
import {
	RocketOutlined,
	ApiOutlined,
	DatabaseOutlined,
	ThunderboltOutlined,
	CloudDownloadOutlined,
	SettingOutlined,
	UploadOutlined,
	LineChartOutlined,
	LoadingOutlined,
	CheckCircleOutlined,
	InfoCircleOutlined,
	CloudServerOutlined,
	CodeOutlined,
	NodeIndexOutlined,
	SyncOutlined,
	CloudUploadOutlined,
	LinkOutlined,
	ExpandAltOutlined,
	CheckOutlined,
	ClockCircleOutlined,
} from '@ant-design/icons'
import { useSpring, animated } from '@react-spring/web'
import { validateFiles } from 'src/utils/file'
import * as experimentAPI from 'src/api/experiment'
import config from './config'

const { Step } = Steps
const { Title, Text, Paragraph } = Typography

const AnimatedCard = ({ children, onClick, isSelected }) => {
	const [isHovered, setIsHovered] = useState(false)
	const styles = useSpring({
		transform: isHovered ? 'scale(1.02)' : 'scale(1)',
		boxShadow: isHovered
			? '0 8px 16px rgba(0,0,0,0.1)'
			: '0 2px 8px rgba(0,0,0,0.05)',
		borderWidth: '2px',
		borderStyle: 'solid',
		borderColor: isSelected ? '#1890ff' : isHovered ? '#40a9ff' : '#f0f0f0',
		config: { tension: 300, friction: 20 },
	})

	return (
		<animated.div
			style={{
				...styles,
				borderRadius: '8px',
				cursor: 'pointer',
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={onClick}
		>
			{children}
		</animated.div>
	)
}
const AnimatedProgressBar = ({ percent, title, subtitle, color }) => {
	return (
		<Card
			style={{
				marginBottom: '16px',
				background: `linear-gradient(to right, ${color}10, ${color}05)`,
				border: `1px solid ${color}30`,
				borderRadius: '8px',
			}}
		>
			<Space direction="vertical" style={{ width: '100%' }}>
				<Space align="center" style={{ marginBottom: '4px' }}>
					<Text strong>{title}</Text>
					<Text type="secondary" style={{ fontSize: '12px' }}>
						{subtitle}
					</Text>
				</Space>
				<Progress
					percent={percent}
					status="active"
					strokeColor={{
						'0%': color,
						'100%': color + 'aa',
					}}
					trailColor={color + '20'}
				/>
			</Space>
		</Card>
	)
}

const DeployView = () => {
	const { projectInfo } = useOutletContext()
	const navigate = useNavigate()

	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const experimentName = searchParams.get('experimentName')
	const [isDeploying, setIsDeploying] = useState(false)
	const [selectedOption, setSelectedOption] = useState('')
	const [currentStep, setCurrentStep] = useState(0)
	const [instanceURL, setInstanceURL] = useState(null)
	const [predictResult, setPredictResult] = useState(null)
	const [uploadedFiles, setUploadedFiles] = useState(null)
	const [isComplete, setIsComplete] = useState(false)

	// Added for enhanced UI
	const [shouldStopSimulation, setShouldStopSimulation] = useState(false)
	const [setupProgress, setSetupProgress] = useState(0)
	const [configProgress, setConfigProgress] = useState(0)
	const [optimizationProgress, setOptimizationProgress] = useState(0)
	const [networkProgress, setNetworkProgress] = useState(0)
	const [currentAction, setCurrentAction] = useState(
		'Initializing deployment environment'
	)
	const [deploymentLogs, setDeploymentLogs] = useState([])
	const [selectedDeployOption, setSelectedDeployOption] = useState(null)

	// For detailed progress modal
	const [completedTasks, setCompletedTasks] = useState([])
	const [currentTaskIndex, setCurrentTaskIndex] = useState(0)

	const deploySteps = [
		{
			icon: <SettingOutlined style={{ fontSize: '24px' }} />,
			title: 'Setting Up',
		},
		{
			icon: <SettingOutlined style={{ fontSize: '24px' }} />,
			title: 'Serving',
		},
		{
			icon: <LineChartOutlined style={{ fontSize: '24px' }} />,
			title: 'Prediction Result',
		},
	]

	const deployOptions = [
		{
			id: 'realtime',
			title: 'Realtime Inference',
			description: 'Deploy for immediate, real-time predictions',
			icon: (
				<ThunderboltOutlined
					style={{ fontSize: '32px', color: '#faad14' }}
				/>
			),
			tags: ['Low Latency', 'High Availability', 'Auto Scaling'],
			stats: {
				latency: '< 100ms',
				uptime: '99.99%',
				scalability: 'Automatic',
			},
			color: '#faad14',
			badge: 'RECOMMENDED',
		},
		{
			id: 'async',
			title: 'Asynchronous Processing',
			description: 'Optimal for handling large batch requests',
			icon: (
				<ApiOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
			),
			tags: ['High Throughput', 'Cost Effective', 'Durable'],
			stats: {
				throughput: '10K req/s',
				durability: '99.999%',
				cost: 'Medium',
			},
			color: '#52c41a',
		},
		{
			id: 'batch',
			title: 'Batch Transform',
			description: 'Process large datasets efficiently',
			icon: (
				<DatabaseOutlined
					style={{ fontSize: '32px', color: '#1890ff' }}
				/>
			),
			tags: ['Large Scale', 'Cost Optimized', 'Scheduled'],
			stats: {
				capacity: 'Unlimited',
				efficiency: '95%',
				schedule: 'Flexible',
			},
			color: '#1890ff',
		},
		{
			id: 'serverless',
			title: 'Serverless Deployment',
			description: 'Pay-per-use with zero infrastructure management',
			icon: (
				<CloudDownloadOutlined
					style={{ fontSize: '32px', color: '#722ed1' }}
				/>
			),
			tags: ['Zero Maintenance', 'Auto Scaling', 'Cost Efficient'],
			stats: {
				scaling: 'Automatic',
				maintenance: 'Zero',
				billing: 'Per Request',
			},
			color: '#722ed1',
		},
	]
	// Detailed deployment task structure
	const deploymentTasks = [
		{
			id: 'environment-setup',
			title: 'Environment Setup',
			description: 'Preparing the runtime environment for your model',
			icon: <CloudServerOutlined />,
			color: '#1890ff',
			progress: setupProgress,
			status:
				setupProgress === 100
					? 'completed'
					: setupProgress > 0
						? 'in-progress'
						: 'pending',
			setProgress: setSetupProgress,
			subtasks: [
				{
					id: 'init-vm',
					title: 'Initializing virtual machine',
					status: 'pending',
				},
				{
					id: 'config-network',
					title: 'Configuring network settings',
					status: 'pending',
				},
				{
					id: 'setup-security',
					title: 'Setting up security protocols',
					status: 'pending',
				},
				{
					id: 'verify-environment',
					title: 'Verifying environment configuration',
					status: 'pending',
				},
			],
		},
		{
			id: 'dependencies-installation',
			title: 'Dependencies Installation',
			description: 'Installing required packages and libraries',
			icon: <CodeOutlined />,
			color: '#52c41a',
			progress: configProgress,
			status:
				configProgress === 100
					? 'completed'
					: configProgress > 0
						? 'in-progress'
						: 'pending',
			setProgress: setConfigProgress,
			subtasks: [
				{
					id: 'fetch-manifest',
					title: 'Fetching package manifests',
					status: 'pending',
				},
				{
					id: 'install-core',
					title: 'Installing core libraries',
					status: 'pending',
				},
				{
					id: 'install-extras',
					title: 'Installing additional dependencies',
					status: 'pending',
				},
				{
					id: 'setup-env-vars',
					title: 'Setting up environment variables',
					status: 'pending',
				},
			],
		},
		{
			id: 'model-configuration',
			title: 'Model Configuration',
			description: 'Preparing your model for deployment',
			icon: <NodeIndexOutlined />,
			color: '#faad14',
			progress: optimizationProgress,
			status:
				optimizationProgress === 100
					? 'completed'
					: optimizationProgress > 0
						? 'in-progress'
						: 'pending',
			setProgress: setOptimizationProgress,
			subtasks: [
				{
					id: 'load-weights',
					title: 'Loading model weights',
					status: 'pending',
				},
				{
					id: 'configure-inference',
					title: 'Configuring inference parameters',
					status: 'pending',
				},
				{
					id: 'optimize-performance',
					title: 'Optimizing for performance',
					status: 'pending',
				},
				{
					id: 'validate-model',
					title: 'Validating model configuration',
					status: 'pending',
				},
			],
		},
		{
			id: 'api-endpoint-setup',
			title: 'API Endpoint Setup',
			description: 'Creating secure API endpoints for your model',
			icon: <LinkOutlined />,
			color: '#722ed1',
			progress: networkProgress,
			status:
				networkProgress === 100
					? 'completed'
					: networkProgress > 0
						? 'in-progress'
						: 'pending',
			setProgress: setNetworkProgress,
			subtasks: [
				{
					id: 'config-routes',
					title: 'Configuring API routes',
					status: 'pending',
				},
				{
					id: 'setup-auth',
					title: 'Setting up authentication',
					status: 'pending',
				},
				{
					id: 'enable-cors',
					title: 'Enabling CORS policies',
					status: 'pending',
				},
				{
					id: 'test-endpoint',
					title: 'Testing endpoint connectivity',
					status: 'pending',
				},
			],
		},
	]

	const startDeployment = async () => {
		if (!selectedOption) {
			message.error(
				'Please select a deployment option before proceeding.',
				5
			)
			return
		}

		if (!experimentName) {
			message.error('Experiment name is required.', 5)
			return
		}

		setIsDeploying(true)
		setCurrentStep(0)
		setShouldStopSimulation(false)

		// Reset all progress trackers
		setSetupProgress(0)
		setConfigProgress(0)
		setOptimizationProgress(0)
		setNetworkProgress(0)
		setCompletedTasks([])
		setCurrentTaskIndex(0)

		// Store the selected deployment option details for UI
		setSelectedDeployOption(
			deployOptions.find((option) => option.id === selectedOption)
		)

		// Add initial deployment log
		addDeploymentLog('Initializing deployment process', 'info')
		addDeploymentLog(
			`Selected deployment option: ${selectedOption}`,
			'info'
		)

		try {
			// Simulate different stages of deployment with progress updates
			simulateDeploymentProgress()

			const { data } = await experimentAPI.deployModel(
				experimentName,
				selectedOption
			)
			setInstanceURL(data.url)
			addDeploymentLog(
				`Deployment endpoint created: ${data.url}`,
				'success'
			)

			const interval = setInterval(async () => {
				try {
					const statusResponse =
						await experimentAPI.getDeployStatus(experimentName)
					const { deployInfo } = statusResponse.data

					if (deployInfo.status === 'ONLINE') {
						setIsComplete(true)
						clearInterval(interval)
						message.success('Deployment completed successfully!', 5)
						setCurrentStep(1)
						setShouldStopSimulation(true)
						setCurrentTaskIndex(deploymentTasks.length - 1)
						setCurrentAction('Deploy Completely')

						addDeploymentLog(
							'Deployment successfully completed',
							'success'
						)
						addDeploymentLog(
							'Model is now online and ready for predictions',
							'success'
						)
					} else {
						setCurrentStep(0)
					}
				} catch (err) {
					setIsDeploying(false)
					clearInterval(interval)
					message.error(
						'Error checking deployment status: ' + err.message,
						5
					)
					addDeploymentLog(
						`Deployment error: ${err.message}`,
						'error'
					)
				}
			}, 10000)
		} catch (error) {
			setIsDeploying(false)
			message.error('Failed to start deployment: ' + error.message, 5)
			addDeploymentLog(
				`Failed to start deployment: ${error.message}`,
				'error'
			)
		}
	}

	const handleCancel = () => {
		setIsDeploying(false)
		setSelectedOption('')
		setCurrentStep(0)
	}

	// For uploading predict files
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef(null)

	const handleUploadFiles = async (files) => {
		if (!instanceURL) {
			message.error('No deployment instance URL available')
			return
		}

		const validFiles = validateFiles(files, projectInfo.type)

		console.log('uploadedFiles', validFiles)
		setUploadedFiles(validFiles)
		setUploading(true)
		addDeploymentLog('Uploading files for prediction', 'info')

		const formData = new FormData()
		formData.append('task', projectInfo.type)

		Array.from(validFiles).forEach((file) => {
			formData.append('files', file)
			addDeploymentLog(`Processing file: ${file.name}`, 'info')
		})
		console.log('Fetch prediction start')

		try {
			const { data } = await experimentAPI.predictData(
				experimentName,
				formData
			)
			console.log('Fetch prediction successful', data)
			const { predictions } = data

			setPredictResult(predictions)
			setUploading(false)
			setCurrentStep(2)

			message.success('Success Predict', 3)
			addDeploymentLog('Prediction completed successfully', 'success')
		} catch (error) {
			message.error('Predict Fail', 3)
			addDeploymentLog(`Prediction failed: ${error.message}`, 'error')
			setUploading(false)
		}
	}

	const handleClick = () => {
		fileInputRef.current?.click()
	}

	const handleChange = (event) => {
		const files = event.target.files
		if (files && files.length > 0) {
			handleUploadFiles(files)
		}
	}

	// Helper function to add logs with timestamps
	const addDeploymentLog = (message, type = 'info') => {
		const timestamp = new Date().toLocaleTimeString()
		setDeploymentLogs((prev) => [...prev, { message, timestamp, type }])
	}

	// Function to update subtask status
	const updateSubtaskStatus = (taskId, subtaskId, newStatus) => {
		const updatedTasks = [...deploymentTasks]
		const taskIndex = updatedTasks.findIndex((task) => task.id === taskId)

		if (taskIndex !== -1) {
			const subtaskIndex = updatedTasks[taskIndex].subtasks.findIndex(
				(subtask) => subtask.id === subtaskId
			)

			if (subtaskIndex !== -1) {
				updatedTasks[taskIndex].subtasks[subtaskIndex].status =
					newStatus

				// If this is a completed task, add it to the completed tasks list
				if (newStatus === 'completed') {
					setCompletedTasks((prev) => [
						...prev,
						{
							taskId,
							subtaskId,
							title: updatedTasks[taskIndex].subtasks[
								subtaskIndex
							].title,
							timestamp: new Date().toLocaleTimeString(),
						},
					])
				}
			}
		}
	}

	// Simulate deployment progress for better visual feedback - SEQUENTIAL VERSION
	const simulateDeploymentProgress = () => {
		// Function to process a specific task
		const processTask = (taskIndex) => {
			if (taskIndex >= deploymentTasks.length || shouldStopSimulation) {
				return // All tasks are complete
			}

			const currentTask = deploymentTasks[taskIndex]
			const { id: taskId, subtasks, setProgress } = currentTask

			setCurrentTaskIndex(taskIndex)
			setCurrentAction(`${currentTask.title} in progress`)
			addDeploymentLog(
				`Starting ${currentTask.title.toLowerCase()}`,
				'info'
			)

			// Process each subtask sequentially
			let subtaskCounter = 0
			const processSubtask = () => {
				if (subtaskCounter >= subtasks.length || shouldStopSimulation) {
					// All subtasks for this task are complete or should stop
					if (!shouldStopSimulation) {
						setProgress(100)
						addDeploymentLog(
							`${currentTask.title} completed`,
							'success'
						)
						setTimeout(() => processTask(taskIndex + 1), 1000)
					}
					return
				}

				const subtask = subtasks[subtaskCounter]
				updateSubtaskStatus(taskId, subtask.id, 'in-progress')
				addDeploymentLog(`${subtask.title}`, 'info')

				// Calculate progress increment for this subtask
				const progressIncrement = 100 / subtasks.length

				// Simulate work on this subtask
				let progress = 0

				const incrementInterval = setInterval(() => {
					if (shouldStopSimulation) {
						clearInterval(incrementInterval)
						return
					}

					progress += Math.floor(Math.random() * 5) + 1

					const overallProgress = Math.min(
						subtaskCounter * progressIncrement +
							(progress * progressIncrement) / 100,
						100
					)
					setProgress(overallProgress)

					if (progress >= 100) {
						clearInterval(incrementInterval)
						updateSubtaskStatus(taskId, subtask.id, 'completed')
						subtaskCounter++
						if (!shouldStopSimulation) {
							setTimeout(processSubtask, 500)
						}
					}
				}, 500)
			}

			// Start processing subtasks for this task
			processSubtask()
		}

		// Start with the first task
		processTask(0)
	}

	return (
		<div style={{ margin: '0 auto' }}>
			{!isDeploying ? (
				<>
					<Card style={{ marginBottom: '24px' }}>
						<Row align="middle" style={{ marginBottom: '24px' }}>
							<Col span={24}>
								<Space align="center">
									<RocketOutlined
										style={{
											fontSize: '28px',
											color: '#1890ff',
										}}
									/>
									<Title level={3} style={{ margin: 0 }}>
										Deploy {experimentName}
									</Title>
								</Space>
								<Paragraph
									type="secondary"
									style={{
										margin: '16px 0 0',
										fontSize: '16px',
									}}
								>
									Choose your deployment option and launch
									your application with our optimized
									infrastructure
								</Paragraph>
							</Col>
						</Row>
						<Row gutter={[16, 16]}>
							{deployOptions.map((option) => (
								<Col xs={24} md={12} key={option.id}>
									<AnimatedCard
										isSelected={
											selectedOption === option.id
										}
										onClick={() =>
											setSelectedOption(option.id)
										}
									>
										<Card
											bordered={false}
											styles={{ padding: '24px' }}
										>
											<Space
												direction="vertical"
												size="middle"
												style={{ width: '100%' }}
											>
												<Row
													justify="space-between"
													align="middle"
												>
													<Space>
														<div
															style={{
																background: `${option.color}10`,
																padding: '12px',
																borderRadius:
																	'8px',
															}}
														>
															{option.icon}
														</div>
														<Title
															level={4}
															style={{
																margin: 0,
															}}
														>
															{option.title}
														</Title>
													</Space>
													{option.badge && (
														<Badge
															count={option.badge}
															style={{
																backgroundColor:
																	option.color,
																fontSize:
																	'12px',
															}}
														/>
													)}
												</Row>

												<Text
													type="secondary"
													style={{ fontSize: '14px' }}
												>
													{option.description}
												</Text>

												<Space wrap>
													{option.tags.map((tag) => (
														<Tag
															color={option.color}
															key={tag}
														>
															{tag}
														</Tag>
													))}
												</Space>

												<Row gutter={16}>
													{Object.entries(
														option.stats
													).map(([key, value]) => (
														<Col span={8} key={key}>
															<Statistic
																title={
																	key
																		.charAt(
																			0
																		)
																		.toUpperCase() +
																	key.slice(1)
																}
																value={value}
																valueStyle={{
																	fontSize:
																		'14px',
																	color: option.color,
																}}
															/>
														</Col>
													))}
												</Row>
											</Space>
										</Card>
									</AnimatedCard>
								</Col>
							))}
						</Row>
					</Card>

					<Row justify="center">
						<Space>
							<Button
								type="default"
								size="large"
								onClick={handleCancel}
							>
								Cancel
							</Button>
							<Button
								type="primary"
								size="large"
								style={{ fontWeight: 'bold' }}
								onClick={startDeployment}
								disabled={!selectedOption}
							>
								Deploy Now
							</Button>
						</Space>
					</Row>
				</>
			) : (
				<Card className="border-none">
					<Steps current={currentStep}>
						{deploySteps.map((step, index) => (
							<Step
								key={index}
								title={step.title}
								icon={
									currentStep === index ? (
										<LoadingOutlined />
									) : (
										step.icon
									)
								}
							/>
						))}
					</Steps>

					<div>
						{currentStep === 0 && (
							<div>
								<Row gutter={[24, 0]}>
									<Col xs={24} lg={14}>
										<Card
											title={
												<Space>
													<span className="text-lg font-bold">
														Deployment Progress
													</span>
												</Space>
											}
											className="deployment-progress-card"
											style={{
												height: '93%',
												marginTop: 20,
											}}
										>
											<Space
												direction="vertical"
												style={{ width: '100%' }}
											>
												<Title
													level={5}
													style={{ marginTop: '0' }}
												>
													{currentAction}
												</Title>

												<AnimatedProgressBar
													percent={setupProgress}
													title="Environment Setup"
													subtitle="Configuring server environment"
													color="#1890ff"
												/>

												<AnimatedProgressBar
													percent={configProgress}
													title="Dependencies Installation"
													subtitle="Installing required packages"
													color="#52c41a"
												/>

												<AnimatedProgressBar
													percent={
														optimizationProgress
													}
													title="Model Configuration"
													subtitle="Preparing model for inference"
													color="#faad14"
												/>

												<AnimatedProgressBar
													percent={networkProgress}
													title="API Setup"
													subtitle="Creating secure endpoints"
													color="#722ed1"
												/>
											</Space>
										</Card>
									</Col>

									<Col xs={24} lg={10}>
										<Card
											title={
												<Space>
													<CodeOutlined
														style={{
															color: '#1890ff',
														}}
													/>
													<span>Deployment Logs</span>
												</Space>
											}
											className="deployment-logs-card"
											style={{
												height: '93%',
												marginTop: 20,
											}}
										>
											<div
												style={{
													height: '500px',
													overflowY: 'auto',
													padding: '8px',
												}}
											>
												<Timeline
													mode="left"
													items={deploymentLogs.map(
														(log, index) => {
															let color =
																'#1890ff'
															let dot = (
																<InfoCircleOutlined />
															)

															if (
																log.type ===
																'success'
															) {
																color =
																	'#52c41a'
																dot = (
																	<CheckCircleOutlined />
																)
															} else if (
																log.type ===
																'error'
															) {
																color =
																	'#f5222d'
																dot = (
																	<InfoCircleOutlined />
																)
															}

															return {
																color: color,
																dot: dot,
																children: (
																	<>
																		<Text
																			style={{
																				fontSize:
																					'12px',
																				color: '#8c8c8c',
																			}}
																		>
																			{
																				log.timestamp
																			}
																		</Text>
																		<br />
																		<Text>
																			{
																				log.message
																			}
																		</Text>
																	</>
																),
															}
														}
													)}
												/>
											</div>
										</Card>
									</Col>
								</Row>
							</div>
						)}

						{currentStep === 1 && isComplete && (
							<Row
								gutter={[24, 24]}
								style={{ marginTop: '24px' }}
							>
								<Col span={24}>
									<Card
										title={
											<Space>
												<LinkOutlined
													style={{
														color: '#1890ff',
													}}
												/>
												<span>
													Endpoint Information
												</span>
											</Space>
										}
										style={{
											borderTop: '3px solid #1890ff',
										}}
									>
										<Row gutter={[24, 24]}>
											<Col xs={24} md={8}>
												<Statistic
													title="Endpoint Status"
													value="Active"
													valueStyle={{
														color: '#52c41a',
													}}
													prefix={
														<CheckCircleOutlined />
													}
												/>
											</Col>
											<Col xs={24} md={8}>
												<Statistic
													title="Response Time"
													value="75ms"
													valueStyle={{
														color: '#1890ff',
													}}
													prefix={
														<ThunderboltOutlined />
													}
												/>
											</Col>
											<Col xs={24} md={8}>
												<Statistic
													title="Success Rate"
													value="99.9%"
													valueStyle={{
														color: '#faad14',
													}}
													prefix={
														<CheckCircleOutlined />
													}
												/>
											</Col>

											<Col span={24}>
												<Divider orientation="left">
													API Endpoint URL
												</Divider>
												<div className="flex">
													<Input.Group compact>
														<Input
															style={{
																width: '30%',
															}}
															value={
																instanceURL ||
																'https://api.example.com/predict/model-123'
															}
															readOnly
														/>
														<Button
															type="primary"
															onClick={() => {
																navigator.clipboard
																	.writeText(
																		instanceURL ||
																			'https://api.example.com/predict/model-123'
																	)
																	.then(() =>
																		message.success(
																			'Copied to clipboard',
																			1
																		)
																	)
																	.catch(
																		(err) =>
																			message.err(
																				'Failed to copy',
																				1
																			)
																	)
															}}
														>
															Copy URL
														</Button>
													</Input.Group>

													<Space>
														<input
															type="file"
															multiple
															ref={fileInputRef}
															onChange={
																handleChange
															}
															className="hidden"
															accept=".csv,.txt,.json,.xlsx,.png,.jpg"
														/>
														<Button
															type="primary"
															onClick={
																handleClick
															}
															loading={uploading}
															icon={
																<CloudUploadOutlined />
															}
															size="large"
														>
															{uploading
																? 'Predicting...'
																: 'Upload Files to Predict'}
														</Button>
													</Space>
												</div>
											</Col>
										</Row>
									</Card>
								</Col>
							</Row>
						)}

						{currentStep === 2 && projectInfo && (
							<>
								{(() => {
									const object = config[projectInfo.type]
									if (object) {
										const PredictComponent =
											object.predictView
										return (
											<PredictComponent
												predictResult={predictResult}
												uploadedFiles={uploadedFiles}
												projectInfo={projectInfo}
											/>
										)
									}
									return null
								})()}
							</>
						)}
					</div>
				</Card>
			)}
		</div>
	)
}

export default DeployView
