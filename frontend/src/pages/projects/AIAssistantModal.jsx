import React, { useState, useEffect } from 'react'
import {
	Modal,
	Button,
	Tag,
	Space,
	Tooltip,
	Typography,
	Input,
	Spin,
} from 'antd'
import {
	PaperClipOutlined,
	SendOutlined,
	DatabaseOutlined,
	PlayCircleOutlined,
	PlusCircleOutlined,
	ReloadOutlined,
	RobotOutlined,
} from '@ant-design/icons'
import MarkdownRenderer from 'src/components/MarkdownRenderer'
import logoIcon from 'src/assets/images/logoIcon.png'

const { TextArea } = Input
const { Title, Paragraph } = Typography

const ChatMessage = ({ message, role }) => {
	const isUser = role === 'user'

	return (
		<div
			className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
		>
			{!isUser && (
				<div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 self-end">
					<img src={logoIcon} alt="Assistant" />
				</div>
			)}
			<div
				className={`max-w-[70%] pl-2 pr-2 rounded-xl relative
                    ${
						isUser
							? 'bg-blue-600 text-white rounded-tr-none'
							: 'bg-gray-100 text-black rounded-tl-none'
					}
                `}
			>
				{message.content === 'loading...' ? (
					<div className="flex items-center justify-center p-4">
						<Spin size="small" />
					</div>
				) : (
					<MarkdownRenderer markdownText={message.content} />
				)}
			</div>
		</div>
	)
}

const AIAssistantModal = ({
	open,
	onCancel,
	messages,
	showTitle,
	showChatbotButtons,
	input,
	setInput,
	handleKeyPress,
	selectedDataset,
	datasets,
	getDatasets,
	newChat,
	proceedFromChat,
	chatContainerRef,
	setShowTitle,
	setMessages,
	setShowChatbotButtons,
	isLoading = false,
}) => {
	const [showCreateButton, setShowCreateButton] = useState(false)

	useEffect(() => {
		if (messages.length > 0) {
			const lastAssistantMessage = messages
				.filter((m) => m.role === 'assistant')
				.pop()
			if (
				lastAssistantMessage &&
				lastAssistantMessage.content.length > 300
			) {
				setShowCreateButton(true)
			} else {
				setShowCreateButton(false)
			}
		}
	}, [messages])

	return (
		<Modal
			open={open}
			onCancel={onCancel}
			footer={null}
			width={1000}
			centered
			maskClosable={false} // Prevents closing when clicking outside
			keyboard={false} // Prevents closing when pressing Esc
			styles={{
				body: {
					padding: 0,
					borderRadius: '12px',
					overflow: 'hidden',
				},
			}}
		>
			<div className="flex flex-col h-[650px] mt-6">
				{/* Chat Container */}
				<div
					ref={chatContainerRef}
					className="flex-1 overflow-auto p-4 space-y-4 relative"
				>
					{showTitle ? (
						<div className="text-center my-12 space-y-4">
							<RobotOutlined className="text-6xl text-blue-600 mb-4" />
							<Title level={2}>How can I help with?</Title>
						</div>
					) : (
						<div>
							{messages.map((message, index) => (
								<ChatMessage
									key={index}
									message={message}
									role={message.role}
								/>
							))}

							{isLoading && (
								<div className="flex justify-center my-4">
									<Spin
										size="large"
										tip="Generating response..."
									/>
								</div>
							)}
						</div>
					)}

					{showChatbotButtons && showCreateButton && (
						<div className="flex justify-center space-x-4 mt-6">
							<Button
								icon={<PlayCircleOutlined />}
								onClick={proceedFromChat}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								Create Now
							</Button>
						</div>
					)}
				</div>

				{/* Input Section */}
				<div className="bg-white mb-2">
					{selectedDataset && (
						<Tag
							color="blue"
							icon={<DatabaseOutlined />}
							className="mb-2"
						>
							{datasets[selectedDataset].title}
						</Tag>
					)}

					<div className="flex space-x-2">
						<div className="">
							<Button
								icon={<PlusCircleOutlined />}
								onClick={newChat}
								className="text-blue-600 hover:bg-blue-700"
							>
								New
							</Button>
						</div>
						<TextArea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Describe your project goals..."
							autoSize={{ minRows: 1, maxRows: 6 }}
							className="flex-1"
						/>

						<Space>
							<Tooltip title="Attach dataset">
								<Button
									type="text"
									icon={<PaperClipOutlined />}
									onClick={getDatasets}
								/>
							</Tooltip>
							<Button
								className="bg-blue-600 text-white hover:bg-blue-700"
								icon={<SendOutlined />}
								onClick={() => {
									if (input.trim()) {
										setShowTitle(false)
										setShowChatbotButtons(true)
										setMessages([
											...messages,
											{
												role: 'user',
												content: input,
											},
											{
												role: 'assistant',
												content: 'loading...',
											},
										])
										setInput('')
									}
								}}
							></Button>
						</Space>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default AIAssistantModal
