import { useState } from 'react';
import logo from 'src/assets/images/logo.png';
import { validatePassword } from 'src/utils/validate';
import { signup } from 'src/api/auth';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
	const navigate = useNavigate();

	const [formState, setFormState] = useState({
		email: {
			value: '',
			error: '',
			touched: false,
		},
		password: {
			value: '',
			error: '',
			touched: false,
		},
		confirmPassword: {
			value: '',
			error: '',
			touched: false,
		},
		name: {
			value: '',
			error: '',
			touched: false,
		},
	});

	const handleSignUp = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const email = formData.get('email');
		const password = formData.get('password');
		const name = formData.get('name');
		await signup({ name, email, password });
		navigate('/', { replace: false });
	};

	const handlePasswordChange = (event) => {
		const password = event.target.value;
		if (!validatePassword(password)) {
			setFormState((prevState) => ({
				...prevState,
				password: {
					...prevState.password,
					error: 'Password must be at least 8 characters',
					touched: true,
				},
			}));
		} else if (
			formState.confirmPassword.value !== password &&
			formState.confirmPassword.touched
		) {
			setFormState((prevState) => ({
				...prevState,
				password: {
					value: password,
				},
				confirmPassword: {
					error: 'Passwords do not match',
					value: formState.confirmPassword.value,
					touched: true,
				},
			}));
		} else {
			setFormState((prevState) => ({
				...prevState,
				password: {
					value: password,
					error: '',
					touched: true,
				},
				confirmPassword: {
					error: '',
					touched: true,
				},
			}));
		}
	};

	const handleConfirmPasswordChange = (event) => {
		const confirmPassword = event.target.value;
		if (formState.password.value !== confirmPassword) {
			setFormState((prevState) => ({
				...prevState,
				confirmPassword: {
					value: confirmPassword,
					error: 'Passwords do not match',
					touched: true,
				},
			}));
		} else {
			setFormState((prevState) => ({
				...prevState,
				confirmPassword: {
					value: confirmPassword,
					error: '',
					touched: true,
				},
			}));
		}
	};

	return (
		<main className="w-full flex">
			<div className="relative flex-1 hidden items-center justify-center h-screen bg-gray-900 lg:flex">
				<div className="relative z-10 w-full max-w-md">
					<img src={logo} width={150} alt="logo" />
					<div className=" mt-16 space-y-3">
						<h3 className="text-white text-3xl font-bold">
							Start growing your business quickly
						</h3>
						<p className="text-gray-300">
							Create an account and get access to all features for
							30-days, No credit card required.
						</p>
						<div className="flex items-center -space-x-2 overflow-hidden">
							<img
								src="https://randomuser.me/api/portraits/women/79.jpg"
								className="w-10 h-10 rounded-full border-2 border-white"
								alt="logo"
							/>
							<img
								src="https://api.uifaces.co/our-content/donated/xZ4wg2Xj.jpg"
								className="w-10 h-10 rounded-full border-2 border-white"
								alt="logo"
							/>
							<img
								src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=a72ca28288878f8404a795f39642a46f"
								className="w-10 h-10 rounded-full border-2 border-white"
								alt="logo"
							/>
							<img
								src="https://randomuser.me/api/portraits/men/86.jpg"
								className="w-10 h-10 rounded-full border-2 border-white"
								alt="logo"
							/>
							<img
								src="https://images.unsplash.com/photo-1510227272981-87123e259b17?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=3759e09a5b9fbe53088b23c615b6312e"
								className="w-10 h-10 rounded-full border-2 border-white"
								alt="logo"
							/>
							<p className="text-sm text-gray-400 font-medium translate-x-5">
								Join 5.000+ users
							</p>
						</div>
					</div>
				</div>
				<div
					className="absolute inset-0 my-auto h-[500px]"
					style={{
						background:
							'linear-gradient(152.92deg, rgba(192, 132, 252, 0.2) 4.54%, rgba(232, 121, 249, 0.26) 34.2%, rgba(192, 132, 252, 0.1) 77.55%)',
						filter: 'blur(118px)',
					}}
				></div>
			</div>

			<div className="flex-1 flex items-center justify-center h-screen bg-white">
				<div className="w-full max-w-md space-y-8 px-4 bg-white text-gray-600 sm:px-0">
					<div className="">
						<img
							src="https://floatui.com/logo.svg"
							width={150}
							className="lg:hidden"
							alt="img"
						/>
						<div className="mt-5 space-y-2">
							<h3 className="text-gray-800 text-2xl font-bold sm:text-3xl">
								Sign up
							</h3>
						</div>
					</div>

					<form onSubmit={handleSignUp} className="space-y-5">
						<div>
							<label className="font-medium">Name</label>
							<input
								type="text"
								name="name"
								required
								className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-blue-600 shadow-sm rounded-lg"
							/>
							{/* {formError.name && <p className="text-red-500 mt-1">{formError.name}</p>} */}
						</div>
						<div>
							<label className="font-medium">Email</label>
							<input
								type="email"
								name="email"
								value={formState.name.email}
								required
								className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-blue-600 shadow-sm rounded-lg"
							/>
							{/* {formError.email && <p className="text-red-500 mt-1">{formError.email}</p>} */}
						</div>
						<div>
							<label className="font-medium">Password</label>
							<input
								type="password"
								name="password"
								// value={formState.name.password}
								required
								onChange={handlePasswordChange}
								className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-blue-600 shadow-sm rounded-lg"
							/>
							{formState.password.touched && (
								<p className="text-red-500 mt-1">
									{formState.password.error}
								</p>
							)}
						</div>
						<div>
							<label className="font-medium">
								Confirm password
							</label>
							<input
								type="password"
								name="confirmPassword"
								// value={formState.name.confirmPassword}
								required
								onChange={handleConfirmPasswordChange}
								className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-blue-600 shadow-sm rounded-lg"
							/>
							{formState.confirmPassword.touched && (
								<p className="text-red-500 mt-1">
									{formState.confirmPassword.error}
								</p>
							)}
						</div>
						<button className="w-full px-4 py-2 text-white font-medium bg-blue-600 hover:bg-blue-500 active:bg-blue-600 rounded-lg duration-150">
							Create account
						</button>
					</form>
					<p className="mt-4">
						Already have an account?{' '}
						<a
							href="login"
							className="font-medium text-blue-600 hover:text-blue-500"
						>
							Log in
						</a>
					</p>
				</div>
			</div>
		</main>
	);
};

export default SignUp;
