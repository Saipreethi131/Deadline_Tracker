import API from './api';

const getDeadlines = async () => {
    const { data } = await API.get('/deadlines');
    return data;
};

const getUpcomingDeadlines = async () => {
    const { data } = await API.get('/deadlines/upcoming');
    return data;
};

const createDeadline = async (deadlineData) => {
    const { data } = await API.post('/deadlines', deadlineData);
    return data;
};

const updateDeadline = async (id, deadlineData) => {
    const { data } = await API.put(`/deadlines/${id}`, deadlineData);
    return data;
};

const deleteDeadline = async (id) => {
    const { data } = await API.delete(`/deadlines/${id}`);
    return data;
};

const deadlineService = {
    getDeadlines,
    getUpcomingDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline
};

export default deadlineService;
