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

const authService = {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    verifyEmailChange,
};

export default authService;
