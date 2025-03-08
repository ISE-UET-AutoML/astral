import { useState } from 'react'
import Loading from 'src/components/Loading'
import PaginationNew from 'src/components/PaginationNew'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid'

const TextClassDataView = ({ dataset, files }) => {
	const [isLoading, setIsLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [selectedRows, setSelectedRows] = useState([])

	// Bỏ qua phần tử đầu tiên vì nó là header
	const actualFiles = Object.entries(files)
		.filter(([key]) => key !== 'length' && Number(key) > 0)
		.map(([_, value]) => value)
	// Get column names from the first file entry
	const colsName = Object.values(files[0] || {})

	const rowsPerPage = 18
	const totalPages = Math.ceil(actualFiles.length / rowsPerPage)
	const indexOfLastRow = currentPage * rowsPerPage
	const indexOfFirstRow = indexOfLastRow - rowsPerPage
	const currentRows = actualFiles.slice(indexOfFirstRow, indexOfLastRow)

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
				<table className="w-full table-fixed border-collapse">
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
							{colsName.map((col, index) => (
								<th
									key={index}
									className={`px-2 text-center truncate uppercase`}
								>
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
								<td className="w-12 px-2 text-center">
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
								<td className="px-6 text-sm text-gray-700 text-left">
									{row._0}
								</td>
								<td className="px-6 text-sm text-gray-700 text-center">
									{row._1}
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

export default TextClassDataView
