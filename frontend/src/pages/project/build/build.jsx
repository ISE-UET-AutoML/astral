import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import * as projectAPI from 'src/api/project'

export default function ProjectBuild() {
	const { id: projectID } = useParams()
	const [projectInfo, setProjectInfo] = useState(null)
	const [data, setData] = useState({})

	useEffect(() => {
		const fetchProjectInfo = async () => {
			try {
				const response = await projectAPI.getProjectById(projectID)
				setProjectInfo(response.data)
			} catch (error) {
				console.error('Error fetching project:', error)
			}
		}

		fetchProjectInfo()
	}, [projectID])

	// Function to update data state
	function updateFields(fields) {
		setData((prev) => ({ ...prev, ...fields }))
	}

	return (
		<div>
			{/* Pass data and update function via Outlet context */}
			{projectInfo && (
				<Outlet context={{ ...data, updateFields, projectInfo }} />
			)}
		</div>
	)
}
