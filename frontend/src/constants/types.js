const TYPES = {
	IMAGE_CLASSIFICATION: {
		type: 'Image Classification',
		description: 'We accept JPEG, PNG image format',
		allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
	},
	TEXT_CLASSIFICATION: {
		type: 'Text Classification',
		description: 'We accept CSV text format',
		allowedExtensions: ['csv'],
	},
	TABULAR_CLASSIFICATION: {
		type: 'Tabular Classification',
		description: 'We accept CSV text format',
		allowedExtensions: ['csv'],
	},
	MULTIMODAL_CLASSIFICATION: {
		type: 'Multimodal Classification',
		description: 'We accept CSV text format',
		allowedExtensions: ['csv'],
	},
	OBJECT_DETECTION: {
		type: 'Object Detection',
		description: 'We accept JPEG, PNG image format',
		allowedExtensions: ['jpg', 'jpeg', 'png'],
	},
	SEGMENTATION: {
		type: 'Segmentation',
		description: 'We accept JPEG, PNG image format',
		allowedExtensions: ['jpg', 'jpeg', 'png'],
	},
}

export { TYPES }
