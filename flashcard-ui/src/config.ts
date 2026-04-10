export const getApiUrl = () => {
  // Use environment variable if set (production on Render)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback for local development
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5122/api';
  }
  return `http://${hostname}:5122/api`;
};

export const API_URL = getApiUrl();
