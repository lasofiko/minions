import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import './LinkStatsTable.css';

export const LinkStatsTable = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Загружаем ссылки при монтировании компонента
    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            // TODO: когда бэкенд будет готов - раскомментировать
            // const response = await apiClient.get('/links');
            // setLinks(response.data);

            // Временные моковые данные для тестирования
            const mockLinks = [
                {
                    id: 1,
                    original_url: 'https://example.com/very/long/url/that/needs/shortening',
                    short_code: 'abc123',
                    short_url: 'http://localhost:8000/abc123',
                    clicks_count: 42,
                    created_at: '2024-01-15T10:30:00',
                    last_clicked_at: '2024-01-20T15:45:00'
                },
                {
                    id: 2,
                    original_url: 'https://google.com/search?q=very+long+search+query',
                    short_code: 'xyz789',
                    short_url: 'http://localhost:8000/xyz789',
                    clicks_count: 7,
                    created_at: '2024-01-16T14:20:00',
                    last_clicked_at: '2024-01-18T09:30:00'
                },
                {
                    id: 3,
                    original_url: 'https://github.com/user/repo/issues/12345',
                    short_code: 'def456',
                    short_url: 'http://localhost:8000/def456',
                    clicks_count: 0,
                    created_at: '2024-01-17T11:00:00',
                    last_clicked_at: null
                }
            ];
            setLinks(mockLinks);

        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка загрузки ссылок');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Ссылка скопирована!');
    };

    const getQRCodeUrl = (shortUrl) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(shortUrl)}`;
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
            alert('QR-код сохранен!');
        } catch (error) {
            alert('Не удалось скачать QR-код');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString('ru-RU');
    };

    if (loading) {
        return <div className="loading">Загрузка ссылок...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (links.length === 0) {
        return (
            <div className="empty-state">
                <p>У вас пока нет ссылок</p>
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
                        <th>QR код</th>
                        <th>Переходы</th>
                        <th>Последний переход</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {links.map((link) => (
                        <tr key={link.id}>
                            <td className="original-url">
                                <a href={link.original_url} target="_blank" rel="noopener noreferrer">
                                    {link.original_url.length > 50
                                        ? link.original_url.substring(0, 50) + '...'
                                        : link.original_url}
                                </a>
                            </td>
                            <td className="short-url">
                                <span>{link.short_url}</span>
                                <button
                                    onClick={() => copyToClipboard(link.short_url)}
                                    className="copy-link-btn"
                                    title="Копировать ссылку"
                                >
                                    📋
                                </button>
                            </td>
                            <td className="qr-cell">
                                <img
                                    src={getQRCodeUrl(link.short_url)}
                                    alt="QR"
                                    className="qr-preview"
                                />
                                <button
                                    onClick={() => downloadQR(link.short_url, link.short_code)}
                                    className="download-qr-btn-small"
                                    title="Скачать QR-код"
                                >
                                    💾
                                </button>
                            </td>
                            <td className="clicks">{link.clicks_count}</td>
                            <td className="last-click">{formatDate(link.last_clicked_at)}</td>
                            <td className="actions">
                                <button
                                    onClick={() => copyToClipboard(link.short_url)}
                                    className="action-btn"
                                    title="Копировать"
                                >
                                    📋
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};