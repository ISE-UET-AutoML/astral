// Validate email function
export function validateEmail(email) {
	const re = /\S+@\S+\.\S+/;
	return re.test(email);
}

// Validate password function
export function validatePassword(password) {
	// Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number
	const re = /^[a-zA-Z0-9]{8,}$/;
	return re.test(password);
}
