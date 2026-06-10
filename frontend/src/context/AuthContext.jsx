import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext)
}

export const AuthContextProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem('chatapp')) || null);

    useEffect(() => {
        const handleSessionExpired = () => {
            setAuthUser(null);
        };

        window.addEventListener("auth:session-expired", handleSessionExpired);
        return () => {
            window.removeEventListener("auth:session-expired", handleSessionExpired);
        };
    }, []);

    return <AuthContext.Provider value={{ authUser, setAuthUser }}>
        {children}
    </AuthContext.Provider>
}