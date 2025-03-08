import { API_BASE_URL } from 'src/constants/api'
import instance from './axios'

const URL = `${API_BASE_URL}/chat`

const chat = (message, confirmed = false, projectList = [])  => {
	return instance.post(`${URL}`, {message: message, confirmed: confirmed, projectList: projectList})
}

const clearHistory = (projectCreated = false) => {
    return instance.post(`${URL}/clear`, {projectCreated: projectCreated})
}

const getHistory = () => {
    return instance.post(`${URL}/getHistory`)
}

export {
    chat,
    clearHistory,
    getHistory
}