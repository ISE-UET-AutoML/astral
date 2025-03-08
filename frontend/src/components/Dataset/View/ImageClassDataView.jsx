import { useState } from 'react'
import Loading from 'src/components/Loading'
import PaginationNew from 'src/components/PaginationNew'
import { PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/solid'
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import database from 'src/assets/images/background.png'
import databaseList from 'src/assets/images/listData.png'
import { TYPES } from 'src/constants/types'
import { message } from 'antd'
import * as datasetAPI from 'src/api/dataset'
import { validateFiles } from 'src/utils/file'

const ImageClassDataView = ({ dataset, files }) => {
	const [selectedImgs, setSelectedImgs] = useState([])
	const [currentPage, setCurrentPage] = useState(1)
	const [imageFiles, setImageFiles] = useState(files)
	const [isUpload, setIsUpload] = useState(false)
	const [uploadedfiles, setUploadedFiles] = useState([])
	const [totalKbytes, setTotalKbytes] = useState(0)
	const [isLoading, setIsLoading] = useState(false)
	const imagesPerPage = 16

	// Calculate the indices for the current page
	const indexOfLastImage = currentPage * imagesPerPage
	const indexOfFirstImage = indexOfLastImage - imagesPerPage
	const currentImages = imageFiles.slice(indexOfFirstImage, indexOfLastImage)

	const totalPages = Math.ceil(imageFiles.length / imagesPerPage)

	const handlePageChange = (page) => {
		setCurrentPage(page)
	}

	const handleSelectImage = (index) => {
		if (selectedImgs.includes(index)) {
			setSelectedImgs(selectedImgs.filter((i) => i !== index))
		} else {
			setSelectedImgs([...selectedImgs, index])
		}
	}

	const handleSelectAll = () => {
		const allImageNames = imageFiles.map((file) => file.fileName)
		setSelectedImgs(allImageNames)
	}

	const handleDeselectAll = () => {
		setSelectedImgs([])
	}

	const handleFileChange = (event) => {
		if (dataset.type) {
			const files = Array.from(event.target.files) // Change FileList to Array
			const validatedFiles = validateFiles(files, dataset.type)

			const totalSize = files.reduce((sum, file) => sum + file.size, 0)
			const totalSizeInKB = (totalSize / 1024).toFixed(2)

			setUploadedFiles(validatedFiles)
			setTotalKbytes(totalSizeInKB)
		}
	}

	const handleDeleteFile = (webkitRelativePath) => {
		// Filter out the file with the matching webkitRelativePath

		const updatedFiles = uploadedfiles.filter(
			(file) => file.webkitRelativePath !== webkitRelativePath
		)
		setUploadedFiles(updatedFiles)
	}

	const uploadNewFiles = async (event) => {
		event.preventDefault()
		setIsLoading(true)

		const formData = new FormData()
		for (let i = 0; i < uploadedfiles.length; i++) {
			// Convert file name with relative path to base64 string
			let fileNameBase64 = window.btoa(
				uploadedfiles[i].webkitRelativePath
			)

			formData.append('files', uploadedfiles[i], fileNameBase64)
		}

		//TODO: change status code if necessary
		try {
			const response = await datasetAPI.addNewFiles(dataset._id, formData)
			if (response.status === 201) {
				setIsLoading(false)
				message.success('Successfully Add new Files', 3)
			}
		} catch (error) {
			setIsLoading(false)
			message.error('Add new Files Fail', 3)
		}
	}

	const handleDeleteImage = async () => {
		console.log('selected Image', selectedImgs)

		const formData = new FormData()
		formData.append('objects', JSON.stringify(selectedImgs))
		try {
			const response = await datasetAPI.deleteObjects(
				dataset._id,
				formData
			)
			if (response.status === 200) {
				message.success('Successfully Delete Objects', 3)
			}
		} catch (error) {
			message.error('Error deleting objects', 3)
		}
	}

	return (
		<div className="bg-white h-full w-full pl-2 pr-2 relative">
			{isLoading && <Loading />}
			<div className="w-full h-[4%] flex mb-2 justify-between">
				<button
					className="bg-blue-200 rounded-md text-blue-700 hover:bg-[#FFDAB9] hover:text-[#FFFFFF] flex items-center"
					onClick={() =>
						selectedImgs.length === imageFiles.length
							? handleDeselectAll()
							: handleSelectAll()
					}
				>
					<CheckIcon className="mx-auto flex-shrink-0 rounded-xl w-11 h-8 p-2" />
				</button>
				<div className="flex">
					<button
						className="ml-2 bg-blue-200 rounded-md text-blue-700 hover:bg-[#FFDAB9] hover:text-[#FFFFFF]"
						onClick={() => setIsUpload(true)}
					>
						<PlusIcon className="mx-auto flex-shrink-0 rounded-xl w-11 h-8 p-2" />
					</button>
					<button
						className="ml-2 bg-blue-200 rounded-md text-blue-700 hover:bg-[#FFDAB9] hover:text-[#FFFFFF]"
						onClick={handleDeleteImage}
					>
						<TrashIcon className="mx-auto flex-shrink-0 rounded-xl w-11 h-8 p-2" />
					</button>
				</div>
			</div>
			<div className="grid grid-cols-4 gap-3 grid-rows-4 h-[90%]">
				{currentImages.length > 0 ? (
					currentImages.map((file, index) => (
						<div
							key={file.fileName}
							className={`rounded-md overflow-hidden relative`}
						>
							<input
								type="checkbox"
								checked={selectedImgs.includes(file.fileName)}
								onChange={() =>
									handleSelectImage(file.fileName)
								}
								className="absolute top-2 right-2 w-4 h-4 opacity-80"
							/>
							<img
								src={file.content}
								alt=""
								className={`h-full w-full m-0 object-cover rounded-md
                                    ${
										selectedImgs.includes(file.fileName)
											? `border-blue-600 border-2`
											: ``
									}`}
							/>
						</div>
					))
				) : (
					<div className="relative">
						<Loading />
					</div>
				)}
			</div>
			<PaginationNew
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={handlePageChange}
			/>
			{isUpload && (
				<div className="w-full h-[50%] absolute bottom-[-2px] bg-white pr-4 pt-4 mt-4">
					<label
						htmlFor="file"
						className="h-[180px] flex justify-around items-center mx-auto border-[2px] border-dashed border-gray-500 rounded-[15px] hover:border-blue-500"
					>
						<div className="w-full h-full bg-white p-5  cursor-pointer rounded-[15px]">
							<div className="flex flex-col">
								<img
									src={database}
									alt=""
									className="mt-5 w-[200px] h-full mx-auto"
								/>

								<p className="text-center text-[15px] font-[300]">
									{(dataset.type &&
										TYPES[dataset.type]?.description) ||
										'No description available'}
								</p>
							</div>
						</div>
						<div className="w-full h-full bg-white p-5 cursor-pointer rounded-[15px]">
							<div className="flex flex-col">
								<img
									src={databaseList}
									alt=""
									className="mt-5 w-[200px] h-full mx-auto"
								/>

								<p className="text-center text-[15px] font-[300]">
									Folder information will be automatically
									tagged as metadata to each media{' '}
								</p>
							</div>
						</div>

						<input
							type="file"
							name="file"
							webkitdirectory="true"
							id="file"
							className="hidden"
							onChange={handleFileChange}
						/>
					</label>

					<div className="border-b border-gray-300 mt-2">
						<div className="">
							<span>{uploadedfiles.length} </span>
							Files
							<span className="ml-2 text-gray-500 text-sm">
								{'('}
								{totalKbytes} {' kB)'}
							</span>
						</div>
					</div>
					{uploadedfiles && (
						<div className="max-h-[90px] overflow-y-auto w-full transition-opacity duration-100">
							{uploadedfiles.map((file) => (
								<div
									key={file.webkitRelativePath}
									className="border-b border-gray-300 flex py-2 items-center w-full hover:bg-gray-50"
								>
									<DocumentIcon
										className="h-5 w-5 text-gray-400 mr-3"
										aria-hidden="true"
									/>
									<span>{file.name}</span>
									<span className="ml-2 text-gray-500 text-sm">
										{'('}
										{(file.size / 1024).toFixed(2)} {' kB)'}
									</span>

									<button
										className="ml-auto"
										onClick={() =>
											handleDeleteFile(
												file.webkitRelativePath
											)
										}
									>
										<XMarkIcon
											className="h-5 w-5 text-gray-400 mr-3"
											aria-hidden="true"
										/>
									</button>
								</div>
							))}
						</div>
					)}
					<button
						onClick={() => {
							setIsUpload(false)
						}}
						className="absolute ml-[700px] mt-5 p-[6px] rounded-lg bg-white hover:bg-gray-300 hover:text-white font-[600] w-[40px] h-[40px]"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="size-6"
						>
							<path
								fillRule="evenodd"
								d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
					{uploadedfiles.length > 0 && (
						<div className="w-full flex justify-end items-center">
							<button
								className="btn"
								onClick={(e) => {
									e.preventDefault()
									uploadNewFiles(e)
								}}
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
								<span className="text">Add</span>
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default ImageClassDataView
