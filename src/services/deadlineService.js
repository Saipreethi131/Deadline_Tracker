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

const updateNotes = async (id, notes) => {
    const { data } = await API.patch(`/deadlines/${id}/notes`, { notes });
    return data;
};

const getReminderStatus = async () => {
    const { data } = await API.get('/deadlines/reminder-status');
    return data;
};

const sendTestEmail = async () => {
    const { data } = await API.post('/deadlines/test-email');
    return data;
};

const sendTestReminder = async (id) => {
    const { data } = await API.post(`/deadlines/${id}/test-reminder`);
    return data;
};

// Sub-task APIs
const addSubtask = async (id, title) => {
    const { data } = await API.post(`/deadlines/${id}/subtasks`, { title });
    return data;
};

const toggleSubtask = async (id, subtaskId) => {
    const { data } = await API.patch(`/deadlines/${id}/subtasks/${subtaskId}`);
    return data;
};

const deleteSubtask = async (id, subtaskId) => {
    const { data } = await API.delete(`/deadlines/${id}/subtasks/${subtaskId}`);
    return data;
};

// Collaboration APIs
const shareDeadline = async (id, email) => {
    const { data } = await API.post(`/deadlines/${id}/share`, { email });
    return data;
};

const removeCollaborator = async (id, userId) => {
    const { data } = await API.delete(`/deadlines/${id}/share/${userId}`);
    return data;
};

const acceptInvite = async (id) => {
    const { data } = await API.post(`/deadlines/${id}/accept`);
    return data;
};

const rejectInvite = async (id) => {
    const { data } = await API.post(`/deadlines/${id}/reject`);
    return data;
};

const deadlineService = {
    getDeadlines,
    getUpcomingDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    updateNotes,
    getReminderStatus,
    sendTestEmail,
    sendTestReminder,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    shareDeadline,
    removeCollaborator,
    acceptInvite,
    rejectInvite,
};

export default deadlineService;
