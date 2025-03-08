import React, { useEffect, useState } from 'react'
import config from './config'
import { useParams } from 'react-router-dom'
import * as datasetAPI from 'src/api/dataset'

const DatasetView = () => {
	const { id } = useParams()
	const [dataset, setDataset] = useState(null)
	const [files, setFiles] = useState(null)

	useEffect(() => {
		const fetchDataset = async () => {
			try {
				const { data } = await datasetAPI.getDataset(id)

				console.log('Dataset Response', data)
				setDataset(data.dataset)
				setFiles(data.files)
			} catch (error) {
				console.error('Failed to fetch dataset:', error)
			}
		}

		if (id) {
			fetchDataset()
		}
	}, [])

	if (dataset && files) {
		const ViewComponent = config[dataset.type].datasetView

		return <ViewComponent dataset={dataset} files={files} />
	}

	return <></>
}

export default DatasetView
