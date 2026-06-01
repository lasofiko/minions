import React, {useState, useEffect, useRef} from 'react';
import apiClient from '../../api/client';

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
        return <div className="flex justify-center items-center p-8 text-text-secondary">Загрузка ссылок...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-bg-card rounded-xl shadow-[var(--shadow)] mt-6 text-center border border-border">
                <div className="text-error mb-4 font-medium">{error}</div>
                <button onClick={fetchLinks} className="px-4 py-2 bg-primary text-text-light rounded-lg hover:bg-primary-dark transition-colors">Повторить</button>
            </div>
        );
    }

    if (links.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-bg-card rounded-xl shadow-[var(--shadow)] mt-6 text-center text-text-secondary border border-border">
                <p className="mb-2 text-lg font-medium text-text-primary">У вас пока нет ссылок</p>
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
        <div className="w-full bg-bg-card p-4 md:p-6 rounded-xl shadow-[var(--shadow)] mt-6 border border-border">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Статистика ссылок</h2>

            <div className="flex flex-col md:flex-row gap-4 mb-6" role="search" aria-label="Поиск и сортировка ссылок">
                <input
                    type="search"
                    placeholder="Поиск по ссылке или описанию..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="flex-grow p-3 rounded-lg border border-input-border bg-input-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors placeholder:text-text-secondary"
                    autoComplete="off"
                />
                <div className="relative" ref={sortDropdownRef}>
                    <button
                        type="button"
                        id="sort-dropdown-trigger"
                        className="w-full md:w-auto p-3 flex items-center justify-between gap-2 rounded-lg border border-input-border bg-input-bg text-text-primary hover:bg-bg-secondary transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-haspopup="listbox"
                        aria-expanded={sortMenuOpen}
                        aria-controls="sort-dropdown-listbox"
                        aria-label="Сортировка списка"
                        onClick={() => setSortMenuOpen((open) => !open)}
                    >
                        <span className="truncate">{activeSortLabel}</span>
                        <svg className={`w-4 h-4 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {sortMenuOpen && (
                        <ul
                            id="sort-dropdown-listbox"
                            className="absolute z-10 w-full md:w-80 mt-2 py-1 rounded-lg border border-border bg-bg-card shadow-lg right-0"
                            role="listbox"
                            aria-labelledby="sort-dropdown-trigger"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <li key={opt.value} role="presentation">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={opt.value === sortKey}
                                        className={`w-full text-left px-4 py-2 transition-colors hover:bg-bg-secondary ${opt.value === sortKey ? 'bg-bg-secondary text-primary font-medium' : 'text-text-primary'}`}
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

            <div className="overflow-x-auto border border-border rounded-lg bg-bg-card scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-bg-secondary text-text-secondary text-sm border-b border-border">
                    <tr>
                        <th className="p-4 font-semibold whitespace-nowrap">Длинная ссылка</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Короткая ссылка</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Описание</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Переходы</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Последний переход</th>
                        <th className="p-4 font-semibold whitespace-nowrap">Действия</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm text-text-primary">
                    {processedLinks.map((link) => {
                        const shortUrl = getShortUrl(link.short_code);
                        return (
                            <tr key={link.id} className="hover:bg-bg-secondary/50 transition-colors group">
                                <td className="p-4 min-w-[300px]">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <a
                                            href={link.original_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={link.original_url}
                                            className="flex-1 min-w-0 text-primary text-[13px] break-all hover:underline"
                                        >
                                            {truncateUrl(link.original_url)}
                                        </a>
                                        <button
                                            onClick={() => copyToClipboard(link.original_url)}
                                            className="shrink-0 cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 hover:-translate-y-px active:translate-y-0 text-[#28a745] bg-[#28a745]/10 hover:bg-[#28a745]/20"
                                        >
                                            Копировать
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4 min-w-[220px]">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="font-mono text-[13px] text-text-primary break-all px-2 py-1 rounded-md" title={shortUrl}>
                                            {shortUrl}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(shortUrl)}
                                            className="shrink-0 cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 hover:-translate-y-px active:translate-y-0 text-primary bg-primary/10 hover:bg-primary/20"
                                        >
                                            Копировать
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {editingLink === link.short_code ? (
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                className="w-full p-2 rounded border border-input-border bg-input-bg text-text-primary focus:outline-none focus:border-primary text-sm"
                                                placeholder="Заметка к ссылке"
                                                maxLength={120}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveDescription(link.short_code);
                                                    if (e.key === 'Escape') setEditingLink(null);
                                                }}
                                            />
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => saveDescription(link.short_code)} className="text-xs text-success hover:text-success/80 transition-colors">Сохранить</button>
                                                <button type="button" onClick={() => setEditingLink(null)} className="text-xs text-text-secondary hover:text-text-primary transition-colors">Отмена</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group/edit cursor-pointer" onDoubleClick={() => handleEditDescription(link)} title="Двойной клик — редактировать">
                                            <span className="text-text-secondary">{link.description || '—'}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleEditDescription(link)}
                                                className="text-text-secondary hover:text-primary transition-colors opacity-0 group-hover/edit:opacity-100 md:group-hover:opacity-100"
                                                aria-label="Редактировать описание"
                                                title="Редактировать описание"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                        {link.clicks_count || 0}
                                    </span>
                                </td>
                                <td className="p-4 text-text-secondary whitespace-nowrap">
                                    {formatDate(link.last_clicked_at)}
                                </td>
                                <td className="p-4 min-w-[160px]">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <button
                                            onClick={() => downloadQR(shortUrl, link.short_code)}
                                            className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 hover:-translate-y-px active:translate-y-0 text-[#6c757d] bg-[#6c757d]/10 hover:bg-[#6c757d]/20"
                                            title="Скачать QR код"
                                        >
                                            Скачать QR
                                        </button>
                                        <button
                                            onClick={() => deleteLink(link.short_code)}
                                            className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 hover:-translate-y-px active:translate-y-0 text-[#dc3545] bg-[#dc3545]/10 hover:bg-[#dc3545]/20"
                                            title="Удалить"
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
                            <td colSpan="6" className="p-8 text-center text-text-secondary">
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
