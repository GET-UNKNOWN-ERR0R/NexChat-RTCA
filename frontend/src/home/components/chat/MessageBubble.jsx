import React, { useEffect, useRef, useState } from "react";

import { getMediaUrl } from "../../../utils/mediaUrl";

import { IoDocumentText } from "react-icons/io5";



const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];



const getReplyPreview = (replyMsg) => {

    if (!replyMsg) return "";

    if (replyMsg.messageType === "image") return "📷 Photo";

    if (replyMsg.messageType === "video") return "🎬 Video";

    if (replyMsg.messageType === "voice") return "🎤 Voice message";

    if (replyMsg.messageType === "document") return `📄 ${replyMsg.documentName || "Document"}`;

    if (replyMsg.messageType === "location") return "📍 Location";

    return replyMsg.message || "Message";

};



const MessageBubble = ({

    message,

    authUser,

    otherUserId,

    showMenu,

    onOpenMenu,

    onReact,

    onDelete,

}) => {

    const bubbleRef = useRef(null);

    const [menuPlacement, setMenuPlacement] = useState("top");



    const isOwn = String(message.senderId) === String(authUser._id);

    const isRead = message.readBy?.some(

        (id) => String(id) === String(otherUserId)

    );



    const isTextMessage = !message.messageType || message.messageType === "text";



    useEffect(() => {

        if (!showMenu || !bubbleRef.current) return;



        const rect = bubbleRef.current.getBoundingClientRect();

        const menuHeight = 220;

        const spaceAbove = rect.top;

        const spaceBelow = window.innerHeight - rect.bottom;



        setMenuPlacement(

            spaceAbove < menuHeight && spaceBelow > spaceAbove ? "bottom" : "top"

        );

    }, [showMenu]);



    const copyText = () => {

        if (!isTextMessage) return;

        navigator.clipboard.writeText(message.message || "");

        onOpenMenu(message, "close");

    };



    return (

        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>

            <div

                ref={bubbleRef}

                className={`relative max-w-[78%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}

            >

                <button

                    type="button"

                    onClick={(e) => {

                        e.stopPropagation();

                        onOpenMenu(message);

                    }}

                    className={`absolute -top-2 ${isOwn ? "-left-8" : "-right-8"} z-20 w-7 h-7 rounded-full bg-[#1e2a3a] border border-white/10 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 ${showMenu ? "opacity-100" : ""} transition-opacity shadow-lg`}

                    aria-label="Message options"

                >

                    ⋮

                </button>

                <div

                    onClick={() => onOpenMenu(message)}

                    className={`relative px-3 py-2 rounded-2xl shadow-md cursor-pointer transition-all ${

                        isOwn

                            ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-md"

                            : "bg-[#1e2a3a] text-slate-100 rounded-bl-md border border-white/5"

                    } ${showMenu ? "ring-2 ring-emerald-400/50" : ""}`}

                >

                    {message.replyTo && (

                        <div className={`mb-2 pl-2 border-l-4 rounded text-xs opacity-90 ${

                            isOwn ? "border-emerald-300 bg-black/10" : "border-emerald-500 bg-black/20"

                        }`}>

                            <p className="font-semibold text-emerald-300 text-[11px]">Reply</p>

                            <p className="truncate max-w-[200px]">{getReplyPreview(message.replyTo)}</p>

                        </div>

                    )}



                    {message.messageType === "image" && (

                        <img

                            src={getMediaUrl(message.imageUrl)}

                            alt=""

                            className="max-w-[240px] rounded-lg mb-1"

                        />

                    )}



                    {message.messageType === "video" && (

                        <video

                            src={getMediaUrl(message.videoUrl)}

                            controls

                            className="max-w-[240px] rounded-lg mb-1"

                        />

                    )}



                    {message.messageType === "voice" && (

                        <audio controls src={getMediaUrl(message.audioUrl)} className="min-w-[200px]" />

                    )}



                    {message.messageType === "document" && (

                        <a

                            href={getMediaUrl(message.documentUrl)}

                            target="_blank"

                            rel="noreferrer"

                            onClick={(e) => e.stopPropagation()}

                            className="flex items-center gap-2 text-emerald-200 hover:underline"

                        >

                            <IoDocumentText size={22} />

                            <span className="text-sm truncate max-w-[180px]">

                                {message.documentName || "Document"}

                            </span>

                        </a>

                    )}



                    {message.messageType === "location" && (

                        <a

                            href={`https://www.google.com/maps?q=${message.location?.lat},${message.location?.lng}`}

                            target="_blank"

                            rel="noreferrer"

                            onClick={(e) => e.stopPropagation()}

                            className="text-emerald-200 underline text-sm"

                        >

                            📍 Shared Location

                        </a>

                    )}



                    {message.messageType === "text" && (

                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">

                            {message.message}

                        </p>

                    )}



                    <div className={`flex items-center gap-1 justify-end mt-1 ${isOwn ? "text-emerald-100/70" : "text-slate-500"}`}>

                        <span className="text-[10px]">

                            {new Date(message.createdAt).toLocaleTimeString("en-IN", {

                                hour: "numeric",

                                minute: "2-digit",

                            })}

                        </span>

                        {isOwn && (

                            <span className={`text-[12px] ${isRead ? "text-sky-300" : "text-emerald-100/60"}`}>

                                {isRead ? "✓✓" : "✓"}

                            </span>

                        )}

                    </div>

                </div>



                {message.reactions?.length > 0 && (

                    <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? "justify-end" : "justify-start"}`}>

                        {[...new Set(message.reactions.map((r) => r.emoji))].map((emoji) => (

                            <span

                                key={emoji}

                                className="text-xs bg-[#1e2a3a] border border-white/10 px-2 py-0.5 rounded-full"

                            >

                                {emoji} {message.reactions.filter((r) => r.emoji === emoji).length}

                            </span>

                        ))}

                    </div>

                )}



                {showMenu && (

                    <div

                        className={`fixed z-[100] flex flex-col bg-[#1e2a3a] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px] ${

                            menuPlacement === "top" ? "" : ""

                        }`}

                        style={(() => {

                            if (!bubbleRef.current) return {};

                            const rect = bubbleRef.current.getBoundingClientRect();

                            if (menuPlacement === "top") {

                                return {

                                    left: isOwn ? undefined : rect.left,

                                    right: isOwn ? window.innerWidth - rect.right : undefined,

                                    bottom: window.innerHeight - rect.top + 8,

                                };

                            }

                            return {

                                left: isOwn ? undefined : rect.left,

                                right: isOwn ? window.innerWidth - rect.right : undefined,

                                top: rect.bottom + 8,

                            };

                        })()}

                        onClick={(e) => e.stopPropagation()}

                    >

                        <div className="flex gap-1 p-2 border-b border-white/5 justify-center bg-[#1e2a3a]">

                            {REACTION_EMOJIS.map((emoji) => (

                                <button

                                    key={emoji}

                                    type="button"

                                    onClick={() => onReact(message._id, emoji)}

                                    className="hover:scale-125 transition text-lg"

                                >

                                    {emoji}

                                </button>

                            ))}

                        </div>

                        <button type="button" onClick={() => onOpenMenu(message, "reply")} className="px-4 py-2.5 text-sm text-left text-slate-200 hover:bg-white/5 bg-[#1e2a3a]">Reply</button>

                        {isTextMessage && (

                            <button type="button" onClick={copyText} className="px-4 py-2.5 text-sm text-left text-slate-200 hover:bg-white/5 bg-[#1e2a3a]">Copy</button>

                        )}

                        {isOwn && (

                            <button type="button" onClick={() => onDelete(message._id)} className="px-4 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 bg-[#1e2a3a]">Delete</button>

                        )}

                    </div>

                )}

            </div>

        </div>

    );

};



export default MessageBubble;

