import React, { useEffect, useState, useRef, useCallback } from 'react';
import userConversation from '../../Zustans/useConversation';
import { useAuth } from '../../context/AuthContext';
import { TiMessages } from "react-icons/ti";
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { useSocketContext } from '../../context/SocketContext';
import notify from '../../assets/sound/notification.mp3';
import EmojiPicker from "emoji-picker-react";

import ChatHeader from './chat/ChatHeader';
import MessageBubble from './chat/MessageBubble';
import ChatInput from './chat/ChatInput';
import AttachmentPreview from './chat/AttachmentPreview';
import VoicePreview from './chat/VoicePreview';
import { emitTyping, clearTypingEmitter } from '../../utils/typingEmitter';

const getReplyPreview = (msg) => {
    if (!msg) return "";
    if (msg.messageType === "image") return "📷 Photo";
    if (msg.messageType === "video") return "🎬 Video";
    if (msg.messageType === "voice") return "🎤 Voice";
    if (msg.messageType === "document") return `📄 ${msg.documentName || "Document"}`;
    if (msg.messageType === "location") return "📍 Location";
    return msg.message || "Message";
};

const MessageContainer = ({ onBackUser, onOpenProfile }) => {
    const { messages, selectedConversation, setMessage, activeChatId, setActiveChatId, setSelectedConversation } = userConversation();
    const { socket, onlineUser } = useSocketContext();
    const { authUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendData, setSendData] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [typing, setTyping] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [menuMessageId, setMenuMessageId] = useState(null);
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const [pendingVoice, setPendingVoice] = useState(null);

    const lastMessageRef = useRef();
    const messagesContainerRef = useRef();
    const typingTimerRef = useRef(null);
    const prevConversationRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingStreamRef = useRef(null);
    const timerRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const [showCamera, setShowCamera] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const markAsRead = useCallback(async () => {
        if (!selectedConversation?._id) return;
        try {
            await axios.post(`/api/message/read/${selectedConversation._id}`);
        } catch {
            /* read receipt failed silently */
        }
    }, [selectedConversation?._id]);

    useEffect(() => {
        const handleNewMessage = (newMessage) => {
            const chatId = selectedConversation?._id;
            const sender = String(newMessage.senderId);
            const receiver = String(newMessage.reciverId);
            if (sender !== chatId && receiver !== chatId) return;

            if (String(newMessage.senderId) !== String(authUser._id)) {
                new Audio(notify).play().catch(() => { });
            }

            setMessage((prev) => {
                if (prev.some((m) => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });

            if (
                String(newMessage.reciverId) === String(authUser._id) &&
                String(activeChatId) === String(newMessage.senderId)
            ) {
                markAsRead();
            }
        };

        socket?.on("newMessage", handleNewMessage);
        return () => socket?.off("newMessage", handleNewMessage);
    }, [socket, selectedConversation, authUser, activeChatId, setMessage, markAsRead]);

    useEffect(() => {
        const handleTyping = ({ senderId }) => {
            if (String(senderId) !== String(selectedConversation?._id)) return;
            setTyping(true);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setTyping(false), 2500);
        };

        const handleStopTyping = ({ senderId }) => {
            if (String(senderId) !== String(selectedConversation?._id)) return;
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            setTyping(false);
        };

        socket?.on("typing", handleTyping);
        socket?.on("stopTyping", handleStopTyping);
        return () => {
            socket?.off("typing", handleTyping);
            socket?.off("stopTyping", handleStopTyping);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
    }, [socket, selectedConversation?._id]);

    useEffect(() => () => clearTypingEmitter(), []);

    useEffect(() => {
        if (!selectedConversation?._id || !authUser?._id) return;

        setActiveChatId(selectedConversation._id);
        socket?.emit("chatActive", {
            userId: authUser._id,
            chattingWith: selectedConversation._id,
        });

        return () => {
            socket?.emit("chatInactive", { userId: authUser._id });
            setActiveChatId(null);
        };
    }, [socket, selectedConversation?._id, authUser?._id, setActiveChatId]);

    useEffect(() => {
        const handleDelete = (id) => {
            setMessage((prev) => prev.filter((m) => m._id !== id));
        };
        socket?.on("messageDeleted", handleDelete);
        return () => socket?.off("messageDeleted", handleDelete);
    }, [socket, setMessage]);

    useEffect(() => {
        const handleUpdate = (updated) => {
            setMessage((prev) =>
                prev.map((m) => (m._id === updated._id ? updated : m))
            );
        };
        socket?.on("messageUpdated", handleUpdate);
        return () => socket?.off("messageUpdated", handleUpdate);
    }, [socket, setMessage]);

    useEffect(() => {
        const handleRead = ({ readerId, senderId, messageIds }) => {
            if (String(senderId) !== String(authUser._id)) return;
            const ids = new Set((messageIds || []).map(String));

            setMessage((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                return list.map((m) => {
                    if (!ids.has(String(m._id))) return m;
                    const readBy = Array.isArray(m.readBy) ? m.readBy : [];

                    // Add readerId only if missing; keep existing readBy as-is
                    if (readBy.some((id) => String(id) === String(readerId))) return m;
                    return { ...m, readBy: [...readBy, readerId] };
                });
            });
        };
        socket?.on("messagesRead", handleRead);
        return () => socket?.off("messagesRead", handleRead);
    }, [socket, authUser, setMessage]);

    useEffect(() => {
        const handleProfileUpdated = (updated) => {
            if (
                selectedConversation &&
                String(selectedConversation._id) === String(updated._id)
            ) {
                setSelectedConversation({ ...selectedConversation, ...updated });
            }
        };
        socket?.on("profileUpdated", handleProfileUpdated);
        return () => socket?.off("profileUpdated", handleProfileUpdated);
    }, [socket, selectedConversation, setSelectedConversation]);

    useEffect(() => {
        const handleClear = ({ otherUserId, clearedBy }) => {
            if (
                String(clearedBy) === String(authUser._id) &&
                String(otherUserId) === String(selectedConversation?._id)
            ) {
                setMessage([]);
            }
        };
        socket?.on("chatCleared", handleClear);
        return () => socket?.off("chatCleared", handleClear);
    }, [socket, selectedConversation, authUser, setMessage]);

    useEffect(() => {
        if (loading) return;

        const isNewConversation =
            prevConversationRef.current !== selectedConversation?._id;
        prevConversationRef.current = selectedConversation?._id;

        const scrollToBottom = () => {
            if (lastMessageRef.current) {
                lastMessageRef.current.scrollIntoView({
                    behavior: isNewConversation ? "auto" : "smooth",
                    block: "end",
                });
            } else if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight;
            }
        };

        const delay = isNewConversation ? 80 : 100;
        setTimeout(scrollToBottom, delay);
        if (isNewConversation && messages.length) {
            setTimeout(scrollToBottom, 300);
        }
    }, [messages, loading, selectedConversation?._id]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setMenuMessageId(null);
            setReplyTo(null);
            setMessage([]);
            try {
                const res = await axios.get(`/api/message/${selectedConversation?._id}`);
                setMessage(res.data);
                await markAsRead();
            } catch {
                toast.error("Failed to load messages");
            } finally {
                setLoading(false);
            }
        };
        if (selectedConversation?._id) load();
    }, [selectedConversation?._id, setMessage, markAsRead]);

    useEffect(() => {
        if (showCamera && videoRef.current && cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;
        }
    }, [showCamera]);

    useEffect(() => () => {
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    }, []);

    const closeCamera = () => {
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
        setShowCamera(false);
    };

    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            cameraStreamRef.current = stream;
            setShowCamera(true);
        } catch {
            alert("Camera access denied");
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) return;
            closeCamera();
            setPendingAttachment({
                type: "camera",
                blob,
                preview: URL.createObjectURL(blob),
            });
        }, "image/jpeg", 0.9);
    };

    const handlePickAttachment = async (pick) => {
        if (pick.type === "location") {
            if (!navigator.geolocation) return alert("Location not supported");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPendingAttachment({
                        type: "location",
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                },
                () => alert("Location permission denied")
            );
            return;
        }
        const file = pick.file;
        if (!file) return;
        const preview =
            pick.type === "document"
                ? null
                : URL.createObjectURL(file);
        setPendingAttachment({ type: pick.type, file, preview });
        if (pick.input) pick.input.value = "";
    };

    const sendPendingAttachment = async () => {
        if (!pendingAttachment || !selectedConversation?._id) return;
        setSending(true);
        try {
            const id = selectedConversation._id;
            if (pendingAttachment.type === "image" || pendingAttachment.type === "camera") {
                const form = new FormData();
                const file = pendingAttachment.file || pendingAttachment.blob;
                form.append("image", file, pendingAttachment.type === "camera" ? "photo.jpg" : file.name);
                await axios.post(`/api/message/image/${id}`, form);
            } else if (pendingAttachment.type === "video") {
                const form = new FormData();
                form.append("video", pendingAttachment.file);
                await axios.post(`/api/message/video/${id}`, form, {
                    timeout: 180000,
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else if (pendingAttachment.type === "document") {
                const form = new FormData();
                form.append("document", pendingAttachment.file);
                await axios.post(`/api/message/document/${id}`, form);
            } else if (pendingAttachment.type === "location") {
                await axios.post(`/api/message/location/${id}`, {
                    lat: pendingAttachment.lat,
                    lng: pendingAttachment.lng,
                });
            }
            setPendingAttachment(null);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to send");
        } finally {
            setSending(false);
        }
    };

    const handelSubmit = async (e) => {
        e.preventDefault();
        if (!sendData.trim()) return;
        setSending(true);
        try {
            const res = await axios.post(
                `/api/message/send/${selectedConversation?._id}`,
                { messages: sendData, replyTo: replyTo?.id || null }
            );
            setSendData("");
            setReplyTo(null);
        } catch {
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleOpenMenu = (message, action) => {
        if (action === "reply") {
            setReplyTo({ id: message._id, preview: getReplyPreview(message) });
            setMenuMessageId(null);
            return;
        }
        if (action === "close") {
            setMenuMessageId(null);
            return;
        }
        setMenuMessageId((prev) => (prev === message._id ? null : message._id));
    };

    const handleReact = async (messageId, emoji) => {
        try {
            const res = await axios.post(`/api/message/react/${messageId}`, { emoji });
            setMessage((prev) =>
                prev.map((m) => (m._id === messageId ? res.data : m))
            );
            setMenuMessageId(null);
        } catch {
            toast.error("Failed to react");
        }
    };

    const deleteMessageHandler = async (messageId) => {
        try {
            await axios.delete(`/api/message/delete/${messageId}`);
            setMessage((prev) => prev.filter((m) => m._id !== messageId));
            setMenuMessageId(null);
        } catch {
            toast.error("Failed to delete message");
        }
    };

    const handleClearChat = async () => {
        if (!selectedConversation?._id) return;
        try {
            const res = await axios.delete(`/api/message/clear/${selectedConversation._id}`);
            if (res.data?.success === false) {
                toast.error(res.data?.message || "Failed to clear chat");
                return;
            }
            setMessage([]);
            toast.success("Chat cleared");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to clear chat");
        }
    };

    const handleExportChat = async () => {
        if (!selectedConversation?._id) return;
        try {
            const res = await axios.get(
                `/api/message/export/${selectedConversation._id}`,
                {
                    responseType: "blob",
                    transformResponse: [(data) => data],
                }
            );
            const text = await res.data.text();
            if (!text || text.trim() === "No messages to export.") {
                toast.info("No messages to export");
                return;
            }
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `nexchat-${selectedConversation.username}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Chat exported");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Export failed");
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedConversation?._id) return;
        try {
            await axios.delete(`/api/user/chat/${selectedConversation._id}`);
            setMessage([]);
            setSelectedConversation(null);
            onBackUser(true);
            toast.success("User removed from chats");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to remove user");
        }
    };

    const startRecording = async () => {
        if (recording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordingStreamRef.current = stream;
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.start();
            setRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
        } catch {
            alert("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current || !recording) return;
        clearInterval(timerRef.current);
        const recorder = mediaRecorderRef.current;
        recorder.onstop = () => {
            recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
            recordingStreamRef.current = null;
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            if (blob.size > 0) {
                setPendingVoice({
                    blob,
                    preview: URL.createObjectURL(blob),
                });
            }
            audioChunksRef.current = [];
        };
        recorder.stop();
        mediaRecorderRef.current = null;
        setRecording(false);
    };

    const cancelPendingVoice = () => {
        if (pendingVoice?.preview) URL.revokeObjectURL(pendingVoice.preview);
        setPendingVoice(null);
    };

    const sendPendingVoice = async () => {
        if (!pendingVoice?.blob || !selectedConversation?._id) return;
        setSending(true);
        try {
            const form = new FormData();
            form.append("audio", pendingVoice.blob, "voice.webm");
            await axios.post(`/api/message/voice/${selectedConversation._id}`, form);
            cancelPendingVoice();
        } catch {
            alert("Failed to send voice message");
        } finally {
            setSending(false);
        }
    };

    if (!selectedConversation) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0b141a] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
                <div className="relative text-center px-6 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/30">
                        <TiMessages className="text-5xl text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">Welcome, {authUser?.username}</p>
                    <p className="text-slate-400">Select a chat to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0b141a] relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%221%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

            <ChatHeader
                selectedConversation={selectedConversation}
                typing={typing}
                onlineUser={onlineUser}
                onBackUser={onBackUser}
                onOpenProfile={onOpenProfile}
                onClearChat={handleClearChat}
                onExportChat={handleExportChat}
                // onBlockUser={handleBlockUser}
                onDeleteUser={handleDeleteUser}
            />

            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 relative z-10 min-h-0"
                onClick={() => setMenuMessageId(null)}
            >
                {loading && (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner text-emerald-500" />
                    </div>
                )}
                {!loading && messages?.length === 0 && (
                    <p className="text-center text-slate-500 mt-8 text-sm">
                        No messages yet. Say hello! 👋
                    </p>
                )}
                {!loading &&
                    messages?.map((message, i) => (
                        <div
                            key={message._id}
                            ref={i === messages.length - 1 ? lastMessageRef : null}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MessageBubble
                                message={message}
                                authUser={authUser}
                                otherUserId={selectedConversation._id}
                                showMenu={menuMessageId === message._id}
                                onOpenMenu={handleOpenMenu}
                                onReact={handleReact}
                                onDelete={deleteMessageHandler}
                            />
                        </div>
                    ))}
            </div>

            {showEmoji && (
                <div className="absolute bottom-24 left-4 z-50">
                    <EmojiPicker
                        onEmojiClick={(d) => setSendData((p) => p + d.emoji)}
                        theme="dark"
                    />
                </div>
            )}

            <ChatInput
                sendData={sendData}
                onChange={(e) => {
                    setSendData(e.target.value);
                    emitTyping(socket, authUser._id, selectedConversation._id);
                }}
                onTyping={() => {
                    emitTyping(socket, authUser._id, selectedConversation._id);
                }}
                onSubmit={handelSubmit}
                showEmoji={showEmoji}
                setShowEmoji={setShowEmoji}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                recording={recording}
                recordingTime={recordingTime}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onOpenCamera={openCamera}
                onPickAttachment={handlePickAttachment}
                sending={sending}
            />

            <AttachmentPreview
                attachment={pendingAttachment}
                onSend={sendPendingAttachment}
                onCancel={() => setPendingAttachment(null)}
                sending={sending}
            />

            <VoicePreview
                voice={pendingVoice}
                onSend={sendPendingVoice}
                onCancel={cancelPendingVoice}
                sending={sending}
            />

            {showCamera && (
                <div className="fixed inset-0 z-[70] bg-black/90 flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="bg-[#1a2332] rounded-t-2xl md:rounded-2xl p-3 md:p-4 w-full max-w-md border border-white/10">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl aspect-video object-cover bg-black" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-3 mt-4">
                            <button type="button" onClick={closeCamera} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-white">Cancel</button>
                            <button type="button" onClick={capturePhoto} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">Capture</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageContainer;
