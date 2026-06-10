import React, { useEffect } from "react";

const VoicePreview = ({ voice, onSend, onCancel, sending }) => {
    useEffect(() => {
        if (!voice) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [voice]);

    if (!voice) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-[#1a2332] rounded-t-2xl md:rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-3 md:p-4 border-b border-white/5">
                    <h3 className="text-white font-semibold text-sm md:text-base">Voice message</h3>
                    <p className="text-slate-400 text-xs md:text-sm mt-0.5">Preview before sending</p>
                </div>

                <div className="p-4 md:p-6 flex items-center justify-center bg-black/20">
                    <audio controls src={voice.preview} className="w-full min-w-0 md:min-w-60" />
                </div>

                <div className="flex gap-2 md:gap-3 p-3 md:p-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={sending}
                        className="flex-1 py-2.5 md:py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition disabled:opacity-50 text-sm md:text-base"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={sending}
                        className="flex-1 py-2.5 md:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50 text-sm md:text-base"
                    >
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoicePreview;
