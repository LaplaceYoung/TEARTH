import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface CountryRecord {
    id: string; // ISO 3166-1 alpha-3, e.g., 'RUS'
    name: string;
    itemCount: number;
}

export interface MediaItem {
    id: string;
    countryId: string;            // 永远必填：国家三字码（如 CHN）
    provinceId: string | null;    // 选填：省份名称（如 "湖北"），国家层面录入时为 null
    type: 'book' | 'movie' | 'music';
    title: string;
    creator: string;
    coverImage: string;
    rating: number;
    reviewText: string;
    attachedImages: string[];
    createdAt: number;
}

// 双层热力图数据结构
export interface HeatMapData {
    countries: Record<string, number>;  // ISO_A3 → 该国家的所有记录总数（含省份）
    provinces: Record<string, number>;  // 省份名 → 该省份自身的记录数
}

interface EarthDBSchema extends DBSchema {
    countries: {
        key: string;
        value: CountryRecord;
    };
    media_items: {
        key: string;
        value: MediaItem;
        indexes: { 'by-country': string };
    };
}

const DB_NAME = 'TEARTH_DB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EarthDBSchema>> | null = null;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<EarthDBSchema>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('countries')) {
                    db.createObjectStore('countries', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('media_items')) {
                    const itemStore = db.createObjectStore('media_items', { keyPath: 'id' });
                    itemStore.createIndex('by-country', 'countryId');
                }
            },
        });
    }
    return dbPromise;
};

// 增加媒体记录——同时维护国家计数器（省份记录也会累加到国家总数）
export const addMediaItem = async (item: MediaItem) => {
    const db = await getDB();
    const tx = db.transaction(['media_items', 'countries'], 'readwrite');

    // 1. 保存实体
    await tx.objectStore('media_items').add(item);

    // 2. 更新国家计数（无论是国家层面还是省份层面录入，国家总数都 +1）
    const countryStore = tx.objectStore('countries');
    const country = await countryStore.get(item.countryId);
    if (country) {
        country.itemCount += 1;
        await countryStore.put(country);
    } else {
        await countryStore.put({
            id: item.countryId,
            name: item.countryId,
            itemCount: 1,
        });
    }

    await tx.done;
};

// 删除媒体记录——同时维护国家计数器
export const deleteMediaItem = async (id: string) => {
    const db = await getDB();
    const tx = db.transaction(['media_items', 'countries'], 'readwrite');
    const itemStore = tx.objectStore('media_items');
    const countryStore = tx.objectStore('countries');

    const item = await itemStore.get(id);
    if (!item) return;

    // 1. 删除实体
    await itemStore.delete(id);

    // 2. 减少国家计数
    const country = await countryStore.get(item.countryId);
    if (country) {
        country.itemCount = Math.max(0, country.itemCount - 1); // 保证不过0
        // 如果想当数目为0时删除该国数据也可以 delete，保留也可以
        await countryStore.put(country);
    }

    await tx.done;
};

// 更新媒体记录（不影响国家或省份总数）
export const updateMediaItem = async (id: string, updates: Partial<MediaItem>) => {
    const db = await getDB();
    const tx = db.transaction('media_items', 'readwrite');
    const itemStore = tx.objectStore('media_items');

    const item = await itemStore.get(id);
    if (item) {
        Object.assign(item, updates);
        await itemStore.put(item);
    }
    await tx.done;
};

// 按 countryId 获取该国家的所有记录（包含省份层面的记录）
export const getItemsByCountry = async (countryId: string): Promise<MediaItem[]> => {
    const db = await getDB();
    return db.getAllFromIndex('media_items', 'by-country', countryId);
};

// 按省份名筛选记录（从国家全部记录中过滤）
export const getItemsByProvince = async (countryId: string, provinceId: string): Promise<MediaItem[]> => {
    const allItems = await getItemsByCountry(countryId);
    return allItems.filter(item => item.provinceId === provinceId);
};

// 双层热力图聚合——同时统计国家总数和省份细分
export const getHeatMapData = async (): Promise<HeatMapData> => {
    const db = await getDB();
    const allItems = await db.getAll('media_items');

    const countries: Record<string, number> = {};
    const provinces: Record<string, number> = {};

    allItems.forEach(record => {
        // 1. 只要有 countryId，该国家总数 +1（自动汇总省份记录到国家）
        if (record.countryId) {
            countries[record.countryId] = (countries[record.countryId] || 0) + 1;
        }
        // 2. 如果有 provinceId，省份独立计数也 +1
        if (record.provinceId) {
            provinces[record.provinceId] = (provinces[record.provinceId] || 0) + 1;
        }
    });

    return { countries, provinces };
};

// 兼容旧接口（已废弃，保留防止其他地方意外调用）
export const getCountryHeatMapData = async (): Promise<Record<string, number>> => {
    const data = await getHeatMapData();
    return data.countries;
};

// --- 用于导入/导出的基建能力 ---

// 导出：获取所有的 MediaItem
export const getAllMediaItems = async (): Promise<MediaItem[]> => {
    const db = await getDB();
    return db.getAll('media_items');
};

// 导入：警告会先清空现有的所有记录，然后全量注入外部的新记录并重建 country 汇总表
export const importMediaItems = async (items: MediaItem[]) => {
    const db = await getDB();
    const tx = db.transaction(['media_items', 'countries'], 'readwrite');
    const itemStore = tx.objectStore('media_items');
    const countryStore = tx.objectStore('countries');

    // 1. 完全清空现有的表
    await itemStore.clear();
    await countryStore.clear();

    // 2. 注入新数据并同步计算国家的分布记录
    const countryCounts: Record<string, number> = {};
    for (const item of items) {
        await itemStore.put(item);
        if (item.countryId) {
            countryCounts[item.countryId] = (countryCounts[item.countryId] || 0) + 1;
        }
    }

    // 3. 补齐 countries 表的记录
    for (const [countryId, count] of Object.entries(countryCounts)) {
        await countryStore.put({
            id: countryId,
            name: countryId,
            itemCount: count
        });
    }

    await tx.done;
};
