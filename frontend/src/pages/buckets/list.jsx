import { useReducer, useEffect, useState } from 'react'
import { ArchiveBoxIcon } from '@heroicons/react/20/solid'
import { PlusIcon } from '@heroicons/react/24/solid'
import { REGION } from 'src/constants/cloudRegion.js'

const initialState = {
	showUploader: false,
	buckets: [],
}

export default function BucketList() {
	const [bucketState, updateBucketState] = useReducer(
		(state, newState) => ({ ...state, ...newState }),
		initialState
	)
	// console.log('region', REGION.AWS_S3[0])
	const [service, setService] = useState('AWS_S3')
	const [region, setRegion] = useState(REGION.AWS_S3[0])

	// Handle region change when the service is changed
	useEffect(() => {
		// Set default region based on selected service
		if (service === 'AWS_S3') {
			setRegion(REGION.AWS_S3[0])
			console.log(REGION.AWS_S3[0])
		} else if (service === 'GCP_STORAGE') {
			setRegion(REGION.GCP_STORAGE[0])
			console.log(REGION.GCP_STORAGE[0])
		}
	}, [service])

	const handleCreateBucket = async (event) => {
		event.preventDefault()

		console.log('OK')
	}

	return (
		<>
			<div
				className={` ${
					bucketState.showUploader ? 'blur-[2px]' : ''
				} mx-auto w-full flex-grow lg:flex xl:px-2 -z-10 mt-2`}
			>
				{/* Left sidebar & main wrapper */}
				<div className="min-w-0 flex-1 bg-white xl:flex p-5 rounded-md">
					{/* Projects List */}
					<div className="bg-white lg:min-w-0 lg:flex-1">
						<div className="flex justify-between mx-auto px-3 mb-5 ">
							<div className="px-4 lg:px-0">
								<h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
									Buckets
								</h1>
								{/* Meta info */}
								<div className="flex mt-5 flex-col space-y-6 sm:flex-row sm:space-y-0 sm:space-x-8 xl:flex-col xl:space-x-0 xl:space-y-6">
									<div className="flex items-center space-x-2">
										<ArchiveBoxIcon
											className="h-5 w-5 text-gray-400"
											aria-hidden="true"
										/>
										<span className="text-sm font-medium text-gray-500">
											{bucketState.buckets.length} Buckets
										</span>
									</div>
								</div>
							</div>
							{/* Action buttons */}
							<div className="flex flex-col sm:flex-row xl:flex-col">
								<button
									type="button"
									className="inline-flex items-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer h-fit"
									onClick={() =>
										updateBucketState({
											showUploader: true,
										})
									}
								>
									<PlusIcon
										className="-ml-1 mr-2 h-5 w-5"
										aria-hidden="true"
									/>
									New Bucket
								</button>
							</div>
						</div>

						{bucketState.buckets.length > 0 ? (
							<div className="px-3  mx-auto pt-5 overflow-hidden grid sm:grid-cols-2 xl:grid-cols-3 gap-5 py-4">
								{/* {bucketState.datasets.map((project) => (
									<DatasetCard
										key={dataset._id}
										dataset={dataset}
										getDatasets={getDatasets}
									/>
								))} */}
							</div>
						) : (
							<div className="text-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="mx-auto h-12 w-12 text-gray-400"
								>
									<path
										vectorEffect="non-scaling-stroke"
										strokeWidth={2}
										strokeLinecap="round"
										strokeLinejoin="round"
										d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
									/>
								</svg>

								<h3 className="mt-2 text-sm font-medium text-gray-900">
									No buckets
								</h3>
								<p className="mt-1 text-sm text-gray-500">
									Get started by creating a new bucket.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Create new bucket UI */}
			<div
				className={`${
					bucketState.showUploader
						? 'right-0 !z-[1000] opacity-100'
						: 'right-[-100%] opacity-0'
				} fixed h-full w-1/2 px-[30px] bg-white transition-all duration-500 ease-in-out overflow-auto min-h-screen top-0`}
			>
				<div className="flex items-center mt-3">
					<button
						onClick={() =>
							updateBucketState({ showUploader: false })
						}
						className="p-[12px] rounded-full bg-transparent hover:bg-gray-300 hover:text-white font-[600] w-[48px] h-[48px]"
					>
						<svg
							className=""
							focusable="false"
							viewBox="0 0 24 24"
							color="#69717A"
							aria-hidden="true"
							data-testid="close-upload-media-dialog-btn"
						>
							<path d="M18.3 5.71a.9959.9959 0 00-1.41 0L12 10.59 7.11 5.7a.9959.9959 0 00-1.41 0c-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"></path>
						</svg>
					</button>
					<h1 className="font-bold ml-3 text-xl">
						Create New Bucket
					</h1>
				</div>
				<form
					className="space-y-5"
					action="#"
					onSubmit={handleCreateBucket}
				>
					{/* Service selection */}
					<div className="">
						<label
							htmlFor="visibility"
							className="block font-medium text-xl text-gray-700"
						>
							Service
						</label>
						<div className="flex w-full mt-1 bg-white">
							<button
								className={`flex items-center space-x-2 px-2 py-2 w-1/2 border rounded-md ${
									service === 'GCP_STORAGE'
										? 'border-blue-500'
										: 'border-gray-300'
								}`}
								onClick={() => setService('GCP_STORAGE')}
							>
								<img
									className="rounded-md"
									src="https://static-00.iconduck.com/assets.00/cloud-storage-icon-512x410-pb1vlt5m.png"
									height="64"
									width="64"
									alt="Simple Storage Service icon"
								/>
								<span className="ml-2">
									Google Cloud Storage
								</span>
							</button>
							<button
								className={`flex items-center space-x-2 ml-3 px-2 py-2 w-1/2 border rounded-md ${
									service === 'AWS_S3'
										? 'border-blue-500'
										: 'border-gray-300'
								}`}
								onClick={() => setService('AWS_S3')}
							>
								<img
									className="rounded-md"
									src="https://icon.icepanel.io/AWS/svg/Storage/Simple-Storage-Service.svg"
									height="64"
									width="64"
									alt="Simple Storage Service icon"
								/>
								<span className="ml-2">AWS S3 </span>
							</button>
						</div>
					</div>

					{/* Region selection */}
					<div className="mt-3">
						<label
							htmlFor="region"
							className="block font-medium text-xl text-gray-700"
						>
							Region
						</label>
						<select
							id="region"
							name="region"
							value={region}
							onChange={(e) => setRegion(e.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
						>
							{REGION[service].map((regionOption) => (
								<option key={regionOption} value={regionOption}>
									{regionOption}
								</option>
							))}
						</select>
					</div>

					<div className="">
						<label
							htmlFor="name"
							className="ml-1 block font-medium text-xl text-gray-700"
						>
							Name
						</label>
						<input
							type="text"
							name="name"
							id="name"
							required
							minLength={10}
							className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
							placeholder="Project Name"
						/>
					</div>

					{/* Submit button */}
					<div className="text-right">
						<button
							type="submit"
							className="inline-flex justify-center rounded-md border border-transparent bg-blue-500 py-2 px-5 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Create
						</button>
					</div>
				</form>
			</div>
		</>
	)
}
