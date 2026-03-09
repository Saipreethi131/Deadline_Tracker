import API from './api';

const getProfile = async () => {
    const { data } = await API.get('/auth/profile');
    return data;
};

const updateProfile = async (profileData) => {
    const { data } = await API.put('/auth/profile', profileData);
    return data;
};

const changePassword = async (passwordData) => {
    const { data } = await API.put('/auth/change-password', passwordData);
    return data;
};

const deleteAccount = async (password) => {
    const { data } = await API.delete('/auth/account', { data: { password } });
    return data;
};

const verifyEmailChange = async (otpData) => {
    const { data } = await API.post('/auth/profile/verify-email', otpData);
    return data;
};

const requestPasswordReset = async (email) => {
    const { data } = await API.post('/auth/forgot-password', { email });
    return data;
};

const resetPassword = async (payload) => {
    const { data } = await API.post('/auth/reset-password', payload);
    return data;
};

const authService = {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    verifyEmailChange,
    requestPasswordReset,
    resetPassword,
};

export default authService;
