import React, { useEffect } from "react";

const AttachmentPreview = ({ attachment, onSend, onCancel, sending }) => {
    useEffect(() => {
        if (!attachment) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [attachment]);

    if (!attachment) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-[#1a2332] rounded-t-2xl md:rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden max-h-[75vh] md:max-h-none flex flex-col">
                <div className="p-3 md:p-4 border-b border-white/5 shrink-0">
                    <h3 className="text-white font-semibold capitalize text-sm md:text-base">
                        Send {attachment.type}
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm mt-0.5">Preview before sending</p>
                </div>

                <div className="p-3 md:p-4 min-h-32 md:min-h-45 flex items-center justify-center bg-black/20 overflow-y-auto flex-1">
                    {attachment.type === "image" && (
                        <img
                            src={attachment.preview}
                            alt=""
                            className="max-h-48 md:max-h-64 rounded-xl object-contain"
                        />
                    )}
                    {attachment.type === "video" && (
                        <video
                            src={attachment.preview}
                            controls
                            className="max-h-48 md:max-h-64 rounded-xl w-full"
                        />
                    )}
                    {attachment.type === "document" && (
                        <div className="text-center text-slate-300">
                            <p className="text-3xl md:text-4xl mb-2">📄</p>
                            <p className="font-medium text-sm md:text-base">{attachment.file?.name}</p>
                        </div>
                    )}
                    {attachment.type === "location" && (
                        <div className="text-center text-slate-300">
                            <p className="text-3xl md:text-4xl mb-2">📍</p>
                            <p className="text-sm">
                                {attachment.lat?.toFixed(5)}, {attachment.lng?.toFixed(5)}
                            </p>
                            {attachment.address && (
                                <p className="text-xs text-slate-400 mt-1">{attachment.address}</p>
                            )}
                        </div>
                    )}
                    {attachment.type === "camera" && (
                        <img
                            src={attachment.preview}
                            alt=""
                            className="max-h-48 md:max-h-64 rounded-xl object-contain"
                        />
                    )}
                </div>

                <div className="flex gap-2 md:gap-3 p-3 md:p-4 shrink-0 safe-area-bottom">
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

export default AttachmentPreview;
