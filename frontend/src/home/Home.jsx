import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MessageContainer from './components/MessageContainer';
import Profile from '../pages/Profile';
import userConversation from '../Zustans/useConversation';

const Home = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const { setSelectedConversation, setActiveChatId } = userConversation();

    const handelUserSelect = (user) => {
        setSelectedUser(user);
        setIsSidebarVisible(false);
        setShowProfile(false);
        setProfileUser(null);
    };

    const handelShowSidebar = () => {
        setIsSidebarVisible(true);
        setSelectedUser(null);
        setSelectedConversation(null);
        setActiveChatId(null);
    };

    return (
        <div
            className="flex justify-between w-full md:max-w-[90%] lg:max-w-[82%] xl:max-w-[78%] h-[95vh] md:h-[92vh] rounded-3xl border border-white/10 bg-[#060b10]/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-emerald-500/10"
        >
            <div
                className={`w-full md:w-87.5 py-2 md:flex ${isSidebarVisible ? '' : 'hidden'
                    }`}
            >
                <Sidebar
                    onSelectUser={handelUserSelect}
                    showProfile={showProfile}
                    openProfile={() => {
                        setProfileUser(null);
                        setShowProfile(true);
                        setActiveChatId(null);
                        if (window.matchMedia("(max-width: 767px)").matches) {
                            setIsSidebarVisible(false);
                        }
                    }}
                    onOpenUserProfile={(user) => {
                        setProfileUser(user);
                        setShowProfile(true);
                        setActiveChatId(null);
                        if (window.matchMedia("(max-width: 767px)").matches) {
                            setIsSidebarVisible(false);
                        }
                    }}
                />
            </div>

            <div
                className={`hidden md:flex divider divider-horizontal m-0 ${isSidebarVisible ? '' : 'hidden'
                    } ${selectedUser ? 'block' : 'hidden'}`}
            ></div>

            <div
                className={`flex-auto ${(selectedUser || showProfile) ? '' : 'hidden md:flex'
                    } bg-[#0b141a]`}
            >
                {
                    showProfile
                        ?

                        <Profile
                            viewUser={profileUser}
                            closeProfile={() => {
                                setShowProfile(false);
                                setProfileUser(null);
                                if (window.matchMedia("(max-width: 767px)").matches) {
                                    setIsSidebarVisible(true);
                                }
                            }}
                        />

                        :

                        <MessageContainer
                            onBackUser={handelShowSidebar}
                            onOpenProfile={(user) => {
                                setProfileUser(user);
                                setShowProfile(true);
                            }}
                        />

                }


            </div>
        </div>
    );
};

export default Home;


