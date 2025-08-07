import React, { useState, useRef, useEffect } from "react";
import { useMessages } from "../hooks/useMessages.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

const ChatBox = ({ conversationId }) => {
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch chat user details
  useEffect(() => {
    const fetchChatUser = async () => {
      try {
        if (!conversationId || !user) return;
        const { data, error } = await supabase
          .from("conversation_participants")
          .select("users:user_id(id, username, avatar_url)")
          .eq("conversation_id", conversationId)
          .neq("user_id", user.id)
          .single();

        if (error) throw error;
        if (data?.users) setChatUser(data.users);
      } catch (err) {
        console.error("Error fetching chat user:", err.message);
        setErrorMsg("Failed to load chat user.");
      }
    };

    fetchChatUser();
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage(newMessage.trim());
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err.message);
      setErrorMsg("Failed to send message.");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Only image files are allowed.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("chat-files")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData?.publicUrl;
      if (!fileUrl) throw new Error("Unable to retrieve file URL.");

      await sendMessage("", fileUrl, "image");
    } catch (err) {
      console.error("File upload error:", err.message);
      setErrorMsg("Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ESC key for closing fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (!conversationId)
    return <p className="p-4">No conversation selected</p>;

  return (
    <>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <img
              src={
                chatUser?.avatar_url?.trim()
                  ? chatUser.avatar_url
                  : "/Images/me.jpeg"
              }
              alt="user"
              className="w-10 h-10 rounded-full bg-gray-300"
            />
            <span className="font-medium text-gray-800">
              {chatUser?.username || "Chat"}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto bg-gray-50">
          {loading ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-400 text-sm">No messages yet</p>
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
                {msg.file_url && (
                  <img
                    src={msg.file_url}
                    alt="uploaded"
                    className="max-w-[200px] rounded-lg mb-2 cursor-pointer hover:opacity-80 transition"
                    onClick={() => setSelectedImage(msg.file_url)}
                  />
                )}

                {msg.content && (
                  <p className="text-gray-800 text-sm">{msg.content}</p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <img
                    src={
                      msg.sender?.avatar_url?.trim()
                        ? msg.sender.avatar_url
                        : "/Images/me.jpeg"
                    }
                    alt="profileimg"
                    className="w-6 h-6 rounded-full bg-gray-300"
                  />
                  <p className="text-xs text-gray-500">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-300 flex items-center gap-3">
          <input
            type="text"
            placeholder="Send a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring focus:ring-blue-300 text-sm"
          />

          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition"
          >
            📎
          </button>

          <button
            onClick={handleSend}
            disabled={uploading}
            className="bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4l16 8-16 8V4z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Fullscreen Image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="fullscreen"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
    </>
  );
};

export default ChatBox;