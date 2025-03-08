import instance from './axios'
import { API_BASE_URL, API_URL } from 'src/constants/api'
import axios from 'axios'

const instanceWithoutCredential = axios.create({ baseURL: API_BASE_URL })

const signup = (credential) => {
	instanceWithoutCredential.post(API_URL.signup, credential)
}
const login = (credential) =>
	instanceWithoutCredential.post(API_URL.login, credential)

const refreshToken = () => instance.get(API_URL.refresh_token)

export { signup, login, refreshToken }
