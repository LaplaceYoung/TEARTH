// TMDB (The Movie Database) 搜索服务
// 文档参考: https://developer.themoviedb.org/reference/search-multi

const TMDB_API_KEY = '62edc808af46d70ad999263a7f0389ad';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

// 搜索结果的统一数据结构
export interface TmdbSearchResult {
    id: number;
    title: string;
    originalTitle: string;
    mediaType: 'movie' | 'tv' | 'person';
    posterPath: string | null;   // 缩略图完整 URL
    releaseYear: string;         // "2024" 或 ""
    overview: string;
}

// 将 TMDB 原始数据归一化
function normalize(item: any): TmdbSearchResult | null {
    const type = item.media_type;
    if (type === 'person') return null; // 跳过人物结果

    const isMovie = type === 'movie';
    const title = isMovie ? item.title : item.name;
    const originalTitle = isMovie ? item.original_title : item.original_name;
    const date = isMovie ? item.release_date : item.first_air_date;

    return {
        id: item.id,
        title: title || originalTitle || '未知',
        originalTitle: originalTitle || title || '',
        mediaType: isMovie ? 'movie' : 'tv',
        posterPath: item.poster_path
            ? `${TMDB_IMG}/w185${item.poster_path}`
            : null,
        releaseYear: date ? date.substring(0, 4) : '',
        overview: item.overview || '',
    };
}

// 防抖计时器引用
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 搜索影视作品（自带 350ms 防抖）
 * 返回最多 8 条归一化结果
 */
export function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
    return new Promise((resolve) => {
        if (debounceTimer) clearTimeout(debounceTimer);

        if (!query || query.trim().length < 2) {
            resolve([]);
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=zh-CN&query=${encodeURIComponent(query.trim())}&page=1&include_adult=false`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
                const data = await res.json();

                const results: TmdbSearchResult[] = (data.results || [])
                    .map(normalize)
                    .filter(Boolean)
                    .slice(0, 8) as TmdbSearchResult[];

                resolve(results);
            } catch (err) {
                console.error('[TEARTH] TMDB 搜索失败:', err);
                resolve([]);
            }
        }, 350);
    });
}
