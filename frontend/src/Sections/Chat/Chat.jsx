import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { api, getMessages, sendMessage } from "../../../API/api";
import Loading from "../Loading/loading";

const Chat = () => {
    const { userId } = useParams(); // The user we are chatting with
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [me, setMe] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch my ID
    useEffect(() => {
        api.get("/api/user/auth").then((res) => {
            if (res.data.success) {
                setMe(res.data.user);
            }
        }).catch(err => console.log(err));
    }, []);

    // Set up socket
    useEffect(() => {
        if (me) {
            const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:3000", {
                query: { userId: me._id },
            });
            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, [me]);

    // Fetch message history
    const { data: history, isLoading } = useQuery({
        queryKey: ["messages", userId],
        queryFn: () => getMessages(userId),
        select: res => res.data,
        enabled: !!me
    });

    useEffect(() => {
        if (history) setMessages(history);
    }, [history]);

    // Listen to new messages
    useEffect(() => {
        if (socket) {
            socket.on("newMessage", (newMessage) => {
                // If it's from the person we are chatting with
                if (newMessage.senderId === userId) {
                    setMessages((prev) => [...prev, newMessage]);
                }
            });
        }
        return () => {
            if (socket) socket.off("newMessage");
        }
    }, [socket, userId]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
            const res = await sendMessage(userId, text);
            setMessages((prev) => [...prev, res.data]);
            setText("");
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading || !me) return <Loading />;

    return (
        <div className="max-w-2xl mx-auto border rounded-xl h-[80vh] flex flex-col bg-white shadow-sm mt-[100px] mb-[40px]">
            <div className="p-4 border-b bg-gray-50 font-semibold text-lg flex items-center rounded-t-xl text-black">
                Chat with Seller
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">No messages yet. Send a message to start the conversation!</div>
                )}
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === me._id;
                    return (
                        <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-2xl ${isMe ? "bg-black text-white rounded-br-sm" : "bg-gray-200 text-black rounded-bl-sm"}`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 flex gap-2 border-t">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-full px-4 text-sm outline-none bg-gray-50 h-10"
                />
                <button type="submit" className="bg-black text-white px-5 h-10 rounded-full font-medium hover:bg-gray-800 transition">
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
