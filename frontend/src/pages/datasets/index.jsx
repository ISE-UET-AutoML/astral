import React, { useReducer, useEffect, useState } from 'react'
import { Button, Card, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import * as datasetAPI from 'src/api/dataset'
import DatasetCard from './card'
import CreateDatasetModal from './CreateDatasetModal'
import { PATHS } from 'src/constants/paths'

const { Title } = Typography

const initialState = {
	datasets: [],
	isLoading: false,
	showUploader: false,
}

export default function Datasets() {
	const [datasetState, updateDataState] = useReducer(
		(state, newState) => ({ ...state, ...newState }),
		initialState
	)

	const getDatasets = async () => {
		try {
			const response = await datasetAPI.getDatasets()
			updateDataState({ datasets: response.data })
		} catch (error) {
			console.error('Error fetching datasets:', error)
		}
	}

	const handleCreateDataset = async (formData) => {
		try {
			const response = await datasetAPI.createDataset(formData)
			if (response.status === 201) {
				updateDataState({ showUploader: false })
				window.location = PATHS.DATASET_VIEW(response.data._id)
			}
		} catch (error) {
			console.error('Error creating dataset:', error)
		}
	}

	useEffect(() => {
		getDatasets()
	}, [])

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<Title level={3}>Datasets</Title>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => updateDataState({ showUploader: true })}
				>
					New Dataset
				</Button>
			</div>

			{datasetState.datasets.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{datasetState.datasets.map((dataset) => (
						<DatasetCard key={dataset._id} dataset={dataset} />
					))}
				</div>
			) : (
				<Card className="text-center">
					<Title level={4}>No Datasets Found</Title>
					<p>Get started by creating a new dataset.</p>
				</Card>
			)}

			<CreateDatasetModal
				visible={datasetState.showUploader}
				onCancel={() => updateDataState({ showUploader: false })}
				onCreate={handleCreateDataset}
			/>
		</div>
	)
}
