import React, {useState} from 'react';
import apiClient from '../../api/client';

export const CreateLink = () => {
    const [originalUrl, setOriginalUrl] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [showQR, setShowQR] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        setShowQR(false);

        try {
            let urlToProcess = originalUrl.trim();
            if (!urlToProcess.startsWith('http://') && !urlToProcess.startsWith('https://')) {
                urlToProcess = 'https://' + urlToProcess;
            }

            try {
                new URL(urlToProcess);
            } catch {
                throw new Error('Введите корректную ссылку');
            }

            const response = await apiClient.post('/links/create', {
                original_url: urlToProcess,
                description: description || null
            });

            setResult(response.data);
            setOriginalUrl('');
            setDescription('');
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Ошибка создания ссылки');
        } finally {
            setLoading(false);
        }
    };

    const getShortUrl = () => {
        if (!result) return '';
        return `${window.location.origin}/${result.short_code}`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getShortUrl());
    };

    const getQRCodeUrl = () => {
        const url = getShortUrl();
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    };

    const downloadQR = async () => {
        try {
            const response = await fetch(getQRCodeUrl());
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `qrcode_${result.short_code}.png`;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка при скачивании:', error);
            alert('Не удалось скачать QR-код');
        }
    };

    return (
        <div className="max-w-[600px] mx-auto my-[40px] p-[30px] pl-[max(30px,env(safe-area-inset-left))] pr-[max(30px,env(safe-area-inset-right))] pb-[max(30px,env(safe-area-inset-bottom))] bg-[var(--bg-card)] rounded-[20px] shadow-[var(--shadow)] max-md:mx-[max(16px,env(safe-area-inset-right))] max-md:mt-4 max-md:mb-6 max-md:px-[max(18px,env(safe-area-inset-right))] max-md:py-[22px] max-md:pb-[max(22px,env(safe-area-inset-bottom))] max-md:pl-[max(18px,env(safe-area-inset-left))] max-md:rounded-[18px] max-[480px]:mt-3 max-[480px]:mb-5 max-[480px]:mx-[max(12px,env(safe-area-inset-right))] max-[480px]:px-[max(14px,env(safe-area-inset-right))] max-[480px]:py-[18px] max-[480px]:pb-[max(18px,env(safe-area-inset-bottom))] max-[480px]:pl-[max(14px,env(safe-area-inset-left))] max-[480px]:rounded-[16px]">
            <h2 className="mb-5 color-[var(--text-primary)] text-[1.8rem] text-center max-md:text-[1.45rem] max-[480px]:text-[1.25rem]">Создать короткую ссылку</h2>

            <form onSubmit={handleSubmit} className="mb-5">
                <div className="mb-5">
                    <input
                        type="text"
                        placeholder="Введите длинную ссылку (например, example.com)"
                        value={originalUrl}
                        onChange={(e) => setOriginalUrl(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full px-4 py-[14px] text-base border-2 border-[var(--border)] rounded-[12px] transition-all duration-300 ease box-border bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(29,174,247,0.1)] [data-theme='dark']_&:focus:shadow-[0_0_0_3px_rgba(95,145,170,0.2)] disabled:opacity-60 disabled:cursor-not-allowed max-md:text-[16px] max-md:min-h-[48px] max-[480px]:px-[14px] max-[480px]:py-[12px]"
                    />
                </div>
                <div className="mb-5">
                    <input
                        type="text"
                        placeholder="Описание (необязательно)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        className="w-full px-4 py-[14px] text-base border-2 border-[var(--border)] rounded-[12px] transition-all duration-300 ease box-border bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(29,174,247,0.1)] [data-theme='dark']_&:focus:shadow-[0_0_0_3px_rgba(95,145,170,0.2)] disabled:opacity-60 disabled:cursor-not-allowed max-md:text-[16px] max-md:min-h-[48px] max-[480px]:px-[14px] max-[480px]:py-[12px]"
                    />
                </div>

                {error && <div className="bg-[rgba(252,129,129,0.1)] text-[var(--error)] p-3 rounded-[10px] mb-5 text-center text-[14px] border border-[var(--error)]">{error}</div>}

                <button type="submit" disabled={loading} className="w-full p-[14px] bg-[var(--primary)] text-white border-none rounded-[12px] text-[1.1rem] font-semibold cursor-pointer transition-all duration-300 ease hover:-translate-y-[2px] hover:shadow-[0_5px_20px_rgba(29,174,247,0.3)] [data-theme='dark']_&:hover:shadow-[0_5px_20px_rgba(95,145,170,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none max-md:min-h-[50px] max-md:text-[1.05rem] max-[480px]:text-[1rem]">
                    {loading ? 'Создание...' : 'Создать ссылку'}
                </button>
            </form>

            {result && (
                <div className="mt-[30px] p-[25px] bg-[var(--bg-card)] rounded-[16px] animate-[fadeIn_0.3s_ease] shadow-[var(--shadow)]">
                    <div>
                        <h3 className="mb-[15px] text-[var(--text-primary)] text-[1.2rem]">Ваша короткая ссылка:</h3>
                        <div className="flex items-center gap-3 mb-5 flex-wrap max-md:flex-col max-md:items-stretch">
                            <span className="flex-1 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-[10px] break-all font-mono text-[14px] text-[var(--primary)] font-semibold max-md:text-center max-md:text-[12px] max-[480px]:px-3 max-[480px]:py-2 max-[480px]:text-[11px]">{getShortUrl()}</span>
                            <button onClick={copyToClipboard} className="px-5 py-[10px] bg-[var(--success)] text-white border-none rounded-[10px] text-[14px] font-medium cursor-pointer transition-all duration-300 ease whitespace-nowrap hover:-translate-y-[2px] hover:bg-[#218838] hover:shadow-[0_3px_10px_rgba(40,167,69,0.3)] max-md:text-center max-md:flex max-md:justify-center max-[480px]:px-4 max-[480px]:py-2 max-[480px]:text-[12px]">
                                Копировать
                            </button>
                        </div>
                        <div className="pt-[15px] border-t border-[var(--border)] text-[var(--text-secondary)] text-[14px] max-md:text-[12px]">
                            <p className="my-2 text-[var(--primary)] font-semibold">Переходов: {result.clicks_count}</p>
                            <p className="my-2">Создано: {new Date(result.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-[25px] text-center">
                        <div className="flex gap-[15px] justify-center mb-5 flex-wrap max-md:flex-col max-md:gap-[10px]">
                            <button
                                onClick={() => setShowQR(!showQR)}
                                className="px-6 py-[10px] border-none rounded-[10px] text-[14px] font-medium cursor-pointer transition-all duration-300 ease bg-[var(--primary)] text-white hover:-translate-y-[2px] hover:bg-[var(--primary-dark)] hover:shadow-[0_3px_10px_rgba(29,174,247,0.3)] max-md:w-full"
                            >
                                {showQR ? 'Скрыть QR-код' : 'Показать QR-код'}
                            </button>
                            <button onClick={downloadQR} className="px-6 py-[10px] border-none rounded-[10px] text-[14px] font-medium cursor-pointer transition-all duration-300 ease bg-[#17a2b8] text-white hover:-translate-y-[2px] hover:bg-[#138496] hover:shadow-[0_3px_10px_rgba(23,162,184,0.3)] max-md:w-full">
                                Скачать QR-код
                            </button>
                        </div>

                        {showQR && (
                            <div className="mt-5 p-5 bg-[var(--bg-card)] rounded-[16px] inline-block animate-[fadeIn_0.3s_ease]">
                                <img
                                    src={getQRCodeUrl()}
                                    alt="QR Code"
                                    className="block mx-auto"
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        border: '1px solid #ddd',
                                        padding: '10px',
                                        backgroundColor: 'white',
                                        borderRadius: '8px'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};