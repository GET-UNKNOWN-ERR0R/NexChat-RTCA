import React, { useState, useRef, useEffect } from "react";
import { IoArrowBackSharp, IoEllipsisVertical } from "react-icons/io5";
import { getMediaUrl } from "../../../utils/mediaUrl";
import { isUserOnline } from "../../../utils/onlineStatus";

const ChatHeader = ({
    selectedConversation,
    typing,
    onlineUser,
    onBackUser,
    onOpenProfile,
    onClearChat,
    onExportChat,
    // onBlockUser,
    onDeleteUser,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="relative z-30 flex items-center justify-between px-4 h-17 bg-[#1a2332]/95 backdrop-blur-md border-b border-white/5 shadow-lg shrink-0">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={() => onBackUser(true)}
                    className="md:hidden p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
                >
                    <IoArrowBackSharp size={20} />
                </button>

                <button
                    type="button"
                    onClick={() => onOpenProfile?.(selectedConversation)}
                    className="flex items-center gap-3 min-w-0 hover:opacity-90 transition"
                >
                    <img
                        src={getMediaUrl(selectedConversation?.profilepic, selectedConversation)}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/40"
                    />
                    <div className="text-left min-w-0">
                        <p className="text-white font-semibold truncate">
                            {selectedConversation?.username}
                        </p>
                        {typing ? (
                            <p className="text-emerald-400 text-xs animate-pulse">typing...</p>
                        ) : isUserOnline(onlineUser, selectedConversation?._id) ? (
                            <p className="text-emerald-400 text-xs">online</p>
                        ) : selectedConversation?.lastSeen ? (
                            <p className="text-slate-400 text-xs truncate">
                                last seen {new Date(selectedConversation.lastSeen).toLocaleString()}
                            </p>
                        ) : (
                            <p className="text-slate-500 text-xs">offline</p>
                        )}
                    </div>
                </button>
            </div>

            <div className="relative" ref={menuRef}>
                <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2.5 rounded-full hover:bg-white/10 text-slate-300 transition"
                >
                    <IoEllipsisVertical size={22} />
                </button>

                {menuOpen && (
                    <div className="absolute right-0 top-12 w-48 bg-[#1e2a3a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1 pointer-events-auto">
                        <button
                            type="button"
                            onClick={() => { onExportChat(); setMenuOpen(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition"
                        >
                            Export chat
                        </button>
                        <button
                            type="button"
                            onClick={() => { onClearChat(); setMenuOpen(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                        >
                            Clear chat
                        </button>

                        <button
                            type="button"
                            onClick={() => { onDeleteUser?.(); setMenuOpen(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                        >
                            Delete chat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;
