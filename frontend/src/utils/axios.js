import axios from "axios";
import { API_BASE_URL } from "../config";

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            const isAuthRoute = error.config?.url?.includes("/api/auth/login")
                || error.config?.url?.includes("/api/auth/register");

            if (!isAuthRoute && typeof window !== "undefined") {
                localStorage.removeItem("chatapp");
                if (!window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
