import React, { useState } from 'react';
import Cookies from 'universal-cookie';

const authContext = React.createContext();

function useAuth() {
	const [authed, setAuthed] = useState(false);
	const cookies = new Cookies();

	const writeCookies = ({ accessToken, refreshToken }) => {
		const cookieOptions = {
			path: '/',
			secure: true,
			sameSite: 'none',
		};
		if (process.env.REACT_APP_DOMAIN_NAME) {
			cookieOptions.domain = process.env.REACT_APP_DOMAIN_NAME;
		}
		cookies.set('accessToken', accessToken, cookieOptions);
		if (refreshToken) {
			cookies.set('refreshToken', refreshToken, cookieOptions);
		}
	};

	return {
		authed,
		refresh() {
			return new Promise((res) => {
				setAuthed(
					cookies.get('accessToken') && cookies.get('refreshToken')
				);
				res();
			});
		},
		login({ accessToken, refreshToken }) {
			return new Promise((res) => {
				writeCookies({ accessToken, refreshToken });
				setAuthed(true);
				res();
			});
		},
		logout() {
			return new Promise((res) => {
				setAuthed(false);
				cookies.remove('accessToken', { path: '/' });
				cookies.remove('refreshToken', { path: '/' });
				res();
			});
		},
	};
}

export function AuthProvider({ children }) {
	const auth = useAuth();

	return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export default function AuthConsumer() {
	return React.useContext(authContext);
}
