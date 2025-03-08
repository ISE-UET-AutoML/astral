import { useState } from 'react'
import Loading from 'src/components/Loading'
import PaginationNew from 'src/components/PaginationNew'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid'

const TabularClassDataView = ({ dataset, files }) => {
	const [isLoading, setIsLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [selectedRows, setSelectedRows] = useState([])

	const rowsPerPage = 12
	const totalPages = Math.ceil(files.length / rowsPerPage)
	const indexOfLastRow = currentPage * rowsPerPage
	const indexOfFirstRow = indexOfLastRow - rowsPerPage
	const currentRows = files.slice(indexOfFirstRow, indexOfLastRow)

	console.log('files', files)
	const keys = Object.keys(files.tasks[0].data)
	const colsName = keys.map((key) =>
		key
			.replace('data-VAL-', '')
			.replace('label', files.project_info.original_label_column)
	)

	const isAllCurrentPageSelected =
		currentRows.length > 0 &&
		currentRows.every((row, index) =>
			selectedRows.includes(indexOfFirstRow + index)
		)

	const handleSelectAllChange = () => {
		if (isAllCurrentPageSelected) {
			const newSelectedRows = selectedRows.filter(
				(index) => index < indexOfFirstRow || index >= indexOfLastRow
			)
			setSelectedRows(newSelectedRows)
		} else {
			const currentPageIndexes = Array.from(
				{ length: currentRows.length },
				(_, i) => indexOfFirstRow + i
			)
			const newSelectedRows = [
				...selectedRows.filter(
					(index) =>
						index < indexOfFirstRow || index >= indexOfLastRow
				),
				...currentPageIndexes,
			]
			setSelectedRows(newSelectedRows)
		}
	}

	const handleRowCheckboxChange = (index) => {
		const actualIndex = indexOfFirstRow + index
		if (selectedRows.includes(actualIndex)) {
			setSelectedRows(selectedRows.filter((i) => i !== actualIndex))
		} else {
			setSelectedRows([...selectedRows, actualIndex])
		}
	}

	const handlePageChange = (pageNumber) => {
		setCurrentPage(pageNumber)
	}

	return (
		<div className="bg-white h-full w-full pl-2 pr-2 relative">
			{isLoading && <Loading />}
			<div className="w-full h-[4%] flex mb-2 justify-between items-center">
				<div className="text-sm text-gray-600">
					Selected: {selectedRows.length} rows
				</div>
				<div className="flex gap-2">
					<button className="bg-blue-200 rounded-md text-blue-700 hover:bg-[#FFDAB9] hover:text-[#FFFFFF]">
						<PlusIcon className="mx-auto flex-shrink-0 rounded-xl w-11 h-8 p-2" />
					</button>
					<button
						className="bg-blue-200 rounded-md text-blue-700 hover:bg-[#FFDAB9] hover:text-[#FFFFFF]"
						disabled={selectedRows.length === 0}
					>
						<TrashIcon className="mx-auto flex-shrink-0 rounded-xl w-11 h-8 p-2" />
					</button>
				</div>
			</div>
			<div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
				<table className="w-max table-fixed border-collapse">
					<thead className="sticky top-0 z-10 bg-blue-600 text-white">
						<tr className="border-2">
							<th className="w-12 px-1 py-1 text-center">
								<input
									type="checkbox"
									className="cursor-pointer"
									checked={isAllCurrentPageSelected}
									onChange={handleSelectAllChange}
								/>
							</th>
							{colsName.map((col) => (
								<th className=" max-w-[160px] px-2 py-3 text-center truncate">
									{col}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{currentRows.map((row, index) => (
							<tr
								key={index}
								className="hover:bg-gray-100 border-2 border-solid"
							>
								<td className="w-12 px-2 py-3 text-center">
									<input
										type="checkbox"
										className="cursor-pointer"
										checked={selectedRows.includes(
											indexOfFirstRow + index
										)}
										onChange={() =>
											handleRowCheckboxChange(index)
										}
									/>
								</td>

								{Object.keys(row.data)
									.filter((key) =>
										key.startsWith('data-VAL-')
									)
									.map((key) => (
										<td
											key={key}
											className=" max-w-[160px] px-6 py-2.5 text-sm text-gray-700 truncate text-center"
										>
											{row.data[key]}
										</td>
									))}
								<td className=" max-w-[160px] px-6 py-2.5 text-sm text-gray-700 truncate text-center">
									{row.data.label}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<PaginationNew
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={handlePageChange}
			/>
		</div>
	)
}

export default TabularClassDataView
