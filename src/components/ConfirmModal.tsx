import { useEarthStore } from '../store';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal() {
    const { confirmModal, setConfirmModal } = useEarthStore();

    if (!confirmModal.isOpen) return null;

    const handleConfirm = () => {
        confirmModal.onConfirm();
        setConfirmModal({ isOpen: false });
    };

    const handleCancel = () => {
        if (confirmModal.onCancel) confirmModal.onCancel();
        setConfirmModal({ isOpen: false });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#f4ecd8]/40 backdrop-blur-sm animate-fade-in" onClick={handleCancel}>
            <div
                className="w-full max-w-md bg-[#f4ecd8] border-[3px] border-[#5c4033] shadow-[12px_12px_0_#5c4033] p-8 relative flex flex-col gap-6 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button icon - optional for confirmation but adds to aesthetic */}
                <button
                    onClick={handleCancel}
                    className="absolute top-4 right-4 text-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] transition-colors p-1"
                >
                    <X size={20} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="bg-[#5c4033] text-[#f4ecd8] p-3 flex-shrink-0">
                        <AlertTriangle size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-handwriting font-bold tracking-wider text-[#5c4033] uppercase">
                            {confirmModal.title || '确认操作'}
                        </h2>
                        <p className="text-[#5c4033] font-serif leading-relaxed italic text-lg">
                            {confirmModal.message}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-2">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 border-[2px] border-[#5c4033] text-[#5c4033] hover:bg-[#5c4033] hover:text-[#f4ecd8] font-bold tracking-widest font-mono text-sm transition-none"
                    >
                        [ 取消 ]
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-2 bg-[#5c4033] text-[#f4ecd8] border-[2px] border-[#5c4033] hover:bg-[#f4ecd8] hover:text-[#5c4033] font-bold tracking-widest font-mono text-sm transition-none"
                    >
                        确认执行
                    </button>
                </div>

                {/* Decorative archival details */}
                <div className="absolute -bottom-1 -left-1 w-4 h-[2px] bg-[#5c4033]/30"></div>
                <div className="absolute -bottom-3 left-8 text-[8px] font-mono text-[#5c4033]/40 tracking-widest">
                    SYSTEM_AUTH_REQUIRED_V2.0
                </div>
            </div>
        </div>
    );
}
