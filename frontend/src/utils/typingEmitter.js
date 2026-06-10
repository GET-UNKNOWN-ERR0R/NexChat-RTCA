let stopTimer = null;

export function emitTyping(socket, senderId, receiverId) {
    if (!socket?.connected || !senderId || !receiverId) return;

    const payload = {
        senderId: String(senderId),
        receiverId: String(receiverId),
    };

    socket.emit("typing", payload);

    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
        socket.emit("stopTyping", payload);
    }, 2500);
}

export function clearTypingEmitter() {
    if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
    }
}
