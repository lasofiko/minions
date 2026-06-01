import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (password !== confirmPassword) {
                    throw new Error('Пароли не совпадают');
                }
                if (password.length < 6) {
                    throw new Error('Пароль должен содержать минимум 6 символов');
                }
                await register(username, email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-[20px] bg-bg-primary max-md:items-start max-md:p-[max(16px,env(safe-area-inset-top))_max(16px,env(safe-area-inset-right))_max(20px,env(safe-area-inset-bottom))_max(16px,env(safe-area-inset-left))] max-md:pt-[max(28px,env(safe-area-inset-top))]">
            <div className="bg-bg-card rounded-[20px] shadow-[var(--shadow)] w-full max-w-[450px] p-[40px] max-md:p-[28px_22px] max-md:rounded-[18px] max-[480px]:p-[22px_18px] max-[480px]:rounded-[16px]">
                <h1 className="text-center text-primary text-[2.5rem] font-bold mb-[10px] tracking-[-0.5px] max-md:text-[2rem] max-[480px]:text-[1.65rem]">Relink</h1>

                <div className="flex gap-[10px] mb-[30px] border-b-[2px] border-border pb-[10px] max-md:mb-[22px]">
                    <button
                        className={`flex-1 p-[10px] cursor-pointer transition-all duration-300 ease-in-out border-none rounded-[10px] text-[1.1rem] font-semibold bg-transparent max-md:p-[12px_10px] max-md:text-[1rem] max-md:min-h-[46px] max-[480px]:text-[0.93rem] max-[480px]:p-[10px_8px] ${
                            isLogin ? 'text-primary bg-[rgba(29,174,247,0.1)] [[data-theme=dark]_&]:bg-[rgba(95,145,170,0.2)]' : 'text-text-secondary'
                        }`}
                        onClick={() => setIsLogin(true)}
                    >
                        Вход
                    </button>
                    <button
                        className={`flex-1 p-[10px] cursor-pointer transition-all duration-300 ease-in-out border-none rounded-[10px] text-[1.1rem] font-semibold bg-transparent max-md:p-[12px_10px] max-md:text-[1rem] max-md:min-h-[46px] max-[480px]:text-[0.93rem] max-[480px]:p-[10px_8px] ${
                            !isLogin ? 'text-primary bg-[rgba(29,174,247,0.1)] [[data-theme=dark]_&]:bg-[rgba(95,145,170,0.2)]' : 'text-text-secondary'
                        }`}
                        onClick={() => setIsLogin(false)}
                    >
                        Регистрация
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="mb-[20px] max-[480px]:mb-[16px]">
                            <input
                                type="text"
                                placeholder="Имя пользователя"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full p-[12px_15px] border-[2px] border-border rounded-[10px] text-[1rem] transition-all duration-300 ease-in-out bg-input-bg text-text-primary focus:outline-none focus:border-primary focus:shadow-[var(--shadow)] placeholder:text-text-secondary placeholder:opacity-85 max-md:p-[14px_14px] max-md:text-[16px] max-md:min-h-[48px]"
                            />
                        </div>
                    )}

                    <div className="mb-[20px] max-[480px]:mb-[16px]">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-[12px_15px] border-[2px] border-border rounded-[10px] text-[1rem] transition-all duration-300 ease-in-out bg-input-bg text-text-primary focus:outline-none focus:border-primary focus:shadow-[var(--shadow)] placeholder:text-text-secondary placeholder:opacity-85 max-md:p-[14px_14px] max-md:text-[16px] max-md:min-h-[48px]"
                        />
                    </div>

                    <div className="mb-[20px] max-[480px]:mb-[16px]">
                        <input
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-[12px_15px] border-[2px] border-border rounded-[10px] text-[1rem] transition-all duration-300 ease-in-out bg-input-bg text-text-primary focus:outline-none focus:border-primary focus:shadow-[var(--shadow)] placeholder:text-text-secondary placeholder:opacity-85 max-md:p-[14px_14px] max-md:text-[16px] max-md:min-h-[48px]"
                        />
                    </div>

                    {!isLogin && (
                        <div className="mb-[20px] max-[480px]:mb-[16px]">
                            <input
                                type="password"
                                placeholder="Подтвердите пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full p-[12px_15px] border-[2px] border-border rounded-[10px] text-[1rem] transition-all duration-300 ease-in-out bg-input-bg text-text-primary focus:outline-none focus:border-primary focus:shadow-[var(--shadow)] placeholder:text-text-secondary placeholder:opacity-85 max-md:p-[14px_14px] max-md:text-[16px] max-md:min-h-[48px]"
                            />
                        </div>
                    )}

                    {error && <div className="bg-[#fff5f5] text-error p-[10px] rounded-[8px] mb-[20px] text-[14px] text-center [[data-theme=dark]_&]:bg-[rgba(252,129,129,0.12)]">{error}</div>}

                    <button type="submit" disabled={loading} className="w-full p-[14px] bg-primary text-white border-none rounded-[10px] text-[1.1rem] font-semibold cursor-pointer transition-all duration-300 ease-in-out enabled:hover:-translate-y-[2px] enabled:hover:shadow-[var(--shadow)] disabled:opacity-60 disabled:cursor-not-allowed max-md:text-[1.05rem] max-md:min-h-[50px]">
                        {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                    </button>
                </form>
            </div>
        </div>
    );
};