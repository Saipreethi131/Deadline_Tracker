import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const register = async (userData) => {
        try {
            const { data } = await API.post('/auth/register', userData);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Registration successful!');
            return data;
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            toast.error(message);
            throw error;
        }
    };

    const login = async (userData) => {
        try {
            const { data } = await API.post('/auth/login', userData);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Login successful!');
            return data;
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            toast.error(message);
            throw error;
        }
    };

    const googleLogin = async (token) => {
        try {
            const { data } = await API.post('/auth/google', { token });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Google Login successful!');
            return data;
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            toast.error(message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        toast.info('Logged out');
    };

    const updateUser = (updatedData) => {
        localStorage.setItem('user', JSON.stringify(updatedData));
        setUser(updatedData);
    };

    return (
        <AuthContext.Provider value={{ user, register, login, googleLogin, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
