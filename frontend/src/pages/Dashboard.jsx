import React from 'react';
import {useAuth} from '../contexts/AuthContext';
import {CreateLink} from '../components/Links/CreateLink';
import '../css/Dashboard.css';

export const Dashboard = () => {
    const {user, logout} = useAuth();

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Relink</h1>
                    <p className="welcome-text">
                        Добро пожаловать, {user?.username || user?.email}!
                    </p>
                </div>
                <button onClick={logout} className="logout-btn">
                    Выйти
                </button>
            </header>

            <CreateLink/>
        </div>
    );
};