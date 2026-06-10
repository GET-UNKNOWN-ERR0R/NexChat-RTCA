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

    useEffect(()=>{
        if(userId){
            const socket = io(SOCKET_URL, {
                query: {
                    userId: String(userId),
                },
                withCredentials: true,
            });

            const syncOnlineUsers = (users) => {
                setOnlineUser(
                    Array.isArray(users) ? users.map(String) : []
                );
            };

            socket.on("getOnlineUsers", syncOnlineUsers);

            socket.on("connect", () => {
                socket.emit("requestOnlineUsers");
            });

            setSocket(socket);
            return () => {
                socket.off("getOnlineUsers", syncOnlineUsers);
                socket.close();
            };
        }else{
            setSocket(null);
            setOnlineUser([]);
        }
    },[userId]);
    return(
    <SocketContext.Provider value={{socket , onlineUser}}>
        {children}
    </SocketContext.Provider>
    )
}