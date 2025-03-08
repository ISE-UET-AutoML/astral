import {
	BuildIcon,
	SettingIcon,
	ModelIcon,
	DeployIcon,
	TasksIcon,
} from 'src/components/icons'
import clsx from 'clsx'
import { PATHS } from 'src/constants/paths'
import { useLocation } from 'react-router-dom' // Assuming you're using react-router

const ProjectSidebar = ({ projectID, className }) => {
	const location = useLocation()

	const navigation = [
		{
			name: 'Build',
			href: PATHS.PROJECT_BUILD(projectID),
			icon: BuildIcon,
			current: location.pathname === PATHS.PROJECT_BUILD(projectID),
		},
		{
			name: 'Experiment',
			href: PATHS.PROJECT_EXPERIMENT(projectID),
			icon: TasksIcon,
			current: location.pathname === PATHS.PROJECT_EXPERIMENT(projectID),
		},
		{
			name: 'Model',
			href: PATHS.PROJECT_MODEL(projectID),
			icon: ModelIcon,
			current: location.pathname === PATHS.PROJECT_MODEL(projectID),
		},
		{
			name: 'Deploy',
			href: PATHS.PROJECT_DEPLOY(projectID),
			icon: DeployIcon,
			current: location.pathname === PATHS.PROJECT_DEPLOY(projectID),
		},
	]

	return (
		<div className={clsx('duration-300', className)}>
			<div className="h-[calc(100vh-60px)] flex flex-grow flex-col overflow-y-auto bg-gray-50">
				<div className="py-3 flex flex-grow flex-col justify-between">
					<nav className="flex flex-col gap-4 px-2 pb-4">
						{navigation.map((item) => (
							<a
								key={item.name}
								href={item.href}
								className={clsx(
									item.current
										? 'text-blue-500'
										: 'text-center text-gray-500 hover:text-blue-500',
									'transition group flex flex-col items-center justify-center text-sm font-medium'
								)}
							>
								<item.icon
									className={clsx(
										item.current
											? ' text-blue-500'
											: 'text-gray-500  group-hover:text-blue-500',
										'mx-auto flex-shrink-0 rounded-xl w-11 h-11',
										'p-2'
									)}
									aria-hidden="true"
								/>
								<span className="text-xs font-semibold">
									{item.name}
								</span>
							</a>
						))}
					</nav>
					<a
						href={PATHS.PROJECT_SETTINGS(projectID)}
						className={clsx(
							'text-center text-gray-500 hover:text-blue-500',
							'transition group flex flex-col items-center text-sm font-medium'
						)}
					>
						<SettingIcon
							className={clsx(
								'text-gray-500 group-hover:text-blue-500',
								'flex-shrink-0 rounded-xl w-11 h-11',
								'px-2 py-2'
							)}
						/>

						<span className="text-xs font-semibold">Settings</span>
					</a>
				</div>
			</div>
		</div>
	)
}

export default ProjectSidebar
