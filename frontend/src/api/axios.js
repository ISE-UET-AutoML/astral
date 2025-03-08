import axios from 'axios';
import { API_URL } from 'src/constants/api';
import Cookies from 'universal-cookie';

const instance = axios.create({
     baseURL: process.env.REACT_APP_API_URL,
    withCredentials: true,
});

const refreshToken = () => instance.get(API_URL.refresh_token);

instance.interceptors.response.use(
    async (response) => {
        const config = response.config;
        if (
            config.url.indexOf('/login') >= 0 ||
            config.url.indexOf('/refresh-token') >= 0
        ) {
            return response;
        }
        const status = response.status;
        if (status && status === 200) {
            if (response.msg === 'jwt expired') {
                Cookies.remove('accessToken');
                const { accessToken } = (await refreshToken()).data;
                if (accessToken) {
                    Cookies.set('accessToken', accessToken, { path: '/' });
                    return response;
                }
            }
        }
        return response;
    },
    (err) => {
        return Promise.reject(err);
    }
);

export default instance;
