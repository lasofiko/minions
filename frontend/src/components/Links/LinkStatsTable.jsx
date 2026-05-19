import React, {useState, useEffect, useRef} from 'react';
import apiClient from '../../api/client';
import '../../css/LinkStatsTable.css';

const SORT_OPTIONS = [
    {value: 'created_at-desc', label: 'По дате создания (сначала новые)'},
    {value: 'created_at-asc', label: 'По дате создания (сначала старые)'},
    {value: 'clicks_count-desc', label: 'По переходам (по убыванию)'},
    {value: 'clicks_count-asc', label: 'По переходам (по возрастанию)'},
    {value: 'last_clicked_at-desc', label: 'По последнему переходу (сначала недавние)'},
    {value: 'last_clicked_at-asc', label: 'По последнему переходу (сначала старые)'},
];

export const LinkStatsTable = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterText, setFilterText] = useState('');

    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [sortMenuOpen, setSortMenuOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    const [editingLink, setEditingLink] = useState(null);
    const [editDescription, setEditDescription] = useState('');

    const handleEditDescription = (link) => {
        setEditingLink(link.short_code);
        setEditDescription(link.description || '');
    };

    const saveDescription = async (shortCode) => {
        try {
            await apiClient.put(`/links/${shortCode}`, { description: editDescription || null });
            setLinks(links.map(l => l.short_code === shortCode ? { ...l, description: editDescription || null } : l));
            setEditingLink(null);
        } catch (err) {
            console.error('Ошибка при обновлении:', err);
            alert(err.response?.data?.detail || 'Ошибка при обновлении описания');
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    useEffect(() => {
        const handlePointerDown = (e) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
                setSortMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    useEffect(() => {
        if (!sortMenuOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setSortMenuOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [sortMenuOpen]);

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
    let processedLinks = links.filter((link) => {
        const searchLower = filterText.toLowerCase();
        return (
            (link.original_url && link.original_url.toLowerCase().includes(searchLower)) ||
            (link.short_code && link.short_code.toLowerCase().includes(searchLower)) ||
            (link.description && link.description.toLowerCase().includes(searchLower))
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

    const sortKey = `${sortField}-${sortOrder}`;
    const activeSortLabel =
        SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? SORT_OPTIONS[0].label;

    const applySortValue = (value) => {
        const lastDash = value.lastIndexOf('-');
        const field = value.slice(0, lastDash);
        const order = value.slice(lastDash + 1);
        setSortField(field);
        setSortOrder(order);
        setSortMenuOpen(false);
    };

    return (
        <div className="stats-container">
            <h2>Статистика ссылок</h2>

            <div className="stats-controls" role="search" aria-label="Поиск и сортировка ссылок">
                <input
                    type="search"
                    placeholder="Поиск по ссылке или описанию..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="filter-input"
                    autoComplete="off"
                />
                <div className="sort-dropdown" ref={sortDropdownRef}>
                    <button
                        type="button"
                        id="sort-dropdown-trigger"
                        className="sort-dropdown-trigger"
                        aria-haspopup="listbox"
                        aria-expanded={sortMenuOpen}
                        aria-controls="sort-dropdown-listbox"
                        aria-label="Сортировка списка"
                        onClick={() => setSortMenuOpen((open) => !open)}
                    >
                        <span className="sort-dropdown-value">{activeSortLabel}</span>
                        <span className="sort-dropdown-chevron" aria-hidden />
                    </button>
                    {sortMenuOpen && (
                        <ul
                            id="sort-dropdown-listbox"
                            className="sort-dropdown-menu"
                            role="listbox"
                            aria-labelledby="sort-dropdown-trigger"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <li key={opt.value} className="sort-dropdown-item" role="presentation">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={opt.value === sortKey}
                                        className={`sort-dropdown-option${opt.value === sortKey ? ' is-active' : ''}`}
                                        onClick={() => applySortValue(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="table-wrapper">
                <table className="stats-table">
                    <thead>
                    <tr>
                        <th>Длинная ссылка</th>
                        <th>Короткая ссылка</th>
                        <th>Описание</th>
                        <th>Переходы</th>
                        <th>Последний переход</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {processedLinks.map((link) => {
                        const shortUrl = getShortUrl(link.short_code);
                        return (
                            <tr key={link.id} className="stats-card-row">
                                <td className="original-url" data-label="Исходная ссылка">
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
                                <td className="short-url" data-label="Короткая ссылка">
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
                                <td className="description" data-label="Описание">
                                    {editingLink === link.short_code ? (
                                        <div className="description-edit">
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                className="description-input"
                                                placeholder="Заметка к ссылке"
                                                maxLength={120}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveDescription(link.short_code);
                                                    if (e.key === 'Escape') setEditingLink(null);
                                                }}
                                            />
                                            <div className="description-edit-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => saveDescription(link.short_code)}
                                                    className="text-btn save-desc-btn"
                                                >
                                                    Сохранить
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingLink(null)}
                                                    className="text-btn cancel-desc-btn"
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="description-view"
                                            onDoubleClick={() => handleEditDescription(link)}
                                            title="Двойной клик — редактировать"
                                        >
                                            <span
                                                className={`description-text${link.description ? '' : ' is-empty'}`}
                                            >
                                                {link.description || 'Без описания'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleEditDescription(link)}
                                                className="text-btn edit-desc-btn"
                                                aria-label="Редактировать описание"
                                                title="Редактировать описание"
                                            >
                                                ✎
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="clicks" data-label="Переходы">
                                    <span className="clicks-count">{link.clicks_count || 0}</span>
                                </td>
                                <td className="last-click" data-label="Последний переход">
                                    {formatDate(link.last_clicked_at)}
                                </td>
                                <td className="actions" data-label="Действия">
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
                        <tr className="stats-empty-row">
                            <td colSpan="6" className="stats-no-results">
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