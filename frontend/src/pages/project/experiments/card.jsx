import React from 'react'
import { Tag, Typography } from 'antd'
import { ExperimentOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { PATHS } from 'src/constants/paths'
import { useNavigate } from 'react-router-dom'

dayjs.extend(relativeTime)

const { Text, Title } = Typography

// Define status colors
const statusColors = {
	DONE: 'green',
	PROCESSING: 'orange',
}

export default function ExperimentCard({ experiment }) {
	const { _id, name, status, createdAt, project_id } = experiment
	const navigate = useNavigate()

	// Handle card click
	const handleCardClick = () => {
		navigate(
			status === 'DONE'
				? PATHS.PROJECT_TRAININGRESULT(project_id, name)
				: PATHS.PROJECT_TRAINING(project_id, name)
		)
	}

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
						color: statusColors[status],
						backgroundColor:
							status === 'DONE' ? '#f6ffed' : '#e6f7ff',
						borderRadius: '12px',
						padding: '8px',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<ExperimentOutlined
						style={{ fontSize: 24, color: statusColors[status] }}
					/>
				</span>
				<Tag
					color={statusColors[status]}
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
