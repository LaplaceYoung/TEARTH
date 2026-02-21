import { create } from 'zustand';

export type Theme = 'retro' | 'watercolor';

export type ViewState = 'world' | 'country';

export interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

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

    activeCategory: 'all' | 'movie' | 'book' | 'music';
    setActiveCategory: (category: 'all' | 'movie' | 'book' | 'music') => void;

    confirmModal: ConfirmModalState;
    setConfirmModal: (modal: Partial<ConfirmModalState>) => void;

    isDashboardOpen: boolean;
    setDashboardOpen: (isOpen: boolean) => void;

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
    activeCategory: 'all',
    confirmModal: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    },
    isDashboardOpen: false,

    setTheme: (theme) => set({ theme }),
    setActiveCategory: (category) => set({ activeCategory: category }),
    setConfirmModal: (modal) => set((state) => ({
        confirmModal: { ...state.confirmModal, ...modal }
    })),
    setDashboardOpen: (isOpen) => set({ isDashboardOpen: isOpen }),
    setActiveCountry: (country) => set({ activeCountry: country, activeProvince: null, sidebarOpen: !!country }),
    setActiveProvince: (province) => set({ activeProvince: province, sidebarOpen: !!province }),
    setViewState: (state) => set({ viewState: state }),
    toggleSidebar: (isOpen) => set({ sidebarOpen: isOpen }),
    setShowStartPage: (show) => set({ showStartPage: show }),

    dataUpdateTrigger: 0,
    triggerDataUpdate: () => set((state) => ({ dataUpdateTrigger: state.dataUpdateTrigger + 1 })),
}));
