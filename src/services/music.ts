// iTunes Search API 音乐搜索服务（无需 API Key，原生支持 CORS）
// 文档参考: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/

// 统一搜索结果数据结构
export interface MusicSearchResult {
    id: number;
    title: string;           // 专辑名或曲目名
    creator: string;         // 艺术家
    coverUrl: string | null; // 高清封面 URL（600x600）
    releaseYear: string;     // "2024" 或 ""
    previewUrl: string | null; // 30 秒音频预览（预留试听功能）
}

function normalize(item: any): MusicSearchResult | null {
    // entity=song 模式下优先用 trackName（歌曲名），副标题保留专辑名
    const title = item.trackName || item.collectionName;
    if (!title) return null;

    // 将 100x100bb.jpg 替换为 600x600bb.jpg 获取高清黑胶级封面
    let cover: string | null = null;
    const rawArt = item.artworkUrl100 || item.artworkUrl60;
    if (rawArt) {
        cover = rawArt.replace(/\d+x\d+bb\.(jpg|png)$/i, '600x600bb.$1');
    }

    return {
        id: item.trackId || item.collectionId || Math.random(),
        title,
        creator: item.artistName || '未知艺术家',
        coverUrl: cover,
        releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : '',
        previewUrl: item.previewUrl || null,
    };
}

// 去重（同一首歌可能出现在不同专辑中）
function dedupe(results: MusicSearchResult[]): MusicSearchResult[] {
    const seen = new Set<string>();
    return results.filter(r => {
        const key = `${r.title}__${r.creator}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 搜索音乐歌曲（中国区，自带 350ms 防抖）
 * 返回最多 8 条去重后的归一化结果
 */
export function searchMusic(query: string): Promise<MusicSearchResult[]> {
    return new Promise((resolve) => {
        if (debounceTimer) clearTimeout(debounceTimer);

        if (!query || query.trim().length < 2) {
            resolve([]);
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&media=music&entity=song&country=CN&lang=zh_cn&limit=15`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`iTunes HTTP ${res.status}`);
                const data = await res.json();

                const results = dedupe(
                    (data.results || [])
                        .map(normalize)
                        .filter(Boolean) as MusicSearchResult[]
                ).slice(0, 8);

                resolve(results);
            } catch (err) {
                console.error('[TEARTH] iTunes 搜索失败:', err);
                resolve([]);
            }
        }, 350);
    });
}
