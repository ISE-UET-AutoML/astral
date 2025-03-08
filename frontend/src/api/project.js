import { API_URL, API_BASE_URL } from 'src/constants/api'
import instance from './axios'

/* ----------------------------------------------------- OLD API ------------------------------------ */

const uploadFiles = (projectID, files) => {
	const options = {
		headers: { 'Content-Type': 'multipart/form-data' },
	}
	return instance.post(API_URL.upload_file(projectID), files, options)
}

const listData = (projectID, queryString = '&page=1&size=24') => {
	return instance.get(
		`${API_BASE_URL}/images?project_id=${projectID}${queryString}`
	)
}

const updateData = (projectID) => {
	return 'test'
}
const getProjectDataset = (projectID) => {
	return instance.get(API_URL.get_project_dataset(projectID))
}

const getProjectById = (projectID) => {
	return instance.get(`${API_BASE_URL}/projects/${projectID}`)
}

const getProjectFullDataset = (projectID) => {
	return instance.get(API_URL.get_project_fulldataset(projectID))
}

const getProjectPreviewDataset = (projectID) => {
	return instance.get(API_URL.get_project_previewdataset(projectID))
}
const getProjectLabelingDataset = (projectID) => {
	return instance.get(API_URL.get_project_labelingdataset(projectID))
}

const explainInstance = (projectID, data) => {
	const options = {
		headers: { 'Content-Type': 'multipart/form-data' },
	}

	return instance.post(API_URL.explain_instance(projectID), data, options)
}

const deleteProject = (projectID) => {
	return instance.post(API_URL.delete_project(projectID))
}

const autoLabel = (projectID) => {
	return instance.post(API_URL.post_autolabel(projectID))
}

const getPreviewDataByPage = (projectID, page, pageSize) => {
	return instance.get(API_URL.get_dataset_preview(projectID, page, pageSize))
}

const createLabels = (projectID, data) => {
	return instance.post(API_URL.create_label_for_dataset(projectID), data)
}

const updateAnnotation = (projectID, task_id, data) => {
	// /:id/set_label /: task_id
	return instance.post(API_URL.update_annotation(projectID, task_id), data)
}

/* ----------------------------------------------------- NEW API ------------------------------------ */
const URL = `${API_BASE_URL}/projects`

const trainModel = (projectID, dataset, instanceInfo) => {
	return instance.post(`${URL}/${projectID}/cloudTrain`, {
		dataset,
		instanceInfo,
	})
}

const getModels = (projectID) => {
	return instance.get(`${URL}/models?project_id=${projectID}`)
}

const sendTargetColumn = (projectID, formData) => {
	return instance.post(`${URL}/${projectID}/sendTargetColumn`, formData)
}

export {
	updateAnnotation,
	createLabels,
	getProjectPreviewDataset,
	getProjectLabelingDataset,
	listData,
	trainModel,
	uploadFiles,
	getProjectDataset,
	getProjectById,
	updateData,
	explainInstance,
	deleteProject,
	getProjectFullDataset,
	autoLabel,
	getPreviewDataByPage,
	getModels,
	sendTargetColumn,
}
