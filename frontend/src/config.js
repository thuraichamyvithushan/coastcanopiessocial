
const CONFIG = {
    // If we are on Vercel/Production, use relative path /api. 
    // If we are local, use the environment variable or localhost:5000.
    API_BASE_URL: import.meta.env.PROD 
        ? (import.meta.env.VITE_API_BASE_URL || '/api')
        : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'),
    SITE_NAME: 'HO SOCIAL',
    VERSION: '1.0.0'
};

export default CONFIG;
