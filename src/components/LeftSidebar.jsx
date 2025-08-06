import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useConversation } from "../hooks/useConversations";
import ProfileUpdate from "../pages/ProfileUpdate"; // ✅ Import your file

const LeftSidebar = ({ onSelectConversation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // ✅ state for modal

  const {
    conversationId,
    loading: convoLoading,
    error,
  } = useConversation(searching ? searchValue.trim() : null);

  useEffect(() => {
    if (conversationId) {
      onSelectConversation(conversationId);
      setSearchValue("");
      setSearching(false);
    }
  }, [conversationId, onSelectConversation]);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);

      const { data: participantRows, error: participantError } = await supabase
        .from("conversation_participants")
        .select(
          `
          conversation_id,
          conversations:conversation_id (
            id,
            is_group,
            creator_id,
            created_at
          )
        `
        )
        .eq("user_id", user.id);

      if (participantError) {
        console.error("Error fetching conversations:", participantError);
        setLoading(false);
        return;
      }

      let convoList = [];
      for (const row of participantRows) {
        const conversation = row.conversations;
        if (!conversation) continue;

        const { data: otherUserRow } = await supabase
          .from("conversation_participants")
          .select("user_id, users:user_id(id, username, avatar_url)")
          .eq("conversation_id", conversation.id)
          .neq("user_id", user.id)
          .maybeSingle();

        if (!otherUserRow) continue;

        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        convoList.push({
          conversationId: conversation.id,
          otherUser: otherUserRow.users,
          lastMessage: lastMessage ? lastMessage.content : "No messages yet",
        });
      }

      setConversations(convoList);
      setLoading(false);
    };

    fetchConversations();
  }, [user, conversationId]);

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter" && searchValue.trim()) {
      setSearching(true);
    }
  };

  const handleSearchClick = () => {
    if (searchValue.trim()) {
      setSearching(true);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <>
      <div className="w-full h-full border-r border-gray-300 flex flex-col bg-white">
        {/* Top Section */}
        <div className="p-4 border-b border-gray-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={user?.avatar_url || "/Images/me.jpeg"}
              alt="Profile"
              className="w-10 h-10 rounded-full bg-gray-300"
            />
            <input
              type="text"
              placeholder="Search by username or email"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300 text-sm"
            />
            <button
              onClick={handleSearchClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Go
            </button>
          </div>

          {/* ✅ Edit Profile Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="ml-3 text-blue-600 text-sm font-medium hover:underline"
          >
            Edit Profile
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
              onClick={() => onSelectConversation(convo.otherUser.id)}
            >
              <img
                src={convo.otherUser.avatar_url || "/Images/me.jpeg"}
                alt={convo.otherUser.username}
                className="w-10 h-10 rounded-full bg-gray-300"
              />
              <div>
                <p className="font-medium text-gray-800">
                  {convo.otherUser.username}
                </p>
                <span className="text-sm text-gray-500 truncate w-40 block">
                  {convo.lastMessage}
                </span>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-center text-gray-500 p-4">No conversations yet</p>
          )}
        </div>
      </div>

      {/* ✅ Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full relative">
            {/* Close Button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            {/* Your existing ProfileUpdate Component */}
            <ProfileUpdate />
          </div>
        </div>
      )}
    </>
  );
};

export default LeftSidebar;