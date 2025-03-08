import React, { useState, useEffect } from 'react'
import 'src/assets/css/chart.css'
import * as experimentAPI from 'src/api/experiment'
import Papa from 'papaparse'
import PieGraph from 'src/components/PieGraph'

const TabularPredict = ({
	experimentName,
	projectInfo,
	predictDataState,
	updateProjState,
}) => {
	const [csvData, setCsvData] = useState([])
	const [features, setFeatures] = useState([])
	const [selectedIndexes, setSelectedIndexes] = useState([0])
	const [falsePredict, setFalsePredict] = useState([])
	const [isAllSelected, setIsAllSelected] = useState(false)
	const [pieData, setPieData] = useState([])
	const [isShowEff, setIsShowEff] = useState(false)

	useEffect(() => {
		if (
			predictDataState.uploadedFiles &&
			predictDataState.uploadedFiles[0].name.endsWith('.csv')
		) {
			const reader = new FileReader()

			reader.onload = () => {
				Papa.parse(reader.result, {
					header: true,
					skipEmptyLines: true,
					complete: ({ data }) => {
						setCsvData(data)

						if (data.length > 0) {
							setFeatures(Object.keys(data[0]))
						}
					},
				})
			}
			reader.readAsText(predictDataState.uploadedFiles[0])
		}
	}, [predictDataState.uploadedFiles])

	// Handling Pie Data
	useEffect(() => {
		const falseValue =
			csvData.length > 0
				? ((falsePredict.length / csvData.length) * 100).toFixed(2)
				: 0
		const trueValue = (100 - parseFloat(falseValue)).toFixed(2)

		setPieData([
			{ name: 'Correct', value: parseFloat(trueValue) },
			{ name: 'Incorrect', value: parseFloat(falseValue) },
		])
	}, [falsePredict, csvData])

	// If confidence score < 50% => false
	useEffect(() => {
		if (predictDataState.predictResult) {
			predictDataState.predictResult.map((row, index) => {
				if (row.confidence < 0.5 && !falsePredict.includes(index)) {
					setFalsePredict((prev) => [...prev, index])
				}
			})
		}
	}, [])

	const handleSelectAllChange = () => {
		if (isAllSelected) {
			setSelectedIndexes([]) // Deselect all
		} else {
			setSelectedIndexes(csvData.map((_, index) => index)) // Select all
		}
		setIsAllSelected(!isAllSelected) // Toggle state
	}

	const handleCheckboxChange = (index) => {
		setSelectedIndexes((prev) => {
			if (prev.includes(index)) {
				return prev.filter((i) => i !== index) // Remove index if already selected
			} else {
				return [...prev, index] // Add index to selected
			}
		})
	}

	const handleExplain = async (event) => {
		event.preventDefault()

		const formData = new FormData()

		updateProjState({
			isLoading: true,
		})

		if (selectedIndexes) {
			formData.append('data_path', predictDataState.predictFile.url)
			formData.append('row_indexes', selectedIndexes)
			formData.append('task', projectInfo.type)

			console.log('Fetching explain text')

			try {
				const { data } = await experimentAPI.explainData(
					experimentName,
					formData
				)

				console.log('data Explain', data)

				const hl =
					data.explanation[
						predictDataState.predictResult[selectedIndexes].class
					].features
				const highlightFeatures = hl.map((item) =>
					item.replace('data-VAL-', '')
				)

				csvData[selectedIndexes].highlight = highlightFeatures || []

				console.log('Fetch successful')

				updateProjState({ isLoading: false })
			} catch (error) {
				console.error('Fetch error:', error.message)
				updateProjState({ isLoading: false })
			}
		}
	}

	return (
		<>
			{/* HEADER */}
			<div className="mt-6 mb-6 flex">
				<h1 className=" text-5xl font-extrabold leading-none tracking-tight text-gray-900">
					Model{' '}
					<mark className="px-2 text-white bg-blue-600 rounded ">
						Prediction
					</mark>{' '}
					results
				</h1>
				{/* ACCURACY BUTTON */}
				<div className="rows-span-1 ml-auto mr-[30px] mt-2">
					<button
						type="button"
						onClick={() => {
							setIsShowEff(true)
						}}
						className="w-full h-full bg-blue-600 rounded-md text-xl px-2 py-1 font-medium  text-white transition-all hover:text-blue-600 hover:bg-white hover:border-2 hover:border-blue-600"
					>
						Accuracy
					</button>
				</div>
			</div>

			{csvData.length > 0 && (
				<div className="relative w-full max-h-[575px] overflow-y-auto  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
					{/* TABLE */}
					<table className=" min-w-full table-auto border-collapse overflow-hidden">
						<thead className="sticky top-0 z-10 bg-blue-600 text-white rounded-lg">
							<tr className="border-2">
								<th className="px-1 py-1 text-center w-[5%] ">
									<input
										type="checkbox"
										className="cursor-pointer"
										onChange={handleSelectAllChange}
										checked={isAllSelected}
									/>
								</th>
								{csvData.length > 0 &&
									features.map((key) => (
										<th
											key={key}
											className="px-2 py-2 text-center"
										>
											{key}
										</th>
									))}
								<th className="px-2 py-3 text-center">Label</th>
								<th className="px-2 py-3 text-center">
									Confidence
								</th>
								<th className="px-2 py-3 text-center">
									Accurate
								</th>
							</tr>
						</thead>

						<tbody>
							{csvData.map((row, index) => (
								<tr
									key={index}
									className="hover:bg-gray-100 border-2 border-solid"
								>
									<td className="px-2 py-3 text-center">
										<input
											type="checkbox"
											className="cursor-pointer"
											onChange={() =>
												handleCheckboxChange(index)
											}
											checked={selectedIndexes.includes(
												index
											)}
										/>
									</td>
									{features.map((feature, i) => (
										<td
											key={i}
											className={`px-6 py-4 text-sm font-medium text-gray-900 text-center ${
												row.highlight &&
												row.highlight.includes(feature)
													? 'bg-yellow-200 font-bold'
													: ''
											}`}
										>
											{row[feature]}
										</td>
									))}
									<td
										key={`label-${index}`}
										className="px-2 py-3 text-sm font-bold text-[#FF5733] text-center"
									>
										{predictDataState.predictResult[index]
											?.class || 'N/A'}
									</td>
									<td
										key={`confidence-${index}`}
										className="px-2 py-3 text-sm font-bold text-[#FF5733] text-center"
									>
										{predictDataState.predictResult[index]
											?.confidence || 'N/A'}
									</td>
									<td
										key={`accurate-${index}`}
										className="px-2 py-3 text-center"
									>
										<button
											className={`rounded-md px-2 py-1 font-medium text-white w-fit transition-all ${
												!falsePredict.includes(index)
													? 'bg-emerald-400 hover:text-emerald-400 hover:bg-white hover:border-2 hover:border-emerald-400'
													: 'bg-red-500 hover:text-red-400 hover:bg-white hover:border-2 hover:border-red-400'
											}`}
											onClick={() => {
												if (
													falsePredict.includes(index)
												) {
													setFalsePredict((prev) =>
														prev.filter(
															(item) =>
																item !== index
														)
													)
												} else {
													setFalsePredict((prev) => [
														...prev,
														index,
													])
												}
											}}
										>
											{falsePredict.includes(index)
												? 'Incorrect'
												: 'Correct'}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<div className="justify-center flex w-full items-center mt-5">
				<button className="btn" onClick={handleExplain}>
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

					<span className="text">Explain Selected Row</span>
				</button>
			</div>
			{isShowEff && (
				<div className="overlay">
					<div className="modal w-[50%] h-[75%] rounded-xl relative">
						<h1 className=" mt-6 text-4xl font-extrabold leading-none tracking-tight text-gray-900">
							Accuracy
						</h1>
						<button
							onClick={() => {
								setIsShowEff(false)
							}}
							className="absolute top-[0.55rem] right-5 p-[6px] rounded-full bg-red-400 hover:bg-gray-300 hover:text-white font-[600] w-[40px] h-[40px]"
						>
							<svg
								className=""
								focusable="false"
								viewBox="0 0 24 24"
								color="#FFFFFF"
								aria-hidden="true"
								data-testId="close-upload-media-dialog-btn"
							>
								<path d="M18.3 5.71a.9959.9959 0 00-1.41 0L12 10.59 7.11 5.7a.9959.9959 0 00-1.41 0c-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"></path>
							</svg>
						</button>
						<PieGraph data={pieData} />
					</div>
				</div>
			)}
		</>
	)
}

export default TabularPredict
