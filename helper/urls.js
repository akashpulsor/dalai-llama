const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const URLS = {
  WS_DASHBOARD: `${BASE_URL}/ws/dashboard`,
};

// Add default export as well for compatibility
export default URLS;
