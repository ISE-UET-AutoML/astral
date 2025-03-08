import React from 'react'
import { Button, Typography, Tag } from 'antd'
import {
	DeleteOutlined,
	DatabaseOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { PATHS } from 'src/constants/paths'

dayjs.extend(relativeTime)

const { Text, Title } = Typography

const TAG_COLORS = {
	IMAGE_CLASSIFICATION: { bg: '#e6f4ff', text: '#1677ff', border: '#1677ff' },
	TEXT_CLASSIFICATION: { bg: '#f6ffed', text: '#52c41a', border: '#52c41a' },
	TABULAR_CLASSIFICATION: {
		bg: '#f9f0ff',
		text: '#722ed1',
		border: '#722ed1',
	},
	MULTIMODAL_CLASSIFICATION: {
		bg: '#fffbe6',
		text: '#faad14',
		border: '#faad14',
	},
	OBJECT_DETECTION: { bg: '#fff7e6', text: '#fa8c16', border: '#fa8c16' },
}

export default function DatasetCard({ dataset, getDatasets }) {
	const tagColor = TAG_COLORS[dataset?.type] || TAG_COLORS.other

	const handleCardClick = () => {
		window.location.href = PATHS.DATASET_VIEW(dataset?._id)
	}

	return (
		<div
			key={dataset._id}
			className="group relative rounded-xl bg-white shadow-md transition duration-300 hover:shadow-lg cursor-pointer"
			style={{
				border: `1px solid ${dataset.isLabeled ? '#e8e8e8' : '#faad14'}`,
				overflow: 'hidden',
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
			<div className="p-6 flex items-center">
				<div
					className="group rounded-[12px] p-3 ring-4 ring-white transition duration-450"
					style={{
						color: dataset.isLabeled ? '#1677ff' : '#faad14',
					}}
				>
					<DatabaseOutlined
						style={{
							fontSize: 48,
							transition: 'transform 0.3s ease',
						}}
						className="transition-transform "
					/>
				</div>

				<Button
					type="text"
					icon={
						<DeleteOutlined
							style={{ fontSize: 18, color: '#ff4d4f' }}
						/>
					}
					// onClick={(e) => handleDelete(e, dataset._id)}
					className="ml-auto hover:bg-red-100"
					style={{
						width: 48,
						height: 48,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: 12,
						backgroundColor: '#fff1f0',
						transition:
							'transform 0.2s ease, background-color 0.3s ease',
						zIndex: 1,
					}}
				/>
			</div>

			<div
				className="mt-5 p-6 rounded-xl transition duration-300"
				style={{
					backgroundColor: '#fafafa',
				}}
			>
				<div className="flex w-full justify-between items-center">
					<Title level={4} style={{ margin: 0, color: '#000000' }}>
						{dataset?.title}
					</Title>
					{dataset.createdAt && (
						<Text style={{ fontSize: 12, color: '#666666' }}>
							Created {dayjs(dataset.createdAt).fromNow()}
						</Text>
					)}
				</div>
				<div className="flex w-full justify-between items-center mt-2">
					<Text style={{ fontSize: 14, color: '#444444' }}>
						{dataset?.bucketName}
					</Text>
					<div className="flex items-center gap-2">
						<Tag
							style={{
								fontSize: 12,
								backgroundColor: tagColor.bg,
								color: tagColor.text,
								border: `1px solid ${tagColor.border}`,
							}}
						>
							{dataset?.type || 'Unknown Type'}
						</Tag>
						<Tag
							color={dataset.isLabeled ? 'success' : 'warning'}
							style={{ fontSize: 12 }}
						>
							{dataset.isLabeled ? 'Labeled' : 'Unlabeled'}
						</Tag>
					</div>
				</div>
			</div>
		</div>
	)
}
