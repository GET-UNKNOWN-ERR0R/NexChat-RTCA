import React, { useRef, useEffect } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { FaMicrophone, FaCamera, FaPlus } from "react-icons/fa";
import { IoSend, IoImage, IoVideocam, IoDocument, IoLocationSharp } from "react-icons/io5";

const ChatInput = ({
    sendData,
    onChange,
    onSubmit,
    showEmoji,
    setShowEmoji,
    replyTo,
    onCancelReply,
    recording,
    recordingTime,
    onStartRecording,
    onStopRecording,
    onOpenCamera,
    onPickAttachment,
    sending,
}) => {
    const imageRef = useRef(null);
    const videoRef = useRef(null);
    const docRef = useRef(null);
    const inputRef = useRef(null);
    const [attachOpen, setAttachOpen] = React.useState(false);

    const hasText = sendData.trim().length > 0;

    useEffect(() => {
        if (replyTo) {
            inputRef.current?.focus();
        }
    }, [replyTo]);

    const pick = (type) => {
        setAttachOpen(false);
        if (type === "image") imageRef.current?.click();
        if (type === "video") videoRef.current?.click();
        if (type === "document") docRef.current?.click();
        if (type === "location") onPickAttachment({ type: "location" });
    };

    return (
        <div className="shrink-0 bg-[#1a2332]/95 backdrop-blur-md border-t border-white/5">
            {replyTo && (
                <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
                    <div className="min-w-0">
                        <p className="text-emerald-400 text-xs font-semibold">Replying</p>
                        <p className="text-slate-300 text-sm truncate">{replyTo.preview}</p>
                    </div>
                    <button type="button" onClick={onCancelReply} className="text-slate-400 hover:text-white px-2">✕</button>
                </div>
            )}

            {attachOpen && (
                <div className="px-4 py-3 grid grid-cols-4 gap-3 border-b border-white/5 bg-[#15202b]">
                    {[
                        { type: "image", icon: IoImage, label: "Photo", color: "text-violet-400" },
                        { type: "video", icon: IoVideocam, label: "Video", color: "text-rose-400" },
                        { type: "document", icon: IoDocument, label: "Document", color: "text-amber-400" },
                        { type: "location", icon: IoLocationSharp, label: "Location", color: "text-emerald-400" },
                    ].map(({ type, icon: Icon, label, color }) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => pick(type)}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition"
                        >
                            <span className={`p-3 rounded-full bg-white/5 ${color}`}>
                                <Icon size={22} />
                            </span>
                            <span className="text-[11px] text-slate-400">{label}</span>
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={onSubmit} className="px-3 py-3">
                <div className="flex items-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowEmoji(!showEmoji)}
                        className="p-2.5 text-amber-400 hover:bg-white/5 rounded-full transition shrink-0"
                    >
                        <BsEmojiSmile size={22} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setAttachOpen(!attachOpen)}
                        className="p-2.5 text-emerald-400 hover:bg-white/5 rounded-full transition shrink-0"
                    >
                        <FaPlus size={20} />
                    </button>

                    <div className="flex-1 flex items-center bg-[#0f1720] rounded-2xl px-4 py-2.5 border border-white/5 focus-within:border-emerald-500/30 transition">
                        <input
                            ref={inputRef}
                            value={sendData}
                            onChange={onChange}
                            type="text"
                            placeholder="Type a message..."
                            className="w-full bg-transparent outline-none text-white placeholder:text-slate-500 text-[15px]"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={onOpenCamera}
                        className="p-2.5 text-sky-400 hover:bg-white/5 rounded-full transition shrink-0"
                        title="Camera"
                    >
                        <FaCamera size={20} />
                    </button>

                    {hasText ? (
                        <button
                            type="submit"
                            disabled={sending}
                            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white transition shrink-0 disabled:opacity-50"
                        >
                            {sending ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                <IoSend size={20} />
                            )}
                        </button>
                    ) : recording ? (
                        <button
                            type="button"
                            onClick={onStopRecording}
                            className="p-2.5 bg-rose-700 hover:bg-rose-600 rounded-full text-white transition shrink-0"
                            title="Stop recording"
                        >
                            <span className="block w-3.5 h-3.5 bg-white rounded-sm" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onStartRecording}
                            className="p-2.5 bg-rose-600 hover:bg-rose-500 rounded-full text-white transition shrink-0"
                            title="Record voice"
                        >
                            <FaMicrophone size={20} />
                        </button>
                    )}
                </div>

                {recording && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-rose-400 text-sm">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        Recording {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
                        <button
                            type="button"
                            onClick={onStopRecording}
                            className="ml-2 px-3 py-1 rounded-lg bg-rose-600/20 text-rose-300 text-xs hover:bg-rose-600/30"
                        >
                            Stop
                        </button>
                    </div>
                )}
            </form>

            <input type="file" accept="image/*" ref={imageRef} className="hidden" onChange={(e) => onPickAttachment({ type: "image", file: e.target.files[0], input: e.target })} />
            <input type="file" accept="video/*" ref={videoRef} className="hidden" onChange={(e) => onPickAttachment({ type: "video", file: e.target.files[0], input: e.target })} />
            <input type="file" ref={docRef} className="hidden" onChange={(e) => onPickAttachment({ type: "document", file: e.target.files[0], input: e.target })} />
        </div>
    );
};

export default ChatInput;
