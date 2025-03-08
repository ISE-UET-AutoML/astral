import React from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from 'src/components/NavBar'

const DefaultLayout = () => {
	return (
		<>
			<NavBar />
			<Outlet className="outlet" />
		</>
	)
}

export default DefaultLayout
