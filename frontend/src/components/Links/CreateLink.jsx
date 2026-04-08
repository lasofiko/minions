import React, {useState} from 'react';
import apiClient from '../../api/client';
import '../../css/CreateLink.css';

export const CreateLink = () => {
    const [originalUrl, setOriginalUrl] = useState('');
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
            try {
                new URL(originalUrl);
            } catch {
                throw new Error('Введите корректную ссылку (с http:// или https://)');
            }

            const response = await apiClient.post('/links/create', {
                original_url: originalUrl
            });

            setResult(response.data);
            setOriginalUrl('');
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Ошибка создания ссылки');
        } finally {
            setLoading(false);
        }
    };

    const getShortUrl = () => {
        if (!result) return '';
        return `http://localhost:8000/${result.short_code}`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getShortUrl());
    };

    // Генерация QR кода через API
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
        <div className="create-link-container">
            <h2>Создать короткую ссылку</h2>

            <form onSubmit={handleSubmit} className="create-form">
                <div className="form-group">
                    <input
                        type="url"
                        placeholder="Введите длинную ссылку (https://example.com)"
                        value={originalUrl}
                        onChange={(e) => setOriginalUrl(e.target.value)}
                        required
                        disabled={loading}
                        className="url-input"
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" disabled={loading} className="submit-btn">
                    {loading ? 'Создание...' : 'Создать ссылку'}
                </button>
            </form>

            {result && (
                <div className="result-container">
                    <div className="link-result">
                        <h3>Ваша короткая ссылка:</h3>
                        <div className="short-url-box">
                            <span className="short-url">{getShortUrl()}</span>
                            <button onClick={copyToClipboard} className="copy-btn">
                                Копировать
                            </button>
                        </div>
                        <div className="stats">
                            <p>Переходов: {result.clicks_count}</p>
                            <p>Создано: {new Date(result.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="qr-section">
                        <button
                            onClick={() => setShowQR(!showQR)}
                            className="qr-toggle-btn"
                        >
                            {showQR ? 'Скрыть QR-код' : 'Показать QR-код'}
                        </button>

                        {showQR && (
                            <div className="qr-container">
                                <img
                                    src={getQRCodeUrl()}
                                    alt="QR Code"
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        border: '1px solid #ddd',
                                        padding: '10px',
                                        backgroundColor: 'white',
                                        borderRadius: '8px'
                                    }}
                                />
                                <button onClick={downloadQR} className="download-qr-btn">
                                    Скачать QR-код
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};