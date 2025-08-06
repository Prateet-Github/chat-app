import React, { useState, useRef, useEffect } from "react";
import { useMessages } from "../hooks/useMessages.js"; // make sure export matches this
import { useAuth } from "../contexts/AuthContext.jsx"; // FIXED: added import

const ChatBox = ({ conversationId }) => {
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage("");
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversationId) return <p className="p-4">No conversation selected</p>;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        <img src="/Images/me.jpeg" alt="user" className="w-10 h-10 rounded-full bg-gray-300" />
        <p className="flex items-center gap-2 font-medium text-gray-800">
          Chat <span className="w-2 h-2 rounded-full bg-green-500" />
        </p>
        <img src="/Images/me.jpeg" alt="help" className="w-6 h-6 bg-gray-300" />
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto bg-gray-50">
        {loading ? (
          <p>Loading messages...</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-xs p-3 rounded-lg shadow ${
                msg.sender_id === user.id
                  ? "ml-auto bg-blue-100 border border-blue-200"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p className="text-gray-800 text-sm">{msg.content}</p>
              <div className="flex items-center justify-between mt-2">
                <img
                  src={
                    msg.sender?.avatar_url && msg.sender.avatar_url.trim() !== ""
                      ? msg.sender.avatar_url
                      : "/Images/me.jpeg"
                  }
                  alt="profileimg"
                  className="w-6 h-6 rounded-full bg-gray-300"
                />
                <p className="text-xs text-gray-500">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-300 flex items-center gap-3">
        <input
          type="text"
          placeholder="Send a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring focus:ring-blue-300 text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition"
        >
          <img src="/Images/me.jpeg" alt="sendicon" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;