import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from 'src/constants/paths'
import logo from 'src/assets/images/logo.png'
import ActiveLink from './common/ActiveLink'
import useAuth from 'src/hooks/useAuth'
import clsx from 'clsx'

const NavBar = () => {
	const defaultclassname =
		'inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-bold text-gray-500 hover:border-gray-300 hover:text-gray-700'
	const activeclassname =
		'inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-bold text-gray-900'

	const navigate = useNavigate()
	const { logout: authLogout } = useAuth()

	const logout = () => {
		authLogout()
		navigate('/', { replace: true })
	}

	return (
		<Disclosure
			as="nav"
			className="sticky top-0 bg-white shadow-md z-[999]"
		>
			{({ open }) => (
				<>
					<div className="mx-auto px-2 sm:px-6 lg:px-8">
						<div className="relative flex h-[60px] justify-between">
							<div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
								{/* Mobile menu button */}
								<Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
									<span className="sr-only">
										Open main menu
									</span>
									{open ? (
										<XMarkIcon
											className="block h-6 w-6"
											aria-hidden="true"
										/>
									) : (
										<Bars3Icon
											className="block h-6 w-6"
											aria-hidden="true"
										/>
									)}
								</Disclosure.Button>
							</div>
							<div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
								<div className="flex flex-shrink-0 items-center">
									<img
										className="block h-8 w-auto lg:hidden"
										src={logo}
										alt="UET MLOps"
									/>
									<img
										className="hidden h-8 w-auto lg:block"
										src={logo}
										alt="UET MLOps"
									/>
								</div>
								<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
									<ActiveLink
										to={PATHS.PROJECTS}
										defaultclassname={defaultclassname}
										activeclassname={activeclassname}
										// className={({ isActive }) => (isActive ? activeClassName : defaultClassName)}
									>
										Projects
									</ActiveLink>
								</div>
								<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
									<ActiveLink
										to={PATHS.BUCKETS}
										defaultclassname={defaultclassname}
										activeclassname={activeclassname}
										// className={({ isActive }) => (isActive ? activeClassName : defaultClassName)}
									>
										Buckets
									</ActiveLink>
								</div>
								<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
									<ActiveLink
										to={PATHS.DATASETS}
										defaultclassname={defaultclassname}
										activeclassname={activeclassname}
										// className={({ isActive }) => (isActive ? activeClassName : defaultClassName)}
									>
										Datasets
									</ActiveLink>
								</div>
							</div>
							<div className="absolute inset-y-0 right-0 flex items-center p-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
								{/* Profile dropdown */}
								<Menu as="div" className="relative ml-3">
									<div>
										<Menu.Button className="transition flex gap-2 rounded-xl bg-white text-sm focus:outline-none hover:bg-gray-100 py-1 px-2">
											<span className="font-bold pt-[5px]">
												username
											</span>
											<img
												className="h-8 w-8 border-solid border-2 border-blue-600 rounded-full"
												src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
												alt=""
											/>
										</Menu.Button>
									</div>
									<Transition
										as={Fragment}
										enter="transition ease-out duration-200"
										enterFrom="transform opacity-0 scale-95"
										enterTo="transform opacity-100 scale-100"
										leave="transition ease-in duration-75"
										leaveFrom="transform opacity-100 scale-100"
										leaveTo="transform opacity-0 scale-95"
									>
										<Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
											<Menu.Item>
												{({ active }) => (
													<a
														onClick={() =>
															navigate(
																PATHS.PROFILE,
																{
																	replace: true,
																}
															)
														}
														className={clsx(
															active
																? 'bg-gray-100'
																: '',
															'block px-4 py-2 text-sm text-gray-700'
														)}
													>
														Your Profile
													</a>
												)}
											</Menu.Item>
											<Menu.Item>
												{({ active }) => (
													<a
														onClick={() =>
															navigate(
																PATHS.SETTINGS,
																{
																	replace: true,
																}
															)
														}
														className={clsx(
															active
																? 'bg-gray-100'
																: '',
															'block px-4 py-2 text-sm text-gray-700'
														)}
													>
														Settings
													</a>
												)}
											</Menu.Item>
											<Menu.Item>
												{({ active }) => (
													<a
														href="/"
														onClick={() => logout()}
														className={clsx(
															active
																? 'bg-gray-100'
																: '',
															'block px-4 py-2 text-sm text-gray-700 border-t'
														)}
													>
														Sign out
													</a>
												)}
											</Menu.Item>
										</Menu.Items>
									</Transition>
								</Menu>
							</div>
						</div>
					</div>
				</>
			)}
		</Disclosure>
	)
}

export default NavBar
