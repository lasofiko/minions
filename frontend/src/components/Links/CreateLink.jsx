import React, {useState} from 'react';
import apiClient from '../../api/client';
import QRCode from 'qrcode.react';
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
                throw new Error('Введите корректную ссылку начиная с http:// или https://');
            }

            const response = await apiClient.post('/links', {
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
        const shortUrl = getShortUrl();
        navigator.clipboard.writeText(shortUrl);
        alert('Ссылка скопирована!');
    };

    const downloadQR = () => {
        const canvas = document.getElementById('qr-code-canvas');
        if (canvas) {
            const pngUrl = canvas
                .toDataURL('image/png')
                .replace('image/png', 'image/octet-stream');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `qrcode_${result.short_code}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
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
                                <QRCode
                                    id="qr-code-canvas"
                                    value={getShortUrl()}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
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