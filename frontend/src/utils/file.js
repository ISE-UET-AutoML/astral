import { ALLOWED_FILE_EXTENSIONS } from 'src/constants/file'
import { TYPES } from 'src/constants/types'

const isAllowedExtension = (fileName, allowedExtensions) => {
	const idx = fileName.lastIndexOf('.')
	if (idx <= 0) {
		return false
	}
	const ext = fileName.substring(idx + 1, fileName.length).toLowerCase()
	return allowedExtensions.includes(ext)
}

const validateFiles = (files, projectType) => {
	const projectInfo = TYPES[projectType]
	if (!projectInfo) {
		alert('Unsupported project type.')
		return []
	}

	const { allowedExtensions } = projectInfo
	const validFiles = []
	for (let i = 0; i < files.length; i++) {
		const file = files[i]
		// Don't need to validate dot files (hidden files), just remove its
		if (file.name.startsWith('.')) {
			continue
		}

		if (isAllowedExtension(file.name, allowedExtensions)) {
			validFiles.push(file)
		} else {
			alert(
				`We only accept ${allowedExtensions.join(', ').toUpperCase()} format, please remove ${file.name} from folder`
			)
			return []
		}
	}
	return validFiles
}

export { validateFiles }
