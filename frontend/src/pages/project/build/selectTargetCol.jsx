import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import * as datasetAPI from 'src/api/dataset'
import * as projectAPI from 'src/api/project'
import { message } from 'antd'

const SelectTargetCol = (props) => {
	const [dataset, setDataset] = useState(null)
	const [colsName, setColsName] = useState([])
	const [selectedCol, setSelectedCol] = useState(null)
	const { id: projectID } = useParams()

	useEffect(() => {
		if (!props.selectedDataset?._id) return

		const fetchDataset = async () => {
			try {
				const { data } = await datasetAPI.getDatasetPreview(
					props.selectedDataset._id,
					12
				)

				// Xử lý dữ liệu để đảm bảo cấu trúc nhất quán
				const processedData = data.files.map((row) => {
					// Chuyển đổi các giá trị undefined/null thành chuỗi rỗng
					return Object.entries(row).reduce((acc, [key, value]) => {
						acc[key] = value ?? ''
						return acc
					}, {})
				})

				setDataset(processedData)

				// Lấy tất cả các key có thể có từ tất cả các hàng
				const allKeys = [...new Set(processedData.flatMap(Object.keys))]
				setColsName(allKeys)
			} catch (error) {
				console.error('Error fetching dataset:', error)
				message.error('Failed to load dataset preview')
			}
		}

		fetchDataset()
	}, [props.selectedDataset?._id])

	const sendTargetColumn = async () => {
		if (!selectedCol) return

		const textCols = colsName.filter((col) => col !== selectedCol)

		try {
			const formData = new FormData()
			formData.append('targetCol', selectedCol)
			formData.append('textCols', textCols)
			formData.append('datasetID', props.selectedDataset?._id)

			const res = await projectAPI.sendTargetColumn(projectID, formData)

			if (res.status === 200) {
				message.success('Target Column successfully set')
				props.updateFields({
					isDoneSelectTargetCol: true,
				})
			}
		} catch (error) {
			console.error('Error sending target column:', error)
			message.error('Failed to set target column')
		} finally {
		}
	}

	return (
		<>
			{dataset && (
				<div className="relative h-full flex flex-col p-4">
					<div className="flex">
						<h1 className="w-full text-center text-4xl font-bold">
							Choose Target Column
						</h1>
						<div className="flex justify-end">
							{selectedCol !== null && (
								<button
									className="btn"
									onClick={sendTargetColumn}
								>
									<svg
										height="24"
										width="24"
										fill="#FFFFFF"
										viewBox="0 0 24 24"
										data-name="Layer 1"
										id="Layer_1"
										className="sparkle"
									>
										<path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z"></path>
									</svg>
									<span className="text">Next</span>
								</button>
							)}
						</div>
					</div>

					<div className="flex-1 overflow-auto border mt-10 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
						<table className="w-full border-collapse border border-black">
							<thead className="sticky top-0 bg-blue-600">
								<tr>
									{colsName.map((col) => (
										<th
											key={col}
											onClick={() => setSelectedCol(col)}
											className={`
							px-4 py-3 text-left text-sm font-medium uppercase text-white cursor-pointer border border-black
							${selectedCol === col ? 'bg-blue-800' : ''}
						`}
										>
											{col}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="bg-white">
								{dataset.map((row, rowIndex) => (
									<tr
										key={rowIndex}
										className="hover:bg-gray-200 transition-colors"
									>
										{colsName.map((col) => (
											<td
												key={`${rowIndex}-${col}`}
												className={`px-4 py-2 text-sm text-gray-900 border border-black ${
													selectedCol === col
														? 'bg-blue-100'
														: ''
												}`}
												style={{
													maxWidth: '10%',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
												}}
											>
												<div title={row[col]}>
													{row[col]}
												</div>
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</>
	)
}

export default SelectTargetCol
