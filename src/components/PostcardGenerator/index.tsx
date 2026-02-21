import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { MediaItem } from '../../services/db';

interface PostcardGeneratorProps {
    item: MediaItem;
    earthImage: string; // Base64 or Blob URL of the WebGL globe
    onComplete: () => void;
}

export default function PostcardGenerator({ item, earthImage, onComplete }: PostcardGeneratorProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Give the DOM a tiny bit to render images before capturing
        const timer = setTimeout(() => setIsReady(true), 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isReady || !printRef.current) return;

        const generate = async () => {
            try {
                const canvas = await html2canvas(printRef.current as HTMLElement, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#f4ecd8', // Archival parchment base
                    scale: 2, // High DPI
                });

                const dataUrl = canvas.toDataURL('image/png');

                // Trigger download
                const link = document.createElement('a');
                link.download = `TEARTH_Archive_${item.id.slice(0, 6)}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error('[TEARTH BUG] Failed to generate postcard:', err);
            } finally {
                onComplete();
            }
        };

        generate();
    }, [isReady, item, onComplete]);

    // Format timestamp nicely
    const dateStr = new Date(item.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
            <div
                ref={printRef}
                className="bg-[#f4ecd8] border-[8px] border-[#5c4033] p-10 flex flex-col font-mono text-[#5c4033] relative overflow-hidden"
                style={{ width: '800px', minHeight: '1100px' }} // Approx A4 aspect ratio or Polaroidish
            >
                {/* Header Section */}
                <div className="flex justify-between items-end border-b-[4px] border-[#5c4033] pb-6 mb-8 relative z-10">
                    <div>
                        <h1 className="text-6xl font-handwriting tracking-widest leading-none mb-2">TEARTH</h1>
                        <p className="text-sm uppercase tracking-[0.2em] font-bold">Top Secret Archive • Copy No. {item.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold uppercase">{item.countryId}</p>
                        <p className="text-xs tracking-wider opacity-80">{item.provinceId || 'NATIONAL'}</p>
                    </div>
                </div>

                {/* Earth Background Cutout Segment */}
                <div className="w-full h-[400px] border-[4px] border-[#5c4033] bg-[#ddcba4] mb-8 relative flex items-center justify-center overflow-hidden" style={{ boxShadow: '8px 8px 0 #5c4033' }}>
                    {/* The globe capture */}
                    <img src={earthImage} className="w-[120%] h-[120%] object-cover opacity-80 mix-blend-multiply" alt="globe capture" />

                    {/* Retro coordinate/grid overlays */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPPHBhdGggZD0iTTAgNDBMNDAgME0wIDBMMDQwIDQwIiBzdHJva2U9IiM1YzQwMzMiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-30 mix-blend-multiply pointer-events-none" />
                </div>

                {/* Content Segment */}
                <div className="flex gap-8 flex-1">
                    {/* Cover Image if exists */}
                    {item.coverImage ? (
                        <div className="w-1/3 flex-shrink-0">
                            <div className="w-full aspect-[2/3] border-[4px] border-[#5c4033] bg-[#ddcba4] relative" style={{ boxShadow: '6px 6px 0 #5c4033' }}>
                                <img src={item.coverImage} className="w-full h-full object-cover grayscale mix-blend-multiply opacity-90" alt="Cover" />
                                <div className="absolute top-0 right-0 p-2 bg-[#5c4033] text-[#f4ecd8] font-bold text-xs uppercase tracking-widest">{item.type}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-1/4 flex-shrink-0 flex items-center justify-center border-[4px] border-[#5c4033] border-dashed text-center opacity-50 p-6">
                            [ NO VISUAL DATA ]
                        </div>
                    )}

                    {/* Meta & Review */}
                    <div className="flex-1 flex flex-col">
                        <h2 className="text-4xl font-bold mb-2 break-all uppercase leading-tight font-serif">{item.title}</h2>

                        <div className="mb-6 flex items-center gap-4 text-sm font-bold opacity-80 tracking-widest">
                            <span className="uppercase border-[2px] border-[#5c4033] px-2 py-1">{item.type}</span>
                            <span>CREATOR: {item.creator || 'UNKNOWN'}</span>
                            <span className="flex">
                                {Array(5).fill(0).map((_, i) => (
                                    <span key={i} className={`text-xl ${i < item.rating ? 'text-[#5c4033]' : 'text-transparent'}`} style={{ WebkitTextStroke: '2px #5c4033' }}>★</span>
                                ))}
                            </span>
                        </div>

                        {item.reviewText && (
                            <div className="flex-1 text-xl leading-relaxed whitespace-pre-wrap font-handwriting border-l-[4px] border-[#5c4033] pl-6 py-2">
                                "{item.reviewText}"
                            </div>
                        )}
                        {!item.reviewText && (
                            <div className="flex-1 text-xl italic opacity-50 font-serif flex items-center">
                                Memory fragments unreadable...
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Stamp */}
                <div className="mt-12 pt-6 border-t-[4px] border-[#5c4033] flex justify-between items-end">
                    <div className="text-xs uppercase tracking-[0.3em] font-bold opacity-70">
                        <p>GENERATED BY TEARTH ENGINE v2.0</p>
                        <p>SECURE TERMINAL</p>
                    </div>
                    <div className="text-right">
                        <div className="w-32 h-32 border-[4px] border-[#5c4033] rounded-full flex items-center justify-center flex-col transform rotate-12 bg-transparent absolute right-6 bottom-6 opacity-80" style={{ backgroundImage: 'linear-gradient(45deg, #f4ecd8 25%, transparent 25%, transparent 75%, #f4ecd8 75%, #f4ecd8), linear-gradient(45deg, #f4ecd8 25%, transparent 25%, transparent 75%, #f4ecd8 75%, #f4ecd8)' }}>
                            <span className="font-bold tracking-widest mb-1 leading-none">AUTHORIZED</span>
                            <span className="text-[10px] font-bold tracking-widest text-center px-4 leading-tight border-t-[2px] border-[#5c4033] pt-1 mt-1">{dateStr}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
