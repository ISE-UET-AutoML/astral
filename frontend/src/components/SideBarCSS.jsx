import { Fragment, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { Outlet } from 'react-router-dom';
import {
	Bars3BottomLeftIcon,
	BellIcon,
	CalendarIcon,
	ChartBarIcon,
	FolderIcon,
	HomeIcon,
	InboxIcon,
	UsersIcon,
	XMarkIcon,
	ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

const navigation = [
	{ name: 'Dashboard', href: '#', icon: HomeIcon, current: false },
	{ name: 'Team', href: '#', icon: UsersIcon, current: true },
	{ name: 'Projects', href: '#', icon: FolderIcon, current: false },
	{ name: 'Calendar', href: '#', icon: CalendarIcon, current: false },
	{ name: 'Documents', href: '#', icon: InboxIcon, current: false },
	{ name: 'Reports', href: '#', icon: ChartBarIcon, current: false },
];
const userNavigation = [
	{ name: 'Your Profile', href: '#' },
	{ name: 'Settings', href: '#' },
	{ name: 'Sign out', href: '#' },
];

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function SideBar() {
	const [isOpen, setIsOpen] = useState(true);
	const toggleSideBar = () => {
		setIsOpen(!isOpen);
	};
	return (
		<>
			<div
				className={classNames(
					isOpen ? 'md:w-64' : 'md:w-16',
					'hidden md:fixed md:inset-y-0 md:flex md:flex-col duration-300'
				)}
			>
				<div className="top-10 left-8 relative text-gray-400">
					<ChevronLeftIcon
						onClick={toggleSideBar}
						className={classNames(
							isOpen ? '' : 'rotate-180',
							'h-10 w-10 absolute cursor-pointer rounded-full right-3 top-9 border-2 px-1'
						)}
					/>
				</div>
				<div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
					<div className="flex flex-shrink-0 items-center px-4">
						<img
							className="h-8 w-auto"
							src="https://tailwindui.com/img/logos/mark.svg?color=blue&shade=600"
							alt="Your Company"
						/>
					</div>
					<div className="mt-5 flex flex-grow flex-col">
						<nav className="flex-1 space-y-1 px-2 pb-4">
							{navigation.map((item) => (
								<a
									key={item.name}
									href={item.href}
									className={classNames(
										item.current
											? 'bg-gray-100 text-gray-900'
											: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
										'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
									)}
								>
									<item.icon
										className={classNames(
											item.current
												? 'text-gray-500'
												: 'text-gray-400 group-hover:text-gray-500',
											'mr-3 flex-shrink-0 h-6 w-6'
										)}
										aria-hidden="true"
									/>
									{isOpen ? item.name : ''}
								</a>
							))}
						</nav>
					</div>
				</div>
			</div>
		</>
	);
}
