// Google Books 书籍搜索服务（宽容匹配 + 前端二次清洗）
// 文档参考: https://developers.google.com/books/docs/v1/using

export interface BookSearchResult {
    id: string;
    title: string;
    creator: string;
    coverUrl: string | null;
    releaseYear: string;
}

function normalize(item: any): BookSearchResult | null {
    const info = item.volumeInfo;
    if (!info) return null;

    // 封面 URL 强制 https
    let cover: string | null = null;
    if (info.imageLinks?.thumbnail) {
        cover = info.imageLinks.thumbnail.replace(/^http:/, 'https:');
    } else if (info.imageLinks?.smallThumbnail) {
        cover = info.imageLinks.smallThumbnail.replace(/^http:/, 'https:');
    }

    return {
        id: item.id || crypto.randomUUID(),
        title: info.title || '未知书籍',
        creator: info.authors ? info.authors.join(', ') : '未知作者',
        coverUrl: cover,
        releaseYear: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
    };
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 搜索书籍（自带 350ms 防抖）
 * 策略：宽容请求 + 前端二次清洗（必须有书名、作者、封面）
 * 返回最多 8 条高质量结果
 */
export function searchBooks(query: string): Promise<BookSearchResult[]> {
    return new Promise((resolve) => {
        if (debounceTimer) clearTimeout(debounceTimer);

        if (!query || query.trim().length < 2) {
            resolve([]);
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query.trim())}&printType=books&orderBy=relevance&maxResults=20`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Google Books HTTP ${res.status}`);
                const data = await res.json();

                // 前端二次清洗：必须有书名、作者、封面
                const validItems = (data.items || []).filter((item: any) => {
                    const info = item.volumeInfo;
                    return info && info.title && info.authors && info.authors.length > 0 && info.imageLinks?.thumbnail;
                });

                const results: BookSearchResult[] = validItems
                    .map(normalize)
                    .filter(Boolean)
                    .slice(0, 8) as BookSearchResult[];

                resolve(results);
            } catch (err) {
                console.error('[TEARTH] Google Books 搜索失败:', err);
                resolve([]);
            }
        }, 350);
    });
}
