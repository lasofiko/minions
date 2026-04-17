import React, {useState, useEffect} from 'react';
import apiClient from '../../api/client';
import '../../css/LinkStatsTable.css';

export const LinkStatsTable = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/links/my');
            setLinks(response.data);
        } catch (err) {
            console.error('Ошибка загрузки ссылок:', err);
            setError(err.response?.data?.detail || 'Ошибка загрузки ссылок');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
    };

    const downloadQR = async (shortUrl, shortCode) => {
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `qrcode_${shortCode}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка при скачивании QR:', error);
            alert('Не удалось скачать QR-код');
        }
    };

    const deleteLink = async (shortCode) => {
        if (window.confirm(`Удалить ссылку "${shortCode}"?`)) {
            try {
                await apiClient.delete(`/links/delete?short_code=${shortCode}`);
                fetchLinks();
                alert('Ссылка удалена');
            } catch (err) {
                console.error('Ошибка при удалении:', err);
                alert(err.response?.data?.detail || 'Ошибка при удалении ссылки');
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
            // секунды убраны
        });
    };

    const truncateUrl = (url, maxLength = 50) => {
        if (!url) return '';
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    };

    const getShortUrl = (shortCode) => {
        return `${window.location.origin}/${shortCode}`;
    };

    if (loading) {
        return <div className="loading">Загрузка ссылок...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">{error}</div>
                <button onClick={fetchLinks} className="retry-btn">Повторить</button>
            </div>
        );
    }

    if (links.length === 0) {
        return (
            <div className="empty-state">
                <p>📭 У вас пока нет ссылок</p>
                <p>Создайте первую ссылку на странице "Создать"</p>
            </div>
        );
    }

    return (
        <div className="stats-container">
            <h2>Статистика ссылок</h2>

            <div className="table-wrapper">
                <table className="stats-table">
                    <thead>
                    <tr>
                        <th>Длинная ссылка</th>
                        <th>Короткая ссылка</th>
                        <th>Переходы</th>
                        <th>Последний переход</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {links.map((link) => {
                        const shortUrl = getShortUrl(link.short_code);
                        return (
                            <tr key={link.id}>
                                <td className="original-url">
                                    <div className="original-url-wrapper">
                                        <a
                                            href={link.original_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={link.original_url}
                                            className="original-url-link"
                                        >
                                            {truncateUrl(link.original_url)}
                                        </a>
                                        <button
                                            onClick={() => copyToClipboard(link.original_url, 'Длинная ссылка')}
                                            className="text-btn copy-original-btn"
                                        >
                                            Копировать
                                        </button>
                                    </div>
                                </td>
                                <td className="short-url">
                                    <div className="short-url-wrapper">
                      <span className="short-url-text" title={shortUrl}>
                        {shortUrl}
                      </span>
                                        <button
                                            onClick={() => copyToClipboard(shortUrl, 'Короткая ссылка')}
                                            className="text-btn copy-short-btn"
                                        >
                                            Копировать
                                        </button>
                                    </div>
                                </td>
                                <td className="clicks">
                                    <span className="clicks-count">{link.clicks_count || 0}</span>
                                </td>
                                <td className="last-click">
                                    {formatDate(link.last_clicked_at)}
                                </td>
                                <td className="actions">
                                    <div className="actions-wrapper">
                                        <button
                                            onClick={() => downloadQR(shortUrl, link.short_code)}
                                            className="text-btn download-btn"
                                        >
                                            Скачать QR
                                        </button>
                                        <button
                                            onClick={() => deleteLink(link.short_code)}
                                            className="text-btn delete-btn"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};