import CONFIG from '../config';

export const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${CONFIG.API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};
