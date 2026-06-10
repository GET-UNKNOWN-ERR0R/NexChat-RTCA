import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "./axios";

export const VerifyUser = () => {
    const { authUser, setAuthUser } = useAuth();
    const [checking, setChecking] = useState(Boolean(authUser));

    useEffect(() => {
        if (!authUser) {
            setChecking(false);
            return;
        }

        let cancelled = false;

        const verifySession = async () => {
            try {
                await axios.get("/api/user/chatlist");
                if (!cancelled) setChecking(false);
            } catch {
                if (!cancelled) {
                    localStorage.removeItem("chatapp");
                    setAuthUser(null);
                    setChecking(false);
                }
            }
        };

        verifySession();

        return () => {
            cancelled = true;
        };
    }, [authUser, setAuthUser]);

    if (!authUser) {
        return <Navigate to="/login" replace />;
    }

    if (checking) {
        return (
            <div className="w-screen h-screen bg-[#0b141a] flex items-center justify-center">
                <span className="loading loading-spinner text-emerald-500" />
            </div>
        );
    }

    return <Outlet />;
};
