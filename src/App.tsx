
import { useRef } from 'react';
import Earth from './components/Earth';
import { useEarthStore } from './store';
import { Palette, Download, Upload, Globe as GlobeIcon } from 'lucide-react';
import SidePanel from './components/SidePanel';
import StartPage from './components/StartPage';
import Logo from './components/Logo';
import { getAllMediaItems, importMediaItems } from './services/db';

function App() {
  const { theme, setTheme, sidebarOpen, viewState, setViewState, setActiveCountry, showStartPage, triggerDataUpdate } = useEarthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    setTheme(theme === 'retro' ? 'watercolor' : 'retro');
  };

  const handleBackToWorld = () => {
    setViewState('world');
    setActiveCountry(null); // 返回时取消高亮
  };

  const handleExport = async () => {
    try {
      const data = await getAllMediaItems();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TEARTH_Archive_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('导出档案失败！');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('导入新档案将覆盖当前浏览器中的所有记录，是否继续？')) {
      e.target.value = ''; // 清除选择
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (!Array.isArray(data)) throw new Error('无效的档案格式');

        await importMediaItems(data);
        triggerDataUpdate(); // 核心：强制重算 Heatmap 并驱动 3D 地球重渲和侧边栏刷新
        alert('档案恢复成功！');
      } catch (err) {
        console.error(err);
        alert('档案解析失败或数据已损坏！');
      } finally {
        e.target.value = ''; // 无论成功失败，重置 input 状态允许再次导入
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`w-full h-screen relative overflow-hidden theme-${theme} bg-[var(--bg-color)] transition-colors duration-500`}>
      {/* 1.复古制图网格 */}
      <div className="main-bg-grid" />
      {/* 2.羊皮纸老纹理叠加 */}
      <div className="main-bg-texture" />
      {/* 3.四周向中心的暗角光影 */}
      <div className="main-vignette" />

      {/* 始终挂载底层地球（利用 z-10 放置在纯背景之上） */}
      <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-auto">
        <Earth />
      </div>

      {showStartPage && <StartPage />}

      {/* 当开始页展现时，屏蔽右上角的 UI */}
      {(!showStartPage) && (
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-4 animate-fade-up">
          <div className="flex items-center gap-4 mix-blend-multiply opacity-80 select-none text-[#5c4033]">
            <Logo size={42} />
            <h1 className="text-3xl font-handwriting tracking-wide">
              TEARTH
            </h1>
          </div>
          <div className="flex gap-2">
            {viewState === 'country' && (
              <button
                onClick={handleBackToWorld}
                className="px-3 py-2 border-[2px] border-[#5c4033] bg-[#f4ecd8] text-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] font-bold text-sm tracking-widest uppercase transition-none flex items-center justify-center gap-2"
                title="返回世界地图"
                style={{ boxShadow: '3px 3px 0 #5c4033' }}
                onMouseDown={(e) => (e.currentTarget.style.boxShadow = 'none')}
                onMouseUp={(e) => (e.currentTarget.style.boxShadow = '3px 3px 0 #5c4033')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '3px 3px 0 #5c4033')}
              >
                <GlobeIcon size={16} />
                返回
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 border-[2px] border-[#5c4033] bg-[#f4ecd8] text-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] transition-none flex items-center justify-center"
              title="切换手绘主题"
              style={{ boxShadow: '3px 3px 0 #5c4033' }}
              onMouseDown={(e) => (e.currentTarget.style.boxShadow = 'none')}
              onMouseUp={(e) => (e.currentTarget.style.boxShadow = '3px 3px 0 #5c4033')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '3px 3px 0 #5c4033')}
            >
              <Palette size={20} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 border-[2px] border-[#5c4033] bg-[#f4ecd8] text-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] transition-none flex items-center justify-center"
              title="导出当前档案"
              style={{ boxShadow: '3px 3px 0 #5c4033' }}
              onMouseDown={(e) => (e.currentTarget.style.boxShadow = 'none')}
              onMouseUp={(e) => (e.currentTarget.style.boxShadow = '3px 3px 0 #5c4033')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '3px 3px 0 #5c4033')}
            >
              <Download size={20} />
            </button>
            <button
              onClick={handleImportClick}
              className="p-2 border-[2px] border-[#5c4033] bg-[#f4ecd8] text-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] transition-none flex items-center justify-center"
              title="导入外部档案"
              style={{ boxShadow: '3px 3px 0 #5c4033' }}
              onMouseDown={(e) => (e.currentTarget.style.boxShadow = 'none')}
              onMouseUp={(e) => (e.currentTarget.style.boxShadow = '3px 3px 0 #5c4033')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '3px 3px 0 #5c4033')}
            >
              <Upload size={20} />
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}

      {sidebarOpen && <SidePanel />}
    </div>
  );
}

export default App;
