import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import rewind from '@turf/rewind';
import { useEarthStore } from '../../store';
import { getHeatMapData } from '../../services/db';
import type { HeatMapData } from '../../services/db';

// 支持下钻的国家白名单——只有 public/geo_simplified/ 下有对应文件的国家才触发 fetch
const SUPPORTED_DRILLDOWN: string[] = [
    'AUS', 'AZE', 'CAN', 'CHE', 'CHN', 'DNK', 'ECU', 'ESP',
    'FRA', 'GBR', 'IND', 'ITA', 'NLD', 'NOR', 'NZL', 'PRT', 'THA', 'USA',
];

export default function Earth() {
    const { theme, setActiveCountry, dataUpdateTrigger, activeCountry, viewState, setViewState, activeProvince, setActiveProvince } = useEarthStore();
    const [worldData, setWorldData] = useState<any>(null);
    const [countryData, setCountryData] = useState<any>(null);
    const [isSubRegionLoading, setIsSubRegionLoading] = useState(false);

    // 当前显示的实际数据：世界底图 + 省份叠加（底图国家不删除，靠透明色隐身）
    const globeData = useMemo(() => {
        if (!worldData) return null;
        if (viewState === 'country' && countryData) {
            // 不再 filter 删除底图国家，直接把省份拼接到末尾（后绘制覆盖在上层）
            return {
                ...worldData,
                features: [...worldData.features, ...countryData.features]
            };
        }
        return worldData;
    }, [worldData, countryData, viewState]);

    const [heatMap, setHeatMap] = useState<HeatMapData>({ countries: {}, provinces: {} });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globeRef = useRef<any>(null);

    const oceanColorDataUrl = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = theme === 'retro' ? '#e3d5ba' : '#e0f7fa';
            ctx.fillRect(0, 0, 1, 1);
        }
        return canvas.toDataURL();
    }, [theme]);

    useEffect(() => {
        fetch('/countries.geojson')
            .then(res => res.json())
            .then(data => {
                setWorldData(data);
            });
    }, []);

    // 用 ref 追踪 viewState，避免将其放入 useEffect 依赖数组导致 cleanup 杀死定时器
    const viewStateRef = useRef(viewState);
    useEffect(() => { viewStateRef.current = viewState; }, [viewState]);

    // 下钻请求省级数据——try/catch/finally 防御性编程，杜绝死锁
    useEffect(() => {
        if (!activeCountry) {
            setCountryData(null);
            return;
        }
        // 用 ref 判断防重入，不把 viewState 放在 deps 中
        if (viewStateRef.current === 'country') return;
        // 不在白名单中的国家不触发 fetch，直接跳过
        if (!SUPPORTED_DRILLDOWN.includes(activeCountry)) return;

        let isMounted = true;
        let outerTimer: ReturnType<typeof setTimeout>;

        // 步骤 1：立即显示加载遮罩
        setIsSubRegionLoading(true);

        // 步骤 2：延迟 50ms 确保 React 把遮罩渲染到屏幕
        outerTimer = setTimeout(() => {
            // 步骤 3：再等 1200ms 确保镜头拉近动画（1000ms）跑完
            setTimeout(async () => {
                try {
                    const url = `/geo_simplified/${activeCountry}_provinces.json`;
                    console.log(`[TEARTH] 开始加载: ${url}`);
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
                    const rawJson = await res.json();

                    // 防御性数据校验
                    if (!rawJson || !rawJson.features || !Array.isArray(rawJson.features) || rawJson.features.length === 0) {
                        throw new Error('GeoJSON 无效: features 为空或格式错误');
                    }

                    // 【关键】用 @turf/rewind 修正所有多边形的环绕方向，防止 Earcut 崩溃
                    rawJson.features = rawJson.features.map((f: any, index: number) => {
                        let fixed = f;
                        try {
                            fixed = rewind(f, { reverse: true });
                        } catch (e) {
                            console.warn(`[TEARTH] rewind 第 ${index} 个 feature 失败，使用原始数据:`, e);
                        }
                        // 注入省份标记和归一化 _displayName
                        fixed.isProvince = true;
                        fixed.parentCountry = activeCountry;
                        fixed.provIndex = index;
                        fixed._displayName = fixed.properties.name || fixed.properties.NAME_1 || fixed.properties.name_en || fixed.properties.NAME || `Province_${index}`;
                        return fixed;
                    });

                    console.log(`[TEARTH] 加载并 rewind 省份: ${rawJson.features.length} 个, 首个: ${rawJson.features[0]?._displayName}`);

                    if (isMounted) {
                        setCountryData(rawJson);
                        setViewState('country');
                    }
                } catch (err) {
                    // 加载失败：打印错误 + 回滚到世界地图视图
                    console.error('[TEARTH] 下钻失败，终止操作:', err);
                    if (isMounted) {
                        setCountryData(null);
                        setViewState('world');
                        setActiveCountry(null);
                    }
                } finally {
                    // 【绝对保证】无论成功/失败/异常，300ms 后必定关闭遮罩
                    setTimeout(() => {
                        if (isMounted) setIsSubRegionLoading(false);
                    }, 300);
                }
            }, 1200);
        }, 50);

        return () => {
            isMounted = false;
            clearTimeout(outerTimer);
        };
    }, [activeCountry, setViewState, setActiveCountry]);

    useEffect(() => {
        getHeatMapData().then(data => {
            setHeatMap(data);
        });
    }, [dataUpdateTrigger]);

    // 【关键】heatMap 变化时强制 Globe 重绘多边形颜色
    // react-globe.gl 内部对 polygonCapColor 做引用比较，仅 callback 换新引用才会触发
    // 但即使如此，已渲染的材质可能不更新——需额外 poke polygonsData
    useEffect(() => {
        if (!globeRef.current || !globeData) return;
        // 通过 requestAnimationFrame 确保在下一帧执行，避免与 setState 重叠
        requestAnimationFrame(() => {
            const gl = globeRef.current;
            if (gl) {
                // 重新设置 polygonsData 触发 Globe 内部 diff 重绘
                gl.polygonsData([...(globeData.features || [])]);
            }
        });
    }, [heatMap, globeData]);

    useEffect(() => {
        // 当关闭侧边栏时镜头恢复地球全景
        if (!activeCountry && globeRef.current && viewState === 'world' && !useEarthStore.getState().showStartPage) {
            const currentPos = globeRef.current.pointOfView();
            globeRef.current.pointOfView({ ...currentPos, altitude: 2.2 }, 1000);
        }
    }, [activeCountry, viewState]);

    // 监听 showStartPage 以呈现史诗级入场运镜
    const { showStartPage } = useEarthStore();
    const isFirstMount = useRef(true);

    useEffect(() => {
        const gl = globeRef.current;
        if (!gl) return;

        if (showStartPage) {
            // 当处于开始页面时，地球在极远处的太空静静转动 / 或不显示
            const currentPos = gl.pointOfView();
            gl.pointOfView({ ...currentPos, altitude: 5.0 }, 0);
            isFirstMount.current = false;
        } else {
            // 收到进场指令：如果刚由始发页点入，花 2.5 秒钟平滑从宇宙深处沉浸式拉平至常态
            if (!isFirstMount.current) {
                const currentPos = gl.pointOfView();
                gl.pointOfView({ ...currentPos, altitude: 2.2 }, 2500);
            }
        }
    }, [showStartPage]);

    // 热力色盘——根据记录数返回颜色（复古主题和水彩主题各一套）
    const getHeatColor = (count: number, isRetro: boolean): string => {
        if (isRetro) {
            if (count === 0) return '#E3D5BA';   // 基础浅羊皮纸
            if (count <= 3) return '#D4BB9A';     // 浅复古棕
            if (count <= 10) return '#C4A079';    // 中度复古棕
            return '#A67C52';                      // 深褐色
        } else {
            if (count === 0) return '#ffffff';
            if (count <= 3) return '#fff59d';
            if (count <= 10) return '#ffb74d';
            return '#e64a19';
        }
    };

    // useCallback 包裹——依赖项变化时产生新函数引用，Globe 会重新评估颜色
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPolygonColor = useCallback((d: any) => {
        const isRetro = theme === 'retro';

        // 【最高优先级】下钻模式中，底图国家设为完全透明（隐身术）
        if (viewState === 'country' && activeCountry && !d.isProvince) {
            const p = d.properties;
            if (p.ISO_A3 === activeCountry || p.ADM0_A3 === activeCountry ||
                p.GU_A3 === activeCountry || p.BRK_A3 === activeCountry) {
                return 'rgba(0,0,0,0)';
            }
        }

        // 省份渲染——先判断选中高亮，再查热力图
        if (d.isProvince) {
            const isHighlight = d._displayName === activeProvince;
            if (isHighlight) {
                return isRetro ? '#8B5E3C' : '#ff9800';
            }
            // 用省份归一化名称查询热力数据（从 provinces 字典）
            const provCount = heatMap.provinces[d._displayName] || 0;
            return getHeatColor(provCount, isRetro);
        }

        // 国家渲染——使用 ISO_A3 查询热力数据（从 countries 字典，包含所有省份累加）
        const iso = d.properties.ISO_A3;
        const count = heatMap.countries[iso] || 0;
        return getHeatColor(count, isRetro);
    }, [theme, viewState, activeCountry, activeProvince, heatMap]);

    // 彻底放弃自定义 Material —— 不再传递 polygonCapMaterial 回调

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePolygonClick = (polygon: any, _event: any, coords: { lat: number, lng: number, altitude: number }) => {
        if (viewState === 'world') {
            if (polygon.properties && (polygon.properties.ISO_A3 || polygon.properties.ADM0_A3)) {
                const iso = polygon.properties.ISO_A3 || polygon.properties.ADM0_A3;
                setActiveCountry(iso);
                if (globeRef.current && coords) {
                    // 立刻触发镜头拉近动画（1000ms），数据加载将在 1200ms 后才开始
                    globeRef.current.pointOfView({
                        lat: coords.lat,
                        lng: coords.lng,
                        altitude: 1.5
                    }, 1000);
                }
            }
        } else {
            // 省级下钻模式下点击具体省份
            // 打印全部属性方便排查
            console.log('[TEARTH DEBUG] 点击的省份 properties:', polygon.properties);
            console.log('[TEARTH DEBUG] 点击的省份 _displayName:', polygon._displayName);

            if (polygon._displayName) {
                setActiveProvince(polygon._displayName);
            } else if (polygon.properties && polygon.properties.name) {
                setActiveProvince(polygon.properties.name);
            }
        }
    };

    // 背景色应设置为透明以映射出底部的 CSS 背景主题
    const atmosphereColor = theme === 'retro' ? '#d2b48c' : '#ffffff';
    const strokeColor = theme === 'retro' ? '#5c4033' : '#afb42b';

    if (!globeData) return null;

    return (
        <>
            {isSubRegionLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-transparent">
                    <div className="font-mono text-xl px-6 py-3 border-[2px] border-[#5c4033] bg-[#f4ecd8] text-[#5c4033] font-bold tracking-widest flex items-center gap-3" style={{ boxShadow: '8px 8px 0 #5c4033' }}>
                        <span className="w-3 h-5 bg-[#5c4033] animate-[pulse_0.5s_steps(2,start)_infinite]"></span>
                        载入行政区划边界中...
                    </div>
                </div>
            )}
            <Globe
                ref={globeRef}
                backgroundColor="rgba(0,0,0,0)"
                showGlobe={true}
                globeImageUrl={oceanColorDataUrl}
                showAtmosphere={true}
                atmosphereColor={atmosphereColor}
                atmosphereAltitude={0.15}
                polygonsData={globeData?.features || []}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                polygonAltitude={(d: any) => {
                    const BASE_ALTITUDE = 0.008;
                    // 1. 底图层（未下钻的国家）：基础高度
                    if (!activeCountry) return BASE_ALTITUDE;

                    // 2. 隐身层（被选中的国家底图）：完全降到地底或保持基准，因为它是透明的
                    const p = d.properties;
                    if (activeCountry && !d.isProvince && (
                        p.ISO_A3 === activeCountry || p.ADM0_A3 === activeCountry ||
                        p.GU_A3 === activeCountry || p.BRK_A3 === activeCountry
                    )) {
                        return BASE_ALTITUDE;
                    }

                    // 3. 悬浮层（下钻后的省份，以及周围的其他国家）：稍微高出一丁点，防止 Z-fighting
                    return BASE_ALTITUDE + 0.001;
                }}
                polygonCapColor={getPolygonColor}
                // polygonCapMaterial 已移除——完全使用原生 polygonCapColor 渲染
                polygonSideColor={() => 'rgba(0,0,0,0)'}
                polygonStrokeColor={() => strokeColor}
                onPolygonClick={handlePolygonClick}
            />
        </>
    );
}
