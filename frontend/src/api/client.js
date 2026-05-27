import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = '/api';

export const ACCESS_TOKEN_EXPIRE_DAYS =
    Number(import.meta.env.VITE_ACCESS_TOKEN_EXPIRE_MINUTES) / (24 * 60);
export const REFRESH_TOKEN_EXPIRE_DAYS = Number(
    import.meta.env.VITE_REFRESH_TOKEN_EXPIRE_DAYS
);

export const getCookieOptions = (expires) => ({
    expires,
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    sameSite: 'lax',
});

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const isAuthEndpoint = (url = '') =>
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh');

const clearTokensAndRedirect = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
    }
};

let refreshPromise = null;

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            isAuthEndpoint(originalRequest.url)
        ) {
            return Promise.reject(error);
        }

        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) {
            clearTokensAndRedirect();
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = axios
                    .post(
                        `${API_BASE_URL}/auth/refresh`,
                        {},
                        { headers: { Authorization: `Bearer ${refreshToken}` } }
                    )
                    .finally(() => {
                        refreshPromise = null;
                    });
            }
            const { data } = await refreshPromise;

            Cookies.set('access_token', data.access_token, getCookieOptions(ACCESS_TOKEN_EXPIRE_DAYS));
            Cookies.set('refresh_token', data.refresh_token, getCookieOptions(REFRESH_TOKEN_EXPIRE_DAYS));

            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            clearTokensAndRedirect();
            return Promise.reject(refreshError);
        }
    }
);

export default apiClient;
