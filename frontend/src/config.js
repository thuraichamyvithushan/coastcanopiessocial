const apiBaseUrl = import.meta.env.PROD
    ? (import.meta.env.VITE_API_BASE_URL || '/api')
    : (import.meta.env.VITE_API_BASE_URL || 'https://coastcanopiessocial-l6gf.vercel.app/api');

const apiOrigin = apiBaseUrl === '/api'
    ? (typeof window !== 'undefined' ? window.location.origin : '')
    : apiBaseUrl.replace(/\/api\/?$/, '');

const CONFIG = {
    API_BASE_URL: apiBaseUrl,
    API_ORIGIN: apiOrigin,
    SITE_NAME: 'Coast Canopies Social',
    VERSION: '1.0.0'
};

export default CONFIG;
