import { Outlet, useParams } from 'react-router-dom'
import ProjectSidebar from 'src/components/ProjectSidebar'

export default function ProjectLayout() {
	const params = useParams()

	return (
		<div>
			<ProjectSidebar
				projectID={params.id}
				className="fixed h-[calc(100vh-60px)] w-[80px] top-[60px] z-100"
			/>
			<div className="mx-auto w-[calc(100%-80px)] ml-[80px] mr-4 flex-grow lg:flex -z-10 mt-2 h-[706px]">
				{/* Left sidebar & main wrapper */}
				<div className="min-w-0 flex-1 w-max xl:flex rounded-md">
					<div className="bg-white lg:min-w-0 lg:flex-1">
						<Outlet className="outlet h-max" />
					</div>
				</div>
			</div>
		</div>
	)
}
