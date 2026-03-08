import api from './api';

const analyticsService = {
    getSummary: () => api.get('/analytics/summary').then(r => r.data),
    getByCategory: () => api.get('/analytics/by-category').then(r => r.data),
    getByPriority: () => api.get('/analytics/by-priority').then(r => r.data),
    getTimeline: () => api.get('/analytics/timeline').then(r => r.data),
    getUpcoming: () => api.get('/analytics/upcoming').then(r => r.data),
};

export default analyticsService;
