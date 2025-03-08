export const API_BASE_URL = process.env.REACT_APP_API_URL
export const API_URL = {
	login: `${API_BASE_URL}/auth/login`,
	signup: `${API_BASE_URL}/auth/signup`,
	refresh_token: `${API_BASE_URL}/auth/signup`,
	all_projects: `${API_BASE_URL}/projects`,
	all_models: `${API_BASE_URL}/projects/models`,
	train_model: (projectID) => `${API_BASE_URL}/projects/${projectID}/train`,
	delete_project: (projectID) =>
		`${API_BASE_URL}/projects/${projectID}/delete`,
	upload_file: (projectID) => `${API_BASE_URL}/projects/${projectID}/upload`,
	get_project_dataset: (projectID) =>
		`${API_BASE_URL}/projects/${projectID}/datasets`,
	get_project_fulldataset: (projectID) =>
		`${API_BASE_URL}/projects/${projectID}/fulldatasets`,
	get_project_previewdataset: (projectID) =>
		`${API_BASE_URL}/projects/${projectID}/dataset_preview`,
	get_project_labelingdataset: (projectID) =>
		`${API_BASE_URL}/projects/${projectID}/dataset_labeling`,
	update_label: (imageId) => `${API_BASE_URL}/images/${imageId}`,
	explain_instance: (projectID) =>
		`${API_BASE_URL}/projects/${projectID}/explain`,
	create_label_for_dataset: (projectId) =>
		`${API_BASE_URL}/projects/${projectId}/label_config`,
	update_annotation: (projectId, taskId) =>
		`${API_BASE_URL}/projects/${projectId}/set_label/${taskId}`,
	post_autolabel: (datasetID) =>
		`${API_BASE_URL}/projects/${datasetID}/autolabel`,
	get_model: (experimentName) =>
		`${API_BASE_URL}/experiments/model/${experimentName}`,
	predict_data: (experimentName) =>
		`${API_BASE_URL}/experiments/predict/?experiment_name=${experimentName}`,
	explain_data: (experimentName) =>
		`${API_BASE_URL}/experiments/explain/?experiment_name=${experimentName}`,
	get_dataset_preview: (projectID, page, pageSize) =>
		`${API_BASE_URL}/projects/${projectID}/dataset_preview?&page=${page}&page_size=${pageSize}`,
}
