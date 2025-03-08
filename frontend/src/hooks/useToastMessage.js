import { useState } from 'react';
import ToastMessage from 'src/components/Toast';
const useToast = () => {
	const [toast, setToast] = useState(null);

	const showToast = (message, type) => {
		setToast({ message, type });
	};

	const hideToast = () => {
		setToast(null);
	};

	const Toast = () => {
		if (toast) {
			return (
				<ToastMessage
					message={toast.message}
					type={toast.type}
					onClose={hideToast}
				/>
			);
		}
		return null;
	};

	return [showToast, hideToast];
};

export default useToast;
