import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEarthStore } from '../../store';
import { getItemsByCountry, getItemsByProvince, addMediaItem, deleteMediaItem, updateMediaItem } from '../../services/db';
import type { MediaItem } from '../../services/db';
import { X, Plus, Star, Search, Paperclip, Loader2, Trash2, Edit2, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchTmdb } from '../../services/tmdb';
import { searchBooks } from '../../services/books';
import { searchMusic } from '../../services/music';
import PostcardGenerator from '../PostcardGenerator';

// 极简单色 SVG 图标组件，替代 Emoji 以保持复古高级感
function FilmIcon({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
            <line x1="17" y1="17" x2="22" y2="17" />
        </svg>
    );
}

function BookIcon({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="9" y1="7" x2="16" y2="7" />
            <line x1="9" y1="11" x2="14" y2="11" />
        </svg>
    );
}

function MusicIcon({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    );
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    movie: <FilmIcon size={14} />,
    book: <BookIcon size={14} />,
    music: <MusicIcon size={14} />,
};

export default function SidePanel() {
    const { activeCountry, setActiveCountry, activeProvince, setActiveProvince, triggerDataUpdate, setConfirmModal } = useEarthStore();
    const [items, setItems] = useState<MediaItem[]>([]);
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [editingRecord, setEditingRecord] = useState<MediaItem | null>(null);

    // 明信片状态
    const [printItem, setPrintItem] = useState<MediaItem | null>(null);
    const [earthSnapshot, setEarthSnapshot] = useState<string>('');

    // 显示标题：省份模式显示省份名，国家模式显示国家码
    const displayTitle = activeProvince || activeCountry;

    const loadData = async () => {
        if (!activeCountry) return;
        let data: MediaItem[];
        if (activeProvince) {
            // 省份模式：只加载属于该省份的记录
            data = await getItemsByProvince(activeCountry, activeProvince);
        } else {
            // 国家模式：加载该国家的所有记录（含所有省份）
            data = await getItemsByCountry(activeCountry);
        }
        setItems(data.sort((a, b) => b.createdAt - a.createdAt));
    };

    useEffect(() => {
        loadData();
        setView('list');
        setEditingRecord(null);
    }, [activeCountry, activeProvince]);

    if (!activeCountry) return null;

    return (
        <div className="absolute top-0 right-0 w-96 h-full z-30 bg-[#f4ecd8] border-l-[2px] border-[#5c4033] flex flex-col animate-slide-left" style={{ boxShadow: '-6px 0 0 #5c4033' }}>
            <div className="p-6 flex justify-between items-center border-b border-theme-border/30">
                <h2 className="text-2xl font-handwriting font-bold tracking-wider">{displayTitle}</h2>
                <button onClick={() => {
                    if (activeProvince) {
                        setActiveProvince(null);
                    } else {
                        setActiveCountry(null);
                    }
                }} className="p-1 border-[2px] border-transparent hover:border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] text-[#5c4033]">
                    <X size={24} className="text-theme-border" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative">
                {view === 'list' && (
                    <div className="flex flex-col gap-6 animate-fade-up">
                        <div className="flex justify-between items-center text-sm opacity-70">
                            <span>共收录 {items.length} 个瞬间</span>
                            <button
                                onClick={() => setView('add')}
                                className="flex items-center gap-1 border-[2px] border-[#5c4033] px-2 py-0.5 font-bold text-xs hover:bg-[#5c4033] hover:text-[#f4ecd8] text-[#5c4033]"
                            >
                                <Plus size={16} /> 添加记录
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {items.map(item => (
                                <MediaCard
                                    key={item.id}
                                    item={item}
                                    onEdit={() => {
                                        setEditingRecord(item);
                                        setView('edit');
                                    }}
                                    onDelete={async () => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: '销毁档案确认',
                                            message: '这份载有记忆的档案一旦销毁将无法找回。你确定要执行此操作吗？',
                                            onConfirm: async () => {
                                                await deleteMediaItem(item.id);
                                                await loadData();
                                                triggerDataUpdate(); // 刷新高亮/热力图
                                            }
                                        });
                                    }}
                                    onPrint={() => {
                                        // 截取地球 Canvas
                                        const canvas = document.querySelector('canvas');
                                        if (canvas) {
                                            const dataUrl = canvas.toDataURL('image/png');
                                            setEarthSnapshot(dataUrl);
                                            setPrintItem(item);
                                        }
                                    }}
                                />
                            ))}
                            {items.length === 0 && (
                                <div className="text-center opacity-50 font-handwriting mt-10 text-lg">
                                    这片土地还是空白的...
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {(view === 'add' || view === 'edit') && (
                    <div className="animate-fade-up">
                        <AddForm
                            countryId={activeCountry}
                            provinceId={activeProvince}
                            editingRecord={view === 'edit' ? editingRecord : null}
                            onSaved={() => {
                                setView('list');
                                setEditingRecord(null);
                                loadData();
                                triggerDataUpdate();
                            }}
                            onCancel={() => {
                                setView('list');
                                setEditingRecord(null);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* 明信片生成器容器 (Visually Hidden but mounts to DOM) */}
            {printItem && earthSnapshot && (
                <PostcardGenerator
                    item={printItem}
                    earthImage={earthSnapshot}
                    onComplete={() => {
                        setPrintItem(null);
                        setEarthSnapshot('');
                    }}
                />
            )}
        </div>
    );
}

function AddForm({ countryId, provinceId, editingRecord, onSaved, onCancel }: { countryId: string, provinceId: string | null, editingRecord?: MediaItem | null, onSaved: () => void, onCancel: () => void }) {
    const [title, setTitle] = useState(editingRecord?.title || '');
    const [type, setType] = useState<'book' | 'movie' | 'music'>(editingRecord?.type || 'movie');
    const [review, setReview] = useState(editingRecord?.reviewText || '');
    const [rating, setRating] = useState(editingRecord?.rating || 5);
    const [coverImage, setCoverImage] = useState<string | null>(editingRecord?.coverImage || null);
    const [creator, setCreator] = useState(editingRecord?.creator || '');  // 作者/导演/艺术家
    const [previewUrl, setPreviewUrl] = useState<string | null>(editingRecord?.previewUrl || null);
    const [attachedImages, setAttachedImages] = useState<string[]>(editingRecord?.attachedImages || []);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // 统一搜索结果结构（三种 API 归一化）
    interface UnifiedResult {
        id: string;
        title: string;
        creator: string;
        coverUrl: string | null;
        year: string;
        badge: string;          // 下拉标签（FILM / TV / BOOK / ALBUM）
        subtitle?: string;      // 原名或额外信息
        previewUrl?: string | null;
    }
    const [results, setResults] = useState<UnifiedResult[]>([]);

    // 根据当前类型动态调用对应 API
    const handleSearch = useCallback(async (query: string, mediaType: 'book' | 'movie' | 'music') => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            let unified: UnifiedResult[] = [];

            if (mediaType === 'movie') {
                const tmdbResults = await searchTmdb(query);
                unified = tmdbResults.map(r => ({
                    id: String(r.id),
                    title: r.title,
                    creator: '',
                    coverUrl: r.posterPath,
                    year: r.releaseYear,
                    badge: r.mediaType === 'movie' ? 'FILM' : 'TV',
                    subtitle: r.originalTitle !== r.title ? r.originalTitle : undefined,
                }));
            } else if (mediaType === 'book') {
                const bookResults = await searchBooks(query);
                unified = bookResults.map(r => ({
                    id: r.id,
                    title: r.title,
                    creator: r.creator,
                    coverUrl: r.coverUrl,
                    year: r.releaseYear,
                    badge: 'BOOK',
                }));
            } else {
                const musicResults = await searchMusic(query);
                unified = musicResults.map(r => ({
                    id: String(r.id),
                    title: r.title,
                    creator: r.creator,
                    coverUrl: r.coverUrl,
                    year: r.releaseYear,
                    badge: 'ALBUM',
                    previewUrl: r.previewUrl,
                }));
            }

            setResults(unified);
        } catch {
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // 用户选中一条结果后自动回填
    const handleSelectResult = (r: UnifiedResult) => {
        setTitle(r.title);
        if (r.coverUrl) setCoverImage(r.coverUrl);
        if (r.creator) setCreator(r.creator);
        if (r.previewUrl !== undefined) setPreviewUrl(r.previewUrl);
        setShowSuggestions(false);
        setResults([]);
    };

    // 切换类型时自动重新搜索（如果有输入内容）
    const handleTypeChange = (newType: 'book' | 'movie' | 'music') => {
        setType(newType);
        setResults([]);
        if (title.trim().length >= 2) {
            handleSearch(title, newType);
        }
    };

    const coverInputRef = useRef<HTMLInputElement>(null);
    const attachInputRef = useRef<HTMLInputElement>(null);

    // 将文件转换为 Base64 字符串
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            setCoverImage(base64);
        }
    };

    const handleAttachUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImages: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const base64 = await fileToBase64(files[i]);
                newImages.push(base64);
            }
            setAttachedImages(prev => [...prev, ...newImages]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        if (editingRecord) {
            await updateMediaItem(editingRecord.id, {
                type,
                title,
                creator: creator || '未知',
                coverImage: coverImage || '',
                rating,
                reviewText: review,
                attachedImages,
                previewUrl,
            });
        } else {
            await addMediaItem({
                id: crypto.randomUUID(),
                countryId,
                provinceId,
                type,
                title,
                creator: creator || '未知',
                coverImage: coverImage || '',
                rating,
                reviewText: review,
                attachedImages,
                previewUrl,
                createdAt: Date.now()
            });
        }
        onSaved();
    };

    return (
        <form onSubmit={handleSubmit} className="border-[2px] border-[#5c4033] p-5 bg-[#f4ecd8] flex flex-col gap-5" style={{ boxShadow: '4px 4px 0 #5c4033' }}>
            {/* 封面图 + 标题区域 */}
            <div className="flex gap-4">
                {/* 封面图上传占位框（点击 + 拖拽上传） */}
                <div
                    onClick={() => coverInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                            const base64 = await fileToBase64(file);
                            setCoverImage(base64);
                        }
                    }}
                    className="w-20 h-28 flex-shrink-0 border-[2px] border-dashed border-[#5c4033] flex items-center justify-center cursor-pointer hover:bg-[#5c4033] hover:text-[#f4ecd8] overflow-hidden group"
                >
                    {coverImage ? (
                        <img src={coverImage} className="w-full h-full object-cover" alt="封面" />
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-[#5c4033] group-hover:text-[#f4ecd8]">
                            <Plus size={20} />
                            <span className="font-mono text-[10px] tracking-widest font-bold">COVER</span>
                            <span className="font-mono text-[8px] opacity-50">拖拽/点击</span>
                        </div>
                    )}
                    <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </div>

                {/* 标题搜索栏 + 类型选择 */}
                <div className="flex-1 flex flex-col gap-3">
                    {/* 搜索联想输入栏 */}
                    <div className="relative">
                        <input
                            required
                            value={title}
                            onChange={e => {
                                const v = e.target.value;
                                setTitle(v);
                                setShowSuggestions(v.length > 0);
                                handleSearch(v, type);
                            }}
                            onFocus={() => { if (title.length > 1 && results.length > 0) setShowSuggestions(true); }}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                            placeholder={type === 'movie' ? '搜索影视作品...' : type === 'book' ? '搜索书籍...' : '搜索音乐专辑...'}
                            className="w-full bg-transparent border-b-[2px] border-[#5c4033] p-2 pr-8 focus:outline-none font-handwriting text-lg text-[#5c4033] placeholder-[#5c4033]/50"
                        />
                        {isSearching
                            ? <Loader2 size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5c4033] animate-spin" />
                            : <Search size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5c4033]/40" />
                        }
                        {/* 统一搜索结果下拉 */}
                        {showSuggestions && title.length > 1 && (
                            <div className="absolute top-full left-0 right-0 mt-1 border-[2px] border-[#5c4033] bg-[#f4ecd8] z-10 overflow-hidden max-h-[280px] overflow-y-auto" style={{ boxShadow: '2px 2px 0 #5c4033' }}>
                                {isSearching && results.length === 0 && (
                                    <div className="p-3 text-xs text-[#5c4033] font-mono font-bold text-center">
                                        [ 正在搜索{type === 'movie' ? ' TMDB' : type === 'book' ? ' Google Books' : ' iTunes'}... ]
                                    </div>
                                )}
                                {!isSearching && results.length === 0 && title.length > 1 && (
                                    <div className="flex flex-col items-center gap-2 p-3">
                                        <div className="text-xs text-[#5c4033] font-mono font-bold text-center">
                                            [ 未找到匹配结果 ]
                                        </div>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setShowSuggestions(false);
                                                setResults([]);
                                            }}
                                            className="w-full text-xs font-mono font-bold border-[2px] border-[#5c4033] px-3 py-1.5 text-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] text-center"
                                        >
                                            + 手动录入该作品
                                        </button>
                                    </div>
                                )}
                                {results.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelectResult(r)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#5c4033] hover:text-[#f4ecd8] text-[#5c4033] border-b border-[#5c4033]/20 last:border-b-0 group/item"
                                    >
                                        {/* 缩略封面 */}
                                        <div className="w-9 h-13 flex-shrink-0 border border-[#5c4033]/30 bg-[#5c4033]/5 overflow-hidden">
                                            {r.coverUrl ? (
                                                <img src={r.coverUrl} className="w-full h-full object-cover" alt="" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[8px] font-mono opacity-40">N/A</div>
                                            )}
                                        </div>
                                        {/* 标题 + 年份 + 类型 + 创作者 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold truncate">{r.title}</div>
                                            <div className="text-[10px] font-mono opacity-60 flex items-center gap-2">
                                                <span>{r.year || '----'}</span>
                                                <span className="border border-current px-1">{r.badge}</span>
                                                {r.creator && (
                                                    <span className="truncate italic">{r.creator}</span>
                                                )}
                                                {r.subtitle && !r.creator && (
                                                    <span className="truncate italic">{r.subtitle}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 类型选择：极简 SVG 图标替代 Emoji */}
                    <div className="flex gap-3 text-sm">
                        {(['movie', 'book', 'music'] as const).map(t => (
                            <label
                                key={t}
                                className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 border-[2px] ${type === t ? 'border-[#5c4033] bg-[#5c4033] text-[#f4ecd8]' : 'border-transparent text-[#5c4033] hover:border-[#5c4033]'} `}
                                onClick={() => handleTypeChange(t)}
                            >
                                <input type="radio" checked={type === t} onChange={() => handleTypeChange(t)} className="hidden" />
                                {TYPE_ICONS[t]}
                                <span>{t === 'movie' ? '电影' : t === 'book' ? '书籍' : '音乐'}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* 星级评分 */}
            <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setRating(star)}>
                        <Star size={18} fill={star <= rating ? 'currentColor' : 'none'} className={star <= rating ? 'text-[#5c4033]' : 'text-[#5c4033]/20'} />
                    </button>
                ))}
                <span className="ml-2 text-xs opacity-40">{rating}/5</span>
            </div>

            {/* 日记本式文本框 */}
            <div className="relative">
                <textarea
                    value={review}
                    onChange={e => setReview(e.target.value)}
                    placeholder="写下关于这里的记忆..."
                    className="w-full bg-transparent p-2 text-sm min-h-[100px] focus:outline-none resize-none font-handwriting text-lg text-[#5c4033] placeholder-[#5c4033]/50"
                    style={{
                        borderBottom: 'none',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, var(--color-theme-border, #5c4033) 27px, var(--color-theme-border, #5c4033) 28px)',
                        backgroundSize: '100% 28px',
                        lineHeight: '28px',
                    }}
                />
            </div>

            {/* 插入图片按钮 + 缩略图预览 */}
            <div>
                <button
                    type="button"
                    onClick={() => attachInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#5c4033] border-[2px] border-transparent hover:border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] px-2 py-1 w-fit"
                >
                    <Paperclip size={14} />
                    <span>[ATTACH]</span>
                </button>
                <input ref={attachInputRef} type="file" accept="image/*" multiple onChange={handleAttachUpload} className="hidden" />

                {attachedImages.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {attachedImages.map((img, idx) => (
                            <div key={idx} className="relative w-14 h-14 border-[2px] border-[#5c4033] overflow-hidden group">
                                <img src={img} className="w-full h-full object-cover" alt={`附图${idx + 1} `} />
                                <button
                                    type="button"
                                    onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute top-0 right-0 w-5 h-5 bg-[#f4ecd8] border-l-[2px] border-b-[2px] border-[#5c4033] text-[#5c4033] flex items-center justify-center text-xs font-bold hover:bg-[#5c4033] hover:text-[#f4ecd8]"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 操作按钮：取消（幽灵）+ 保存（主按钮） */}
            <div className="flex justify-end gap-3 text-sm pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-1.5 border-[2px] border-[#5c4033] text-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] font-bold tracking-wide"
                >
                    取消
                </button>
                <button
                    type="submit"
                    className="px-5 py-1.5 border-[2px] border-[#5c4033] bg-[#5c4033] text-[#f4ecd8] hover:bg-[#f4ecd8] hover:text-[#5c4033] font-bold tracking-wide"
                >
                    保存
                </button>
            </div>
        </form>
    );
}

function MediaCard({ item, onEdit, onDelete, onPrint }: { item: MediaItem, onEdit: () => void, onDelete: () => void, onPrint: () => void }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const galleryItems = [item.coverImage, ...(item.attachedImages || [])].filter(Boolean) as string[];

    useEffect(() => {
        if (item.type === 'music' && item.previewUrl) {
            audioRef.current = new Audio(item.previewUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, [item]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Check if there are other audios playing? We don't have a global player manager,
            // but for a simple preview, HTML5 handles it relatively okay though overlaps can happen.
            audioRef.current.play().catch(() => { });
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex gap-4 p-3 border-[2px] border-[#5c4033] bg-[#f4ecd8] group relative" style={{ boxShadow: '3px 3px 0 #5c4033' }}>
            {/* 角落浮动操作按钮 */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={onPrint} title="冲印明信片" className="p-1 text-[#5c4033] bg-[#f4ecd8] border-[2px] border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] shadow-[2px_2px_0_#5c4033] mr-2 font-mono text-xs flex items-center gap-1 font-bold">
                    [PRINT]
                </button>
                <button onClick={onEdit} className="p-1 text-[#5c4033] bg-[#f4ecd8] border-[2px] border-transparent hover:border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8]">
                    <Edit2 size={14} />
                </button>
                <button onClick={onDelete} className="p-1 text-[#5c4033] bg-[#f4ecd8] border-[2px] border-transparent hover:border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8]">
                    <Trash2 size={14} />
                </button>
            </div>

            <div
                className={`w-16 h-20 border-[2px] border-[#5c4033] bg-[#f4ecd8] flex-shrink-0 flex items-center justify-center overflow-hidden relative cursor-pointer ${item.coverImage ? 'group/cover' : ''} ${isPlaying ? 'rounded-full spin-slow border-[#5c4033]/50' : ''}`}
                onClick={() => {
                    if (item.type === 'music' && item.previewUrl) {
                        // 音乐如果有预览，点击封面改为播放控制
                        togglePlay({ stopPropagation: () => { } } as React.MouseEvent);
                    } else if (item.coverImage) {
                        setLightboxIndex(0);
                    }
                }}
            >
                {item.coverImage ? (
                    <>
                        <img src={item.coverImage} className={`w-full h-full object-cover grayscale opacity-90 transition-all ${isPlaying ? 'grayscale-0 opacity-100' : 'group-hover/cover:grayscale-0 group-hover/cover:opacity-100'}`} alt="cover" />
                        {/* Audio preview layer for music */}
                        {item.type === 'music' && item.previewUrl && (
                            <div className={`absolute inset-0 bg-[#5c4033]/50 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}>
                                {isPlaying ? <Pause size={20} className="text-[#f4ecd8]" /> : <Play size={20} className="text-[#f4ecd8]" />}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-[#5c4033] relative">
                        {TYPE_ICONS[item.type] || <Plus size={16} />}
                        {item.type === 'music' && item.previewUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                {isPlaying ? <Pause size={10} className="text-[#5c4033]" /> : <Play size={10} className="text-[#5c4033]" />}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <h3 className="font-bold flex items-center gap-2 pr-12">
                    <span className="opacity-60 flex-shrink-0">{TYPE_ICONS[item.type]}</span>
                    <span className="truncate" title={item.title}>{item.title}</span>
                </h3>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={12} fill={star <= item.rating ? 'currentColor' : 'none'} className={star <= item.rating ? 'text-[#5c4033]' : 'text-[#5c4033]/20'} />
                    ))}
                </div>
                <p className="text-xs text-[#5c4033]/80 line-clamp-3 mt-1 italic font-serif leading-relaxed mb-1">{item.reviewText}</p>

                {/* 附件展示列表 */}
                {item.attachedImages && item.attachedImages.length > 0 && (
                    <div className="flex gap-2 mt-auto flex-wrap pt-1 border-t border-[#5c4033]/10">
                        {item.attachedImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(item.coverImage ? idx + 1 : idx); }}
                                className="w-8 h-8 object-cover border-[1px] border-[#5c4033] cursor-pointer hover:border-[2px] grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
                                alt="attachment thumbnail"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Overlay */}
            {lightboxIndex !== null && galleryItems.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f4ecd8]/90 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}>
                    <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }} className="absolute top-8 right-8 text-[#5c4033] bg-transparent border-[2px] border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] p-2 transition-colors z-10" style={{ boxShadow: '4px 4px 0 #5c4033' }}>
                        <X size={24} />
                    </button>

                    {galleryItems.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex === 0 ? galleryItems.length - 1 : lightboxIndex - 1); }} className="absolute left-8 top-1/2 -translate-y-1/2 text-[#5c4033] bg-[#f4ecd8] border-[2px] border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] p-3 transition-colors z-10" style={{ boxShadow: '4px 4px 0 #5c4033' }}>
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    <div className="max-w-[85vw] max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
                        <img src={galleryItems[lightboxIndex]} className="w-full h-full object-contain border-[4px] border-[#5c4033] bg-[#f4ecd8]" style={{ boxShadow: '12px 12px 0 #5c4033' }} alt="Gallery Full" />
                    </div>

                    {galleryItems.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex === galleryItems.length - 1 ? 0 : lightboxIndex + 1); }} className="absolute right-8 top-1/2 -translate-y-1/2 text-[#5c4033] bg-[#f4ecd8] border-[2px] border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] p-3 transition-colors z-10" style={{ boxShadow: '4px 4px 0 #5c4033' }}>
                            <ChevronRight size={32} />
                        </button>
                    )}

                    {galleryItems.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[#5c4033] font-bold tracking-widest text-lg bg-[#f4ecd8] border-[2px] border-[#5c4033] px-4 py-2" style={{ boxShadow: '4px 4px 0 #5c4033' }}>
                            [ {lightboxIndex + 1} / {galleryItems.length} ]
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
