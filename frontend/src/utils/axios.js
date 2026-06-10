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
            const requestUrl = error.config?.url || "";
            const isAuthRoute = requestUrl.includes("/api/auth/login")
                || requestUrl.includes("/api/auth/register")
                || requestUrl.includes("/api/auth/account");

            if (!isAuthRoute && typeof window !== "undefined") {
                localStorage.removeItem("chatapp");
                window.dispatchEvent(new CustomEvent("auth:session-expired"));
            }
        }
        return Promise.reject(error);
    }
);

export default api;
