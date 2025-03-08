import { CubeTransparentIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { PATHS } from 'src/constants/paths'
import { useNavigate } from 'react-router-dom' // For navigation
import { Tag, Typography } from 'antd' // Use Ant Design components

dayjs.extend(relativeTime)

const { Text, Title } = Typography

export default function ModelCard({ model }) {
	const { _id, name, isDeployed, createdAt, project_id, experimentID } = model
	const navigate = useNavigate() // Hook for navigation

	// Handle card click
	const handleCardClick = () => {
		navigate(
			isDeployed
				? PATHS.PREDICT(experimentID) // Tmp route
				: PATHS.PROJECT_TRAININGRESULT(project_id, experimentID)
		)
	}

	// Define status and color based on deployment status
	const status = isDeployed ? 'Deployed' : 'onCloud'
	const statusColor = isDeployed ? 'green' : 'blue'

	return (
		<div
			key={_id}
			className="relative group p-6 rounded-lg shadow cursor-pointer"
			style={{
				transition: 'transform 0.3s ease, box-shadow 0.3s ease',
			}}
			onClick={handleCardClick}
			onMouseEnter={(e) => {
				e.currentTarget.style.transform = 'translateY(-5px)'
				e.currentTarget.style.boxShadow =
					'0 4px 12px rgba(0, 0, 0, 0.1)'
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.transform = 'translateY(0)'
				e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
			}}
		>
			<div className="flex justify-between">
				<span
					style={{
						color: isDeployed ? '#52c41a' : '#1890ff',
						backgroundColor: isDeployed ? '#f6ffed' : '#e6f7ff',
						borderRadius: '12px',
						padding: '8px',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<CubeTransparentIcon
						className="h-6 w-6"
						aria-hidden="true"
					/>
				</span>
				<Tag
					color={statusColor}
					style={{ fontSize: 14, padding: '8px' }}
				>
					{status}
				</Tag>
			</div>
			<div className="mt-8">
				<div className="flex w-full justify-between items-center">
					<Title level={4} style={{ margin: 0, marginRight: 8 }}>
						{name}
					</Title>
				</div>
				{createdAt && (
					<Text type="secondary" style={{ fontSize: 12 }}>
						Created {dayjs(createdAt).fromNow()}
					</Text>
				)}
			</div>
		</div>
	)
}
