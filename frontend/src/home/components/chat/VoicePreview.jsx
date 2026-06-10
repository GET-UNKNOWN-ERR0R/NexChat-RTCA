import React from "react";

const VoicePreview = ({ voice, onSend, onCancel, sending }) => {
    if (!voice) return null;

    return (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1a2332] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5">
                    <h3 className="text-white font-semibold">Voice message</h3>
                    <p className="text-slate-400 text-sm mt-1">Preview before sending</p>
                </div>

                <div className="p-6 flex items-center justify-center bg-black/20">
                    <audio controls src={voice.preview} className="w-full min-w-60" />
                </div>

                <div className="flex gap-3 p-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={sending}
                        className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={sending}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
                    >
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoicePreview;
