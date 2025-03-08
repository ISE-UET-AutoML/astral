const Loading = () => {
	return (
		<div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-500 bg-opacity-50 z-[999999]">
			<div className="spinner"></div>
		</div>
	);
};

export default Loading;
