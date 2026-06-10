import axios from "./axios";

export async function verifyAuthSession(maxAttempts = 5) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            await axios.get("/api/user/chatlist");
            return true;
        } catch {
            if (attempt < maxAttempts - 1) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 350 * (attempt + 1))
                );
            }
        }
    }
    return false;
}
