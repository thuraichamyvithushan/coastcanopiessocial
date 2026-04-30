// import axios from 'axios';
// import CONFIG from '../config';

// const api = axios.create({
//     baseURL: CONFIG.API_BASE_URL,
// });

// // Add a request interceptor to add the JWT token to headers
// api.interceptors.request.use(
//     (config) => {
//         const userInfo = localStorage.getItem('userInfo');
//         if (userInfo) {
//             const { token } = JSON.parse(userInfo);
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

// // Add a response interceptor to handle token expiration
// api.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response && error.response.status === 401) {
//             console.error('SECURITY ALERT: Backend returned 401 (Unauthorized). Logging out user...');
//             console.log('Failing URL:', error.config.url);
//             console.log('Current localStorage info:', localStorage.getItem('userInfo'));
            
//             localStorage.removeItem('userInfo');
//             window.location.href = '/login';
//         }
//         return Promise.reject(error);
//     }
// );

// export default api;




import axios from 'axios';
import CONFIG from '../config';

const api = axios.create({
    baseURL: CONFIG.API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                if (parsed?.token) {
                    config.headers.Authorization = `Bearer ${parsed.token}`;
                }
            } catch (e) {
                console.warn("Could not parse userInfo");
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn(`Unauthorized: ${error.config?.url}`);
            // Do NOT redirect to login
            localStorage.removeItem('userInfo');
        }
        return Promise.reject(error);
    }
);

export default api;