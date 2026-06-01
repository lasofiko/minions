/* eslint-disable react-refresh/only-export-components -- контекст и хук намеренно лежат рядом с провайдером */
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient, {
    ACCESS_TOKEN_EXPIRE_DAYS,
    REFRESH_TOKEN_EXPIRE_DAYS,
    getCookieOptions,
} from '../api/client';
import Cookies from 'js-cookie';

export const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = Cookies.get('access_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.get('/auth/me');
            setUser(response.data);
        } catch {
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await apiClient.post('/auth/login', {
            email,
            password,
        });

        // токены в cookies
        Cookies.set('access_token', response.data.access_token, getCookieOptions(ACCESS_TOKEN_EXPIRE_DAYS));
        Cookies.set('refresh_token', response.data.refresh_token, getCookieOptions(REFRESH_TOKEN_EXPIRE_DAYS));

        await checkAuth();
        return response.data;
    };

    const register = async (username, email, password) => {
        const response = await apiClient.post('/auth/register', {
            username,
            email,
            password,
        });

        await login(email, password);
        return response.data;
    };

    const logout = () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
