import { memo } from 'react'

const Pagination = (props) => {
	const { currentPage, totalPages, onChange } = props
	return (
		<>
			<nav className="flex mx-auto items-center justify-between mt-6 mb-6 px-4 sm:px-0 w-full">
				<div className="flex w-0 flex-1 !select-none ml-6">
					<a
						onClick={() => {
							if (currentPage > 1) {
								onChange(currentPage - 1)
							}
						}}
						className={`${
							currentPage === 1 ? 'hidden' : ''
						} bg-[#f0f8ff] text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#FFE4E1] transition-colors duration-300`}
					>
						Previous
					</a>
				</div>
				<div className="hidden md:flex select-none space-x-2">
					{Array.from({ length: totalPages }).map((item, index) => {
						if (
							index < 3 ||
							index > totalPages - 4 ||
							currentPage === index + 1
						) {
							return (
								<a
									onClick={() => onChange(index + 1)}
									key={`index${'-' + index}`}
									className={`${
										index + 1 === currentPage
											? ' text-blue-500 font-semibold text-lg'
											: 'border-transparent text-gray-500'
									} cursor-pointer hover:font-semibold inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium transition-all duration-300 ease-in-out hover:text-blue-600`}
								>
									{index + 1}
								</a>
							)
						}

						if (
							index + 1 === currentPage - 1 ||
							index + 1 === currentPage + 1 ||
							(currentPage < 4 && index + 1 === 4) ||
							(currentPage > totalPages - 3 &&
								index + 1 === totalPages - 3)
						) {
							return (
								<span
									key={`index${index + '-index'}`}
									className="text-gray-400 inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium"
								>
									...
								</span>
							)
						}

						return null
					})}
				</div>
				<div className=" flex flex-1 justify-end mr-8">
					<a
						onClick={() => {
							if (currentPage < totalPages) {
								onChange(currentPage + 1)
							}
						}}
						className={`${
							currentPage === totalPages ? 'hidden' : ''
						} bg-[#f0f8ff] text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#FFE4E1] transition-colors duration-300`}
					>
						Next
					</a>
				</div>
			</nav>
		</>
	)
}
export default memo(Pagination)
