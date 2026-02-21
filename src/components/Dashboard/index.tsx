import { useEffect, useState } from 'react';
import { useEarthStore } from '../../store';
import { getAllMediaItems, type MediaItem } from '../../services/db';
import { X, UserRound, MapPin, Globe, Film, Book, Music, LayoutList, ChevronRight } from 'lucide-react';

interface DashboardStats {
    totalItems: number;
    exploredCountries: number;
    movieCount: number;
    bookCount: number;
    musicCount: number;
    topCountries: { name: string; count: number }[];
    recentItems: MediaItem[];
}

export default function Dashboard() {
    const { isDashboardOpen, setDashboardOpen, setActiveCountry } = useEarthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        if (!isDashboardOpen) return;

        const loadStats = async () => {
            const items = await getAllMediaItems();

            const countryCounts: Record<string, number> = {};
            let movieCount = 0;
            let bookCount = 0;
            let musicCount = 0;

            const normalizeISO = (cid: string) => {
                if (!cid) return cid;
                if (cid.includes('省') || cid.includes('市') || cid.includes('自治区') || cid.includes('特别行政区')) return 'CHN';
                return cid;
            };

            items.forEach(item => {
                const countryId = normalizeISO(item.countryId);
                countryCounts[countryId] = (countryCounts[countryId] || 0) + 1;

                if (item.type === 'movie') movieCount++;
                if (item.type === 'book') bookCount++;
                if (item.type === 'music') musicCount++;
            });

            // 仅计算标准的 3 字母 ISO 代码国家为独立的大洲/国家
            const isoKeys = Object.keys(countryCounts).filter(k => /^[A-Z]{3}$/i.test(k));
            const uniqueCountries = isoKeys.length;

            // 排序热门国家，只针对国家 ISO 进行排序
            const sortedCountries = isoKeys
                .map(iso => ({ name: iso, count: countryCounts[iso] }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            const recentItems = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(item => ({
                ...item,
                countryId: normalizeISO(item.countryId) // 修复旧数据的 onClick 跳转
            }));

            setStats({
                totalItems: items.length,
                exploredCountries: uniqueCountries,
                movieCount,
                bookCount,
                musicCount,
                topCountries: sortedCountries,
                recentItems
            });
        };

        loadStats();
    }, [isDashboardOpen]);

    if (!isDashboardOpen) return null;

    const explorePercentage = stats ? ((stats.exploredCountries / 195) * 100).toFixed(1) : '0.0';

    const handleFlyTo = (isoCode: string) => {
        setDashboardOpen(false);
        setActiveCountry(isoCode);
    };

    return (
        <div className="fixed inset-0 z-[100] flex animate-fade-in bg-[#f4ecd8]/80 backdrop-blur-sm">
            {/* Click outside to close */}
            <div className="flex-1 cursor-zoom-out" onClick={() => setDashboardOpen(false)} />

            {/* Main Panel */}
            <div className="w-[500px] max-w-full h-full bg-[#f4ecd8] border-l-[3px] border-[#5c4033] shadow-[-16px_0_32px_rgba(92,64,51,0.2)] flex flex-col animate-slide-left relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5c4033]/5 rounded-bl-full pointer-events-none" />
                <div className="absolute top-12 -left-6 text-[#5c4033]/10 font-bold text-8xl transform -rotate-90 pointer-events-none font-mono">
                    CLASSIFIED
                </div>

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b-[3px] border-[#5c4033] relative z-10 bg-[#f4ecd8]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 border-[2px] border-[#5c4033] bg-[#5c4033] text-[#f4ecd8]">
                            <UserRound size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#5c4033] tracking-widest font-mono">DIGITAL PASSPORT</h2>
                            <p className="text-xs text-[#5c4033]/60 uppercase tracking-widest mt-0.5">Global Memory Archive</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setDashboardOpen(false)}
                        className="p-2 text-[#5c4033] border-[2px] border-transparent hover:border-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 relative z-10">

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border-[2px] border-[#5c4033] bg-[#f4ecd8]" style={{ boxShadow: '4px 4px 0 #5c4033' }}>
                            <div className="flex items-center gap-2 mb-2 opacity-60 text-[#5c4033] font-mono text-xs font-bold">
                                <Globe size={14} /> EXPLORATION
                            </div>
                            <div className="text-3xl font-bold text-[#5c4033] font-mono">
                                {explorePercentage}%
                            </div>
                            <div className="mt-2 h-2 bg-[#5c4033]/20 border border-[#5c4033]">
                                <div className="h-full bg-[#5c4033] transition-all duration-1000" style={{ width: `${explorePercentage}%` }} />
                            </div>
                            <div className="text-[10px] mt-1 text-[#5c4033]/60 italic">
                                {stats?.exploredCountries || 0} / 195 Sovereignties
                            </div>
                        </div>

                        <div className="p-4 border-[2px] border-[#5c4033] bg-[#f4ecd8]" style={{ boxShadow: '4px 4px 0 #5c4033' }}>
                            <div className="flex items-center gap-2 mb-2 opacity-60 text-[#5c4033] font-mono text-xs font-bold">
                                <LayoutList size={14} /> TOTAL ARCHIVES
                            </div>
                            <div className="text-3xl font-bold text-[#5c4033] font-mono">
                                {stats?.totalItems || 0}
                            </div>
                            <div className="mt-2 flex gap-3 text-xs text-[#5c4033] font-mono flex-wrap">
                                <span className="flex items-center gap-1 opacity-80"><Film size={12} /> {stats?.movieCount || 0}</span>
                                <span className="flex items-center gap-1 opacity-80"><Book size={12} /> {stats?.bookCount || 0}</span>
                                <span className="flex items-center gap-1 opacity-80"><Music size={12} /> {stats?.musicCount || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Connections */}
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#5c4033] border-b-[2px] border-[#5c4033] pb-2 mb-4 font-mono uppercase tracking-widest">
                            <MapPin size={16} /> Deepest Connections
                        </h3>
                        <div className="flex flex-col gap-3">
                            {stats?.topCountries.map((c, i) => (
                                <div key={c.name} className="flex justify-between items-center p-3 border-[2px] border-[#5c4033]/20 bg-[#5c4033]/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[#5c4033] text-[#f4ecd8] flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </div>
                                        <span className="font-bold text-[#5c4033] uppercase font-mono">{c.name}</span>
                                    </div>
                                    <div className="font-mono font-bold text-[#5c4033] opacity-60">
                                        {c.count} ENTRIES
                                    </div>
                                </div>
                            ))}
                            {stats?.topCountries.length === 0 && (
                                <div className="text-center italic opacity-50 py-4 font-serif">No data synchronized yet...</div>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#5c4033] border-b-[2px] border-[#5c4033] pb-2 mb-4 font-mono uppercase tracking-widest">
                            <Globe size={16} /> Recent Timeline
                        </h3>
                        <div className="flex flex-col gap-2 relative">
                            {/* Vertical connecting line */}
                            {stats && stats.recentItems.length > 0 && (
                                <div className="absolute left-3 top-4 bottom-4 w-px bg-[#5c4033]/30" />
                            )}

                            {stats?.recentItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleFlyTo(item.countryId)}
                                    className="relative flex items-center gap-4 p-2 pr-4 text-left group hover:bg-[#5c4033]/5 transition-colors"
                                >
                                    <div className="w-6 py-2 bg-[#f4ecd8] relative z-10 flex justify-center">
                                        <div className="w-2 h-2 rounded-full border-[2px] border-[#5c4033] bg-[#f4ecd8] group-hover:bg-[#5c4033] transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] opacity-60 font-mono mb-0.5 uppercase tracking-wider">
                                            {new Date(item.createdAt).toLocaleDateString()} • {item.countryId}
                                        </div>
                                        <div className="font-bold text-sm text-[#5c4033] truncate group-hover:underline decoration-[#5c4033]/40 underline-offset-2">
                                            {item.title}
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-[#5c4033] opacity-0 group-hover:opacity-60 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                                </button>
                            ))}
                            {stats?.recentItems.length === 0 && (
                                <div className="text-center italic opacity-50 py-4 font-serif">Awaiting signals...</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
