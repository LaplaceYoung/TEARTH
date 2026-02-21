import { create } from 'zustand';

export type Theme = 'retro' | 'watercolor';

export type ViewState = 'world' | 'country';

interface EarthState {
    theme: Theme;
    viewState: ViewState;
    activeCountry: string | null;
    activeProvince: string | null;  // 下钻后的省份级选中
    sidebarOpen: boolean;
    showStartPage: boolean; // 新增开始页面状态
    setTheme: (theme: Theme) => void;
    setActiveCountry: (country: string | null) => void;
    setActiveProvince: (province: string | null) => void;
    setViewState: (state: ViewState) => void;
    toggleSidebar: (isOpen: boolean) => void;
    setShowStartPage: (show: boolean) => void; // 新增开始页面状态切换方法

    // 用于强制触发 3D 组件数据刷新
    dataUpdateTrigger: number;
    triggerDataUpdate: () => void;
}

export const useEarthStore = create<EarthState>((set) => ({
    theme: 'retro',
    viewState: 'world',
    activeCountry: null,
    activeProvince: null,
    sidebarOpen: false,
    showStartPage: true, // 默认显示开始页

    setTheme: (theme) => set({ theme }),
    setActiveCountry: (country) => set({ activeCountry: country, activeProvince: null, sidebarOpen: !!country }),
    setActiveProvince: (province) => set({ activeProvince: province, sidebarOpen: !!province }),
    setViewState: (state) => set({ viewState: state }),
    toggleSidebar: (isOpen) => set({ sidebarOpen: isOpen }),
    setShowStartPage: (show) => set({ showStartPage: show }),

    dataUpdateTrigger: 0,
    triggerDataUpdate: () => set((state) => ({ dataUpdateTrigger: state.dataUpdateTrigger + 1 })),
}));
