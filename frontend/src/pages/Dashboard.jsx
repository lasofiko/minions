import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CreateLink } from '../components/Links/CreateLink';
import { LinkStatsTable } from '../components/Links/LinkStatsTable';
import { MoonIcon, SunIcon } from '../components/Icons/ThemeIcons';

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
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <header className="bg-[var(--header-bg)] shadow-[0_2px_10px_rgba(0,0,0,0.1)] px-[max(40px,env(safe-area-inset-right))] pl-[max(40px,env(safe-area-inset-left))] py-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-center sticky top-0 z-100 flex-wrap gap-[15px] max-md:px-[max(16px,env(safe-area-inset-right))] max-md:pl-[max(16px,env(safe-area-inset-left))] max-md:pb-[max(14px,env(safe-area-inset-bottom))] max-md:flex-col max-md:text-center">
                <div>
                    <h1 className="m-0 text-[var(--text-light)] text-[1.8rem] max-md:text-[1.5rem] max-[480px]:text-[1.3rem]">Relink</h1>
                    <p className="mt-[5px] text-[var(--text-light)] text-[0.9rem] opacity-90 max-md:text-[0.82rem]">
                        Привет, {user?.username || user?.email || 'пользователь'}!
                    </p>
                </div>

                <div className="flex gap-[15px] items-center max-md:flex-col max-md:w-full max-md:items-stretch max-md:gap-[12px]">
                    <div className="flex gap-[15px] items-center flex-wrap max-md:justify-center max-md:w-full max-md:max-w-[400px] max-md:mx-auto">
                        <button
                            className={`px-5 py-2 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease hover:-translate-y-[2px] max-md:flex-1 max-md:min-w-0 max-md:px-3 max-md:py-[10px] max-md:text-[0.93rem] max-md:min-h-[46px] max-[480px]:text-[0.85rem] max-[480px]:px-2 ${activeTab === 'create' ? 'bg-white text-[var(--primary)]' : 'bg-white/20 text-white hover:bg-white/30'}`}
                            onClick={() => setActiveTab('create')}
                        >
                            Создать ссылку
                        </button>
                        <button
                            className={`px-5 py-2 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease hover:-translate-y-[2px] max-md:flex-1 max-md:min-w-0 max-md:px-3 max-md:py-[10px] max-md:text-[0.93rem] max-md:min-h-[46px] max-[480px]:text-[0.85rem] max-[480px]:px-2 ${activeTab === 'stats' ? 'bg-white text-[var(--primary)]' : 'bg-white/20 text-white hover:bg-white/30'}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            Мои ссылки
                        </button>
                    </div>

                    <button onClick={toggleTheme} className="max-md:mx-auto p-2 bg-transparent border-none cursor-pointer text-[var(--text-light)] hover:opacity-80 transition-opacity">
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    </button>

                    <button onClick={logout} className="px-5 py-2 bg-white/20 text-white rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease hover:bg-white/30 hover:-translate-y-[2px] max-md:w-full max-md:max-w-[400px] max-md:mx-auto max-md:px-4 max-md:py-[10px] max-md:min-h-[46px]">
                        Выйти
                    </button>
                </div>
            </header>

            {activeTab === 'create' && <CreateLink />}
            {activeTab === 'stats' && <LinkStatsTable />}
        </div>
    );
};