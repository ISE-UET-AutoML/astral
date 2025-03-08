import { Outlet, useParams } from 'react-router-dom'
import DatasetSidebar from 'src/components/DatasetSidebar'

export default function DatasetLayout() {
	const params = useParams()

	return (
		<div className="h-[calc(100vh-70px)]">
			<DatasetSidebar
				datasetID={params.id}
				className="fixed h-[calc(100vh-70px)] w-[80px] top-[60px] z-100"
			/>

			<div className="mx-auto w-[calc(100%-80px)] ml-[80px] mr-4 flex-grow lg:flex xl:px-2 -z-10 mt-2 h-full">
				{/* Left sidebar & main wrapper */}
				<div className="min-w-0 flex-1 w-max xl:flex rounded-md">
					<div className="bg-white lg:min-w-0 lg:flex-1">
						<Outlet className="outlet h-full" />
					</div>
				</div>
			</div>
		</div>
	)
}
