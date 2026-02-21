import { useState } from 'react';
import { useEarthStore } from '../../store';
import Logo from '../Logo';

export default function StartPage() {
    const { setShowStartPage } = useEarthStore();
    const [isEntered, setIsEntered] = useState(false);

    const handleEnter = () => {
        setIsEntered(true);
        // 等待退场动画 (总持续约 1200ms) 后彻底卸载该包裹层
        setTimeout(() => {
            setShowStartPage(false);
        }, 1200);
    };

    return (
        // z-50 且完全覆盖屏幕；当 isEntered=true 时该遮蔽层背景延迟 400ms 渐淡以露出由下层 <Earth/> 准备好的场景
        <div className={`landing-container fixed inset-0 z-50 flex items-center justify-center bg-[#F4ECD8] overflow-hidden transition-opacity duration-[800ms] delay-[400ms] ${isEntered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

            {/* 1. 粗野主义大尺度巡航背景层 */}
            <div className="landing-bg-animated" />

            {/* 2. 闪烁及发黄复古暗角层 */}
            <div className="landing-vignette-overlay" />

            {/* 3. 胶片噪点与滚动赛博扫描混合层 */}
            <div className="landing-noise-overlay" />

            {/* 内容框：本身执行离场上滑淡出（快于背景褪去以完成主次分离） */}
            <div
                className={`relative z-10 flex flex-col items-center bg-[#F4ECD8] border-[3px] border-[#5C4033] p-12 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isEntered ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'}`}
                style={{
                    boxShadow: '12px 12px 0px #5C4033', // 实色硬投影
                }}
            >
                {/* 粗野大徽标 */}
                <Logo size={100} className="mb-6 text-[#5C4033] opacity-90 drop-shadow-[5px_5px_0_rgba(92,64,51,0.2)]" />

                {/* 标题：AR为消散呼吸效果 */}
                <h1 className="text-6xl font-handwriting font-bold text-[#5C4033] mb-4 tracking-widest uppercase flex items-center">
                    <span className={`animate-ethereal blur-[1.5px] transition-all duration-700 ${isEntered ? 'opacity-0 blur-[10px]' : ''}`}>AR</span>
                    <span>TEARTH</span>
                </h1>

                {/* 装饰线/分隔 */}
                <div className="w-full border-t-[2px] border-[#5C4033] mb-8" />

                <p className="font-mono text-[#5C4033] mb-12 text-sm tracking-widest uppercase text-center max-w-md">
                    [ Archival Records of Geo-Cultural Memories ]<br />
                    <span className="opacity-70 mt-2 block lowercase">Loading physical data onto cartographic plane...</span>
                </p>

                {/* 粗野主义按钮 */}
                <button
                    disabled={isEntered}
                    onClick={handleEnter}
                    className="group relative px-8 py-3 bg-[#f4ecd8] border-[3px] border-[#5c4033] text-[#5c4033] font-bold tracking-widest uppercase overflow-hidden transition-all duration-0 hover:bg-[#5c4033] hover:text-[#f4ecd8]"
                    style={{
                        boxShadow: isEntered ? 'none' : '6px 6px 0px #5C4033',
                    }}
                    onMouseDown={(e) => {
                        if (!isEntered) e.currentTarget.style.boxShadow = 'none';
                    }}
                    onMouseUp={(e) => {
                        if (!isEntered) e.currentTarget.style.boxShadow = '6px 6px 0px #5C4033';
                    }}
                    onMouseLeave={(e) => {
                        if (!isEntered) e.currentTarget.style.boxShadow = '6px 6px 0px #5C4033';
                    }}
                >
                    <span className="relative z-10">进入档案室</span>
                </button>
            </div>
        </div>
    );
}
