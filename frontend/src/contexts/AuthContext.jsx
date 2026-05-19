import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import Cookies from 'js-cookie';

export const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// настройки
const ACCESS_TOKEN_EXPIRE_DAYS =
    Number(import.meta.env.VITE_ACCESS_TOKEN_EXPIRE_MINUTES) / (24 * 60);
const REFRESH_TOKEN_EXPIRE_DAYS = Number(
    import.meta.env.VITE_REFRESH_TOKEN_EXPIRE_DAYS
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // есть ли сохраненный токен
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
            // данные текущего пользователя
            const response = await apiClient.get('/auth/me');
            setUser(response.data);
        } catch {
            // токен невалидный
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
        } finally {
            setLoading(false);
        }
    };

    // вход
    const login = async (email, password) => {
        const response = await apiClient.post('/auth/login', {
            email,
            password,
        });

        // токены в cookies
        Cookies.set('access_token', response.data.access_token, {
            expires: ACCESS_TOKEN_EXPIRE_DAYS,
            secure: false,
            sameSite: 'lax',
        });

        Cookies.set('refresh_token', response.data.refresh_token, {
            expires: REFRESH_TOKEN_EXPIRE_DAYS,
            secure: false,
            sameSite: 'lax',
        });

        // данные пользователя
        await checkAuth();
        return response.data;
    };

    // регистрация
    const register = async (username, email, password) => {
        const response = await apiClient.post('/auth/register', {
            username,
            email,
            password,
        });

        await login(email, password);
        return response.data;
    };

    // выход
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
