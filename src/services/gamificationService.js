import API from './api';

const getGamificationStats = async () => {
    const { data } = await API.get('/gamification/stats');
    return data;
};

const gamificationService = { getGamificationStats };
export default gamificationService;
