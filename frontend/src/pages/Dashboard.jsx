import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CreateLink } from '../components/Links/CreateLink';
import { LinkStatsTable } from '../components/Links/LinkStatsTable';
import '../css/Dashboard.css';

export const Dashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('create'); // 'create' или 'stats'

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Relink</h1>
                    <p className="welcome-text">
                        Добро пожаловать, {user?.username || user?.email || 'пользователь'}!
                    </p>
                </div>

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