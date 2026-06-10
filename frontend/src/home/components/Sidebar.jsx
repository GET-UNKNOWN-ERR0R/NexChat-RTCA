import React, { useEffect, useRef, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import axios from '../../utils/axios';
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'
import { IoArrowBackSharp } from 'react-icons/io5';
import { BiLogOut } from "react-icons/bi";
import userConversation from '../../Zustans/useConversation';
import { useSocketContext } from '../../context/SocketContext';
import { FaCamera } from "react-icons/fa";
import { getMediaUrl } from "../../utils/mediaUrl";
import { getChatPreview } from "../../utils/chatPreview";
import { isUserOnline } from "../../utils/onlineStatus";
const Sidebar = ({ onSelectUser, openProfile, onOpenUserProfile, showProfile }) => {

    const normalizeUserId = (id) => {
        if (!id) return null;
        if (typeof id === "object" && id._id) return String(id._id);
        return String(id);
    };

    const navigate = useNavigate();
    const { authUser, setAuthUser } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [searchUser, setSearchuser] = useState([]);
    const [chatUser, setChatUser] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedUserId, setSetSelectedUserId] = useState(null);
    const [unread, setUnread] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);

    const { setSelectedConversation, activeChatId } = userConversation();
    const { onlineUser, socket } = useSocketContext();

    const upsertChatUser = (userId, msg, options = {}) => {
        const { previewOverride, incrementUnread = false } = options;
        const id = String(userId);

        setChatUser((prev) => {
            const index = prev.findIndex((u) => String(u._id) === id);
            if (index === -1) return prev;

            const user = { ...prev[index] };
            if (msg) {
                user.lastMessage = msg;
                user.lastPreview = previewOverride
                    || getChatPreview(msg, authUser._id, user.username);
            } else if (previewOverride !== undefined) {
                user.lastPreview = previewOverride;
                user.lastMessage = null;
            }
            if (incrementUnread) {
                user.unreadCount = (user.unreadCount || 0) + 1;
            }

            const copy = [...prev];
            copy.splice(index, 1);
            copy.unshift(user);
            return copy;
        });
    };

    const addChatUserFromProfile = async (otherUserId, msg, incrementUnread = false) => {
        try {
            const res = await axios.get(`/api/user/profile/${otherUserId}`);
            const user = {
                ...res.data,
                lastMessage: msg || null,
                lastPreview: msg
                    ? getChatPreview(msg, authUser._id, res.data.username)
                    : "Start a conversation",
                unreadCount: incrementUnread ? 1 : 0,
            };
            setChatUser((prev) => {
                if (prev.some((u) => String(u._id) === String(otherUserId))) return prev;
                const withoutStarters = prev.filter(
                    (u) => u.lastPreview !== "Start a conversation"
                );
                return [user, ...withoutStarters];
            });
            if (incrementUnread) {
                setUnread((prev) => ({
                    ...prev,
                    [String(otherUserId)]: (prev[String(otherUserId)] || 0) + 1,
                }));
            }
        } catch {
            /* profile fetch failed */
        }
    };


    useEffect(() => {
        const chatUserHandler = async () => {
            setLoading(true)
            try {
                const chatters = await axios.get(`/api/user/chatlist`)
                const data = chatters.data;

                if (data.success === false) {
                    setLoading(false)
                    return;
                }

                setChatUser(data);

                const initialUnread = {};
                data.forEach((user) => {
                    if (user.unreadCount > 0) {
                        initialUnread[String(user._id)] = user.unreadCount;
                    }
                });
                setUnread(initialUnread);

            } catch {
                toast.error("Failed to load chats");
            } finally {
                setLoading(false)
            }
        }

        chatUserHandler()
    }, [])


    const moveUserTop = (userId, msg, previewOverride) => {
        upsertChatUser(userId, msg, { previewOverride });
    };

    useEffect(() => {

        const handleMoveTop = (msg) => {
            const senderId = normalizeUserId(msg.senderId);
            const receiverId = normalizeUserId(msg.reciverId);
            const otherUser =
                senderId === String(authUser._id)
                    ? receiverId
                    : senderId;

            if (!otherUser) return;

            const isIncoming =
                receiverId === String(authUser._id) &&
                senderId !== String(authUser._id);
            const shouldIncrementUnread =
                isIncoming && String(activeChatId) !== senderId;

            if (shouldIncrementUnread) {
                setUnread((prev) => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1,
                }));
            }

            let userMissing = false;
            setChatUser((prev) => {
                const index = prev.findIndex((u) => String(u._id) === otherUser);
                if (index === -1) {
                    userMissing = true;
                    return prev;
                }
                const user = { ...prev[index] };
                user.lastMessage = msg;
                user.lastPreview = getChatPreview(msg, authUser._id, user.username);
                if (shouldIncrementUnread) {
                    user.unreadCount = (user.unreadCount || 0) + 1;
                }
                const copy = [...prev];
                copy.splice(index, 1);
                copy.unshift(user);
                return copy;
            });

            if (userMissing) {
                addChatUserFromProfile(otherUser, msg, shouldIncrementUnread);
            }
        };

        const handleChatUserRestored = ({ user }) => {
            if (!user?._id) return;
            setChatUser((prev) => {
                if (prev.some((u) => String(u._id) === String(user._id))) return prev;
                const withoutStarters = prev.filter(
                    (u) => u.lastPreview !== "Start a conversation"
                );
                return [
                    {
                        ...user,
                        lastMessage: null,
                        lastPreview: user.lastPreview || "Start a conversation",
                        unreadCount: 0,
                    },
                    ...withoutStarters,
                ];
            });
        };

        const handleMessageUpdated = (updated) => {
            const otherUser =
                String(updated.senderId) === String(authUser._id)
                    ? updated.reciverId
                    : updated.senderId;

            setChatUser((prev) => {
                const copy = [...prev];
                const index = copy.findIndex(
                    (u) => String(u._id) === String(otherUser)
                );
                if (index === -1) return prev;

                const user = { ...copy[index] };
                user.lastMessage = updated;
                user.lastPreview = getChatPreview(
                    updated,
                    authUser._id,
                    user.username
                );
                copy.splice(index, 1);
                copy.unshift(user);
                return copy;
            });
        };

        const handleChatCleared = ({ otherUserId, clearedBy }) => {
            if (String(clearedBy) !== String(authUser._id)) return;
            moveUserTop(otherUserId, null, "Chat cleared");
        };

        const handleTyping = ({ senderId, receiverId }) => {
            if (String(receiverId) !== String(authUser._id)) return;
            if (String(activeChatId) === String(senderId)) return;

            setTypingUsers((prev) => ({ ...prev, [String(senderId)]: true }));
            setTimeout(() => {
                setTypingUsers((prev) => {
                    const copy = { ...prev };
                    delete copy[String(senderId)];
                    return copy;
                });
            }, 2000);
        };

        const handleProfileUpdated = (updated) => {
            setChatUser((prev) =>
                prev.map((u) =>
                    String(u._id) === String(updated._id)
                        ? { ...u, ...updated }
                        : u
                )
            );
            if (String(authUser._id) === String(updated._id)) {
                const stored = { ...authUser, ...updated };
                localStorage.setItem("chatapp", JSON.stringify(stored));
                setAuthUser(stored);
            }
        };

        const handleAccountDeleted = ({ userId }) => {
            setChatUser((prev) => prev.filter((u) => String(u._id) !== String(userId)));
        };

        const handleUserBlocked = ({ otherUserId }) => {
            setChatUser((prev) => prev.filter((u) => String(u._id) !== String(otherUserId)));
        };

        const handleChatUserRemoved = ({ otherUserId }) => {
            setChatUser((prev) => prev.filter((u) => String(u._id) !== String(otherUserId)));
        };

        socket?.on("newMessage", handleMoveTop);
        socket?.on("messageUpdated", handleMessageUpdated);
        socket?.on("chatCleared", handleChatCleared);
        socket?.on("chatUserRestored", handleChatUserRestored);
        socket?.on("userTyping", handleTyping);
        socket?.on("profileUpdated", handleProfileUpdated);
        socket?.on("accountDeleted", handleAccountDeleted);
        socket?.on("userBlocked", handleUserBlocked);
        socket?.on("chatUserRemoved", handleChatUserRemoved);

        return () => {
            socket?.off("newMessage", handleMoveTop);
            socket?.off("messageUpdated", handleMessageUpdated);
            socket?.off("chatCleared", handleChatCleared);
            socket?.off("chatUserRestored", handleChatUserRestored);
            socket?.off("userTyping", handleTyping);
            socket?.off("profileUpdated", handleProfileUpdated);
            socket?.off("accountDeleted", handleAccountDeleted);
            socket?.off("userBlocked", handleUserBlocked);
            socket?.off("chatUserRemoved", handleChatUserRemoved);
        };

    }, [
        socket,
        authUser,
        activeChatId,
        setAuthUser,
    ]);



    const handelSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        setSearchLoading(true)

        try {
            const search = await axios.get(
                `/api/user/search?search=${searchInput.trim()}`
            );

            const data = search.data;

            if (data.success === false) {
                toast.error(data.message);
                return;
            }

            if (!data.length) {
                toast.info("User not found");
                setSearchuser([]);
            } else {
                setSearchuser(data);
            }

        } catch {
            toast.error("Search failed");
        } finally {
            setSearchLoading(false);
        }
    }

    const handelUserClick = (user) => {

        onSelectUser(user);

        setSelectedConversation(user);

        setSetSelectedUserId(user._id);

        setUnread(prev => {

            const copy = { ...prev };

            delete copy[String(user._id)];

            return copy;
        });
    }

    const handSearchback = () => {
        setSearchuser([]);
        setSearchInput('');
    }

    const handleUserProfileClick = (e, user) => {
        e.stopPropagation();
        onOpenUserProfile?.(user);
    }


    const handleProfileUpload = async (e) => {

        const file = e.target.files[0];

        if (!file) return;

        try {

            setUploading(true);

            const formData = new FormData();

            formData.append(
                "profile",
                file
            );

            const res = await axios.put(
                "/api/auth/profile-pic",
                formData
            );

            const updatedUser =
                res.data;

            localStorage.setItem(
                "chatapp",
                JSON.stringify(updatedUser)
            );

            setAuthUser(updatedUser);

            toast.success(
                "Profile picture updated"
            );

            setUploading(false);

        } catch {

            setUploading(false);

            toast.error(
                "Upload Failed"
            );

        } finally {
            e.target.value = "";
        }

    };

    const handelLogOut = async () => {
        setLoading(true);
        try {
            const logout = await axios.post('/api/auth/logout');
            const data = logout.data;
            toast.info(data?.message || "Logged out");
            localStorage.removeItem('chatapp');
            setAuthUser(null);
            navigate('/login');
        } catch {
            toast.error("Logout failed");
        } finally {
            setLoading(false);
        }
    }




    return (
        <div className='h-full w-full flex flex-col bg-[#0b141a] px-3 py-3 border-r border-white/5'>


            <div className='mb-3 px-1'>
                <h1 className='text-emerald-400 font-bold text-lg tracking-wide'>NexChat</h1>
                <p className='text-slate-500 text-xs'>Premium messaging</p>
            </div>

            <div className='flex justify-between items-center gap-3'>

                <form
                    onSubmit={handelSearchSubmit}
                    className='flex-1 min-w-0 flex items-center gap-2 bg-linear-to-r from-[#1a2332] to-[#15202b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 overflow-hidden focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all'
                >
                    <div className="pl-4 text-emerald-400/80 shrink-0">
                        <FaSearch size={14} />
                    </div>

                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        type='text'
                        placeholder='Search by name or username...'
                        className='flex-1 min-w-0 py-3.5 pr-2 bg-transparent outline-none text-white placeholder:text-slate-500 text-sm'
                    />

                    <button
                        type="submit"
                        disabled={searchLoading}
                        className='mr-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all text-white text-xs font-semibold shrink-0'
                    >
                        {searchLoading ? "..." : "Search"}
                    </button>
                </form>
             
                <div className="relative">

                    <img
                        onClick={openProfile}
                        src={getMediaUrl(authUser?.profilepic, authUser)}
                        alt={authUser?.username || "Profile"}
                        className="h-12 w-12 rounded-full ring-2 ring-emerald-500/50 object-cover cursor-pointer hover:scale-105 transition-all duration-200"
                    />

                    <button
                        type="button"
                        title="Add photo"
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                        className="absolute -bottom-1 -right-1 bg-emerald-600 p-1.5 rounded-full text-white"
                    >
                        <FaCamera size={10} />
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileUpload}
                    />

                    {
                        uploading && (
                            <div
                                className="
            absolute
            inset-0
            rounded-full
            bg-black/60
            flex
            items-center
            justify-center
            "
                            >
                                <span
                                    className="
                loading
                loading-spinner
                loading-sm
                text-white
                "
                                />
                            </div>
                        )
                    }

                </div>



            </div>

            <div className='divider my-3'></div>

            {searchUser?.length > 0 ? (
                <>
                    <div className='flex-1 overflow-y-auto pr-1'>

                        {searchUser.map((user, index) => (

                            <div key={user._id}>

                                <div
                                    onClick={() => handelUserClick(user)}
                                    className={`
                                    flex items-center gap-3
                                    p-3
                                    rounded-2xl
                                    cursor-pointer
                                    transition-all duration-200
                                    hover:bg-white/5
                                    ${selectedUserId === user._id
                                            ? 'bg-emerald-600/20 ring-1 ring-emerald-500/40'
                                            : ''
                                        }
                                    `}
                                >

                                    <div
                                        className="relative shrink-0"
                                        onClick={(e) =>
                                            handleUserProfileClick(e, user)
                                        }
                                        title="View profile"
                                    >

                                        <img
                                            src={getMediaUrl(user.profilepic, user)}
                                            className="w-12 h-12 rounded-full cursor-pointer hover:ring-2 hover:ring-sky-400"
                                        />

                                        {
                                            isUserOnline(onlineUser, user._id) && (

                                                <span
                                                    className="
absolute
bottom-0
right-0
w-3
h-3
bg-green-500
rounded-full
border-2
border-slate-900
"
                                                />

                                            )
                                        }

                                    </div>




                                    <div className='flex flex-col flex-1 min-w-0'>
                                        <p className='font-semibold text-white'>
                                            {user.username}
                                        </p>
                                    </div>

                                </div>

                                <div className='border-b border-slate-800 my-1'></div>

                            </div>

                        ))}

                    </div>

                    <div className='pt-3'>

                        <button
                            onClick={handSearchback}
                            className='bg-slate-800 hover:bg-slate-700 text-white rounded-full p-3 transition-all'
                        >
                            <IoArrowBackSharp size={20} />
                        </button>

                    </div>
                </>
            ) : (
                <>
                    <div className='flex-1 overflow-y-auto pr-1'>

                        {loading && (
                            <div className='flex justify-center mt-10'>
                                <span className='loading loading-spinner text-sky-500'></span>
                            </div>
                        )}

                        {!loading && chatUser.length === 0 && (
                            <div className='flex flex-col items-center justify-center text-center mt-10 px-4'>
                                <h1 className='text-xl font-bold text-sky-400'>
                                    No Conversations Yet
                                </h1>

                                <p className='text-slate-400 mt-2'>
                                    Search a username and start chatting 🚀
                                </p>
                            </div>
                        )}

                        {!loading &&
                            chatUser.map((user, index) => (

                                <div key={user._id}>

                                    <div
                                        onClick={() => handelUserClick(user)}
                                        className={`
                                        flex items-center gap-3
                                        p-3
                                        rounded-2xl
                                        cursor-pointer
                                        transition-all duration-200
                                        hover:bg-white/5
                                        ${selectedUserId === user._id
                                                ? 'bg-emerald-600/20 ring-1 ring-emerald-500/40'
                                                : ''
                                            }
                                        `}
                                    >

                                        <div
                                            className="relative shrink-0"
                                            onClick={(e) =>
                                                handleUserProfileClick(e, user)
                                            }
                                            title="View profile"
                                        >

                                            <img
                                                src={getMediaUrl(user.profilepic, user)}
                                                className="w-12 h-12 rounded-full cursor-pointer hover:ring-2 hover:ring-sky-400"
                                                alt="user"
                                            />

                                            {
                                                isUserOnline(onlineUser, user._id) && (
                                                    <span
                                                        className="
                absolute
                bottom-0
                right-0
                w-3
                h-3
                bg-green-500
                rounded-full
                border-2
                border-slate-900
                "
                                                    />
                                                )
                                            }

                                        </div>






                                        <div className='flex flex-col flex-1 min-w-0'>
                                            <p className='font-semibold text-white truncate'>
                                                {user.username}
                                            </p>
                                            {typingUsers[String(user._id)] ? (
                                                <p className='text-emerald-400 text-sm truncate mt-0.5 animate-pulse'>
                                                    typing...
                                                </p>
                                            ) : user.lastPreview ? (
                                                <p className='text-slate-400 text-sm truncate mt-0.5'>
                                                    {user.lastPreview}
                                                </p>
                                            ) : null}
                                        </div>
                                        {
                                            unread[String(user._id)] > 0 && (
                                                <div
                                                    className="
            min-w-6
            h-6
            px-2
            rounded-full
            bg-green-500
            text-white
            text-xs
            font-bold
            flex
            items-center
            justify-center
            "
                                                >
                                                    {unread[String(user._id)]}
                                                </div>
                                            )
                                        }



                                    </div>

                                    <div className='border-b border-slate-800 my-1'></div>

                                </div>

                            ))}
                    </div>


                    <div className='pt-3 border-t border-slate-800'>

                        <button
                            onClick={handelLogOut}
                            className='flex items-center gap-2 text-red-400 hover:text-white hover:bg-red-600 px-3 py-2 rounded-xl transition-all duration-200'
                        >
                            <BiLogOut size={24} />
                            <span>Logout</span>
                        </button>

                    </div>
                </>
            )}
        </div>
    )
}

export default Sidebar;