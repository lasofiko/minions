import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CreateLink } from '../components/Links/CreateLink';
import { LinkStatsTable } from '../components/Links/LinkStatsTable';
import { MoonIcon, SunIcon } from '../components/Icons/ThemeIcons';
import '../css/Dashboard.css';

export const Dashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || 'create';
    });
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Relink</h1>
                    <p className="welcome-text">
                        Привет, {user?.username || user?.email || 'пользователь'}!
                    </p>
                </div>

                <div className="header-right">
                    <div className="nav-buttons">
                        <button
                            className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
                            onClick={() => setActiveTab('create')}
                        >
                            Создать ссылку
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            Мои ссылки
                        </button>
                    </div>

                    <button onClick={toggleTheme} className="theme-toggle">
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    </button>

                    <button onClick={logout} className="logout-btn">
                        Выйти
                    </button>
                </div>
            </header>

            {activeTab === 'create' && <CreateLink />}
            {activeTab === 'stats' && <LinkStatsTable />}
        </div>
    );
};