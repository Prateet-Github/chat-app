import React, { useState } from "react";
import LeftSidebar from "../components/LeftSidebar";
import ChatBox from "../components/ChatBox";
import RightSidebar from "../components/RightSidebar";
import { useConversation } from "../hooks/useConversations"; // ✅ Import hook

const Chat = () => {
  // Store selected OTHER user's ID (not conversationId directly)
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Get or create the conversation for that user
  const { conversationId, loading, error } = useConversation(selectedUserId);

  // Called when a conversation is clicked in LeftSidebar
  const handleSelectConversation = (otherUserId) => {
    setSelectedUserId(otherUserId);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Sidebar */}
      <div className="hidden lg:block lg:w-1/4 overflow-y-auto border-r border-gray-300">
        <LeftSidebar onSelectConversation={handleSelectConversation} />
      </div>

      {/* Chat Box */}
      <div className="w-full lg:w-1/2 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading conversation...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {error}
          </div>
        ) : conversationId ? (
          <ChatBox conversationId={conversationId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a user to start chatting
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block lg:w-1/4 overflow-y-auto border-l border-gray-300">
        <RightSidebar />
      </div>
    </div>
  );
};

export default Chat;