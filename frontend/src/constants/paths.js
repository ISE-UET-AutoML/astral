const PATHS = {
	/*-----------------------------BASE-------------------------------------*/

	ROOT: '/',
	LOGIN: '/login',
	SIGNUP: '/signup',
	DEFAULT: '/app',
	PROJECTS: '/app/projects',
	BUCKETS: '/app/buckets',
	DATASETS: '/app/datasets',
	PROFILE: '/profile',
	SETTINGS: '/settings',
	MODELS: '/app/models',

	/*-----------------------------PROJECT-------------------------------------*/

	PROJECT_BUILD: (projectID) => `/app/project/${projectID}/build/uploadData`,
	PROJECT_TRAINING: (projectID, experimentName) =>
		`/app/project/${projectID}/build/training?experimentName=${experimentName}`,
	PROJECT_TRAININGRESULT: (projectID, experimentName) =>
		`/app/project/${projectID}/build/trainResult?experimentName=${experimentName}`,
	PROJECT_MODEL: (projectID) => `/app/project/${projectID}/model`,
	PROJECT_EXPERIMENT: (projectID) => `/app/project/${projectID}/experiments`,
	PROJECT_DEPLOY: (projectID) => `/app/project/${projectID}/deploy`,
	PROJECT_SETTINGS: (projectID) => `/app/project/${projectID}/settings`,
	PREDICT: (projectID, experimentName) =>
		`/app/project/${projectID}/build?step=4&experiment_name=${experimentName}`,

	/*-----------------------------DATASET-------------------------------------*/

	DATASET_VIEW: (datasetID) => `/app/dataset/${datasetID}/view`,

	/*-----------------------------OTHER-------------------------------------*/
	TESTING: '/testing',
}

export { PATHS }
