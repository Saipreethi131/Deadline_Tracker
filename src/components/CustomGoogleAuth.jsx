import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CustomGoogleAuth = ({ mode = 'signin' }) => {
    const { googleLogin } = useAuth();
    const navigate = useNavigate();

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Pass the access_token and let the backend know it's an access_token
                await googleLogin(tokenResponse.access_token, 'access_token');
                navigate('/');
            } catch (error) {
                console.error('Google Auth Error:', error);
            }
        },
        onError: (error) => console.error('Login Failed:', error),
    });

    return (
        <button
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm"
        >
            <FcGoogle className="text-xl" />
            <span>{mode === 'signup' ? 'Continue with Google' : 'Sign in with Google'}</span>
        </button>
    );
};

export default CustomGoogleAuth;
