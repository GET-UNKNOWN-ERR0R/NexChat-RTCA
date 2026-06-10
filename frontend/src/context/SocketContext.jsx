import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config';

const SocketContext = createContext();

export const useSocketContext=()=>{
    return useContext(SocketContext);
}

export const SocketContextProvider=({children})=>{
    const [socket , setSocket]= useState(null);
    const [onlineUser,setOnlineUser]=useState([]);
    const {authUser} = useAuth();
    const userId = authUser?._id;

    useEffect(() => {
        if (!userId) {
            setSocket(null);
            setOnlineUser([]);
            return;
        }

        const socket = io(SOCKET_URL, {
            query: { userId: String(userId) },
            withCredentials: true,
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        const syncOnlineUsers = (users) => {
            setOnlineUser(Array.isArray(users) ? users.map(String) : []);
        };

        const handleConnect = () => {
            socket.emit("requestOnlineUsers");
        };

        const handleVisibility = () => {
            if (document.visibilityState === "visible" && !socket.connected) {
                socket.connect();
            }
        };

        socket.on("getOnlineUsers", syncOnlineUsers);
        socket.on("connect", handleConnect);
        document.addEventListener("visibilitychange", handleVisibility);

        setSocket(socket);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            socket.off("getOnlineUsers", syncOnlineUsers);
            socket.off("connect", handleConnect);
            socket.close();
        };
    }, [userId]);
    return(
    <SocketContext.Provider value={{socket , onlineUser}}>
        {children}
    </SocketContext.Provider>
    )
}