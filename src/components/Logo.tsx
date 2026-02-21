export default function Logo({ className = "", size = 64 }: { className?: string; size?: number | string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* 裁切标/定位符（印章与档案纸质感） */}
            <path d="M10,0 V20 M0,10 H20" stroke="currentColor" strokeWidth="2" />
            <path d="M110,0 V20 M100,10 H120" stroke="currentColor" strokeWidth="2" />
            <path d="M10,100 V120 M0,110 H20" stroke="currentColor" strokeWidth="2" />
            <path d="M110,100 V120 M100,110 H120" stroke="currentColor" strokeWidth="2" />

            {/* 粗野的外装甲/隔离框 */}
            <path d="M 25 25 L 95 25 L 95 95 L 25 95 Z" stroke="currentColor" strokeWidth="6" fill="transparent" />

            {/* 内部网格线/经纬参考线（机械生硬折线） */}
            <line x1="25" y1="42.5" x2="95" y2="42.5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="25" y1="60" x2="95" y2="60" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="25" y1="77.5" x2="95" y2="77.5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />

            <line x1="42.5" y1="25" x2="42.5" y2="95" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="60" y1="25" x2="60" y2="95" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="77.5" y1="25" x2="77.5" y2="95" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />

            {/* 地球投影图块：以最纯粹的几何同心圆切割代替具象图案 */}
            <circle cx="60" cy="60" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" />
            <circle cx="60" cy="60" r="16" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" fill="transparent" />

            {/* 中央数据档案铁十字块 */}
            <rect x="36" y="56" width="48" height="8" fill="currentColor" />
            <rect x="56" y="36" width="8" height="48" fill="currentColor" />

            {/* 条形码型装订/版本记号 */}
            <rect x="30" y="105" width="4" height="10" fill="currentColor" />
            <rect x="38" y="105" width="8" height="10" fill="currentColor" />
            <rect x="50" y="105" width="2" height="10" fill="currentColor" />
            <rect x="56" y="105" width="12" height="10" fill="currentColor" />
            <rect x="72" y="105" width="6" height="10" fill="currentColor" />
            <rect x="82" y="105" width="3" height="10" fill="currentColor" />
            <rect x="88" y="105" width="2" height="10" fill="currentColor" />

            {/* 顶端标识准星 */}
            <rect x="30" y="5" width="60" height="3" fill="currentColor" />
            <circle cx="60" cy="6.5" r="4" fill="currentColor" />
        </svg>
    );
}
