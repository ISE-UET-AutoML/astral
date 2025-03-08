import ModelCard from './card'
import { ModelIcon } from 'src/components/icons'
import { useEffect, useState } from 'react'
import { getModels } from 'src/api/project'
import { useParams } from 'react-router-dom'
import { Row, Col, Empty, Typography } from 'antd' // Use Ant Design components

const { Title, Text } = Typography

export default function ProjectModels() {
	const { id: projectId } = useParams()
	const [models, setModels] = useState([])

	const getListModels = async () => {
		const { data } = await getModels(projectId)
		setModels(data)
	}

	useEffect(() => {
		getListModels()
	}, [])

	return (
		<div className="mx-auto px-4">
			{/* Header Section */}
			<div className="flex justify-between items-center mb-4">
				<div>
					<Title level={2} style={{ marginBottom: 0 }}>
						Models
					</Title>
					{/* Meta Info */}
					<div className="mt-2 flex items-center space-x-2">
						<ModelIcon
							className="h-5 w-5 text-gray-400"
							aria-hidden="true"
						/>
						<Text type="secondary">{models.length} Models</Text>
					</div>
				</div>
			</div>

			{/* Models List */}
			{models.length > 0 ? (
				<Row gutter={[16, 16]}>
					{models.map((model) => (
						<Col key={model._id} xs={24} sm={12} md={8} lg={6}>
							<ModelCard model={model} />
						</Col>
					))}
				</Row>
			) : (
				<Empty
					image={
						<svg
							className="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								vectorEffect="non-scaling-stroke"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
							/>
						</svg>
					}
					description={
						<>
							<Text
								type="secondary"
								className="text-sm font-medium"
							>
								No Models
							</Text>
						</>
					}
				/>
			)}
		</div>
	)
}
