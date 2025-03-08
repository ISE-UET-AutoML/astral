import { useState } from 'react'
import Loading from 'src/components/Loading'
import PaginationNew from 'src/components/PaginationNew'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid'

const MultimodalClassDataView = ({ dataset, files }) => {
	// Bỏ qua phần tử đầu tiên vì nó là header
	const actualFiles = Object.entries(files)
		.filter(([key]) => key !== 'length' && Number(key) > 0)
		.map(([_, value]) => value)
	// Get column names from the first file entry
	const colsName = Object.values(files[0] || {})

	const [isLoading, setIsLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [selectedRows, setSelectedRows] = useState([])
	const rowsPerPage = 14

	const totalPages = Math.ceil(actualFiles.length / rowsPerPage)
	const indexOfLastRow = currentPage * rowsPerPage
	const indexOfFirstRow = indexOfLastRow - rowsPerPage
	const currentRows = actualFiles.slice(indexOfFirstRow, indexOfLastRow)

	// Kiểm tra xem tất cả các rows trong trang hiện tại đã được chọn chưa
	const isAllCurrentPageSelected =
		currentRows.length > 0 &&
		currentRows.every((row, index) =>
			selectedRows.includes(indexOfFirstRow + index)
		)

	// Xử lý chọn/bỏ chọn tất cả rows trong trang hiện tại
	const handleSelectAllChange = () => {
		if (isAllCurrentPageSelected) {
			// Bỏ chọn tất cả rows trong trang hiện tại
			const newSelectedRows = selectedRows.filter(
				(index) => index < indexOfFirstRow || index >= indexOfLastRow
			)
			setSelectedRows(newSelectedRows)
		} else {
			// Chọn tất cả rows trong trang hiện tại
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

	// Xử lý chọn/bỏ chọn một row
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
		<div className="bg-white h-full w-full pl-2 pr-2 relative overflow-y-hidden overflow-x-auto">
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
			<table className="min-w-full h-max border-collapse overflow-y-auto">
				<thead className="sticky top-0 z-10 bg-blue-600 text-white rounded-lg">
					<tr className="border-2">
						<th className="px-1 py-1 text-center w-[5%]">
							<input
								type="checkbox"
								className="cursor-pointer"
								checked={isAllCurrentPageSelected}
								onChange={handleSelectAllChange}
							/>
						</th>
						{colsName.map((col, index) => (
							<th key={index} className="px-2 py-3 text-center">
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
							<td className="px-2 py-2 text-center">
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
							{Object.entries(row).map(
								([key, value], colIndex) => (
									<td
										key={colIndex}
										className="min-w-[100px] px-2 text-center max-w-[200px] truncate"
										title={value}
									>
										{value}
									</td>
								)
							)}
						</tr>
					))}
				</tbody>
			</table>
			<PaginationNew
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={handlePageChange}
			/>
		</div>
	)
}

export default MultimodalClassDataView
