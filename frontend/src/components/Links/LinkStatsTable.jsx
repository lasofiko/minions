import React, {useState, useEffect} from 'react';
import apiClient from '../../api/client';
import '../../css/LinkStatsTable.css';

export const LinkStatsTable = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterText, setFilterText] = useState('');

    // Добавлены состояния для сортировки
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

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

    const copyToClipboard = (text) => {
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
                <p>У вас пока нет ссылок</p>
                <p>Создайте первую ссылку на странице "Создать"</p>
            </div>
        );
    }

    // Фильтрация
    let processedLinks = links.filter(link => {
        const searchLower = filterText.toLowerCase();
        return (
            (link.original_url && link.original_url.toLowerCase().includes(searchLower)) ||
            (link.short_code && link.short_code.toLowerCase().includes(searchLower))
        );
    });

    // Сортировка
    processedLinks.sort((a, b) => {
        let valA, valB;

        if (sortField === 'created_at') {
            valA = a.created_at ? new Date(a.created_at).getTime() : a.id;
            valB = b.created_at ? new Date(b.created_at).getTime() : b.id;
        } else if (sortField === 'last_clicked_at') {
            valA = a.last_clicked_at ? new Date(a.last_clicked_at).getTime() : 0;
            valB = b.last_clicked_at ? new Date(b.last_clicked_at).getTime() : 0;
        } else if (sortField === 'clicks_count') {
            valA = a.clicks_count || 0;
            valB = b.clicks_count || 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="stats-container">
            <h2>Статистика ссылок</h2>

            {/* Панель с фильтром и сортировкой */}
            <div className="controls-container" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Поиск по ссылкам..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="filter-input"
                    style={{ flex: 1, padding: '10px', boxSizing: 'border-box' }}
                />
                <select
                    value={`${sortField}-${sortOrder}`}
                    onChange={(e) => {
                        const [field, order] = e.target.value.split('-');
                        setSortField(field);
                        setSortOrder(order);
                    }}
                    className="sort-select"
                    style={{ padding: '10px', boxSizing: 'border-box' }}
                >
                    <option value="created_at-desc">По дате создания (сначала новые)</option>
                    <option value="created_at-asc">По дате создания (сначала старые)</option>
                    <option value="clicks_count-desc">По переходам (по убыванию)</option>
                    <option value="clicks_count-asc">По переходам (по возрастанию)</option>
                    <option value="last_clicked_at-desc">По последнему переходу (сначала недавние)</option>
                    <option value="last_clicked_at-asc">По последнему переходу (сначала старые)</option>
                </select>
            </div>

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
                    {processedLinks.map((link) => {
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
                                            onClick={() => copyToClipboard(link.original_url)}
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
                                            onClick={() => copyToClipboard(shortUrl)}
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
                    {processedLinks.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                По вашему запросу ничего не найдено
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};