import React from 'react';
import { NavLink } from 'react-router-dom';

const ActiveLink = (props) => {
	return (
		<NavLink
			{...props}
			className={({ isActive }) => {
				return isActive
					? props.activeclassname
					: props.defaultclassname;
			}}
		/>
	);
};

export default ActiveLink;
