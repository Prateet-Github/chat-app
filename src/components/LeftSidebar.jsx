import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useConversation } from "../hooks/useConversations";
import ProfileUpdate from "../pages/ProfileUpdate";

const LeftSidebar = ({ onSelectConversation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [profile, setProfile] = useState(null);

  const { conversationId, error: convoError } = useConversation(
    searching && searchValue.trim() ? searchValue.trim() : null
  );

  // ✅ Fetch user profile from `users` table
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("users")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!error) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  // Redirect to conversation when found
  useEffect(() => {
    if (conversationId) {
      onSelectConversation(conversationId);
      setSearchValue("");
      setSearching(false);
    }
  }, [conversationId, onSelectConversation]);

  // ✅ Fetch conversations with latest message first
 // Fetch user conversations
useEffect(() => {
  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // ⬅ This Supabase query is the one causing the 400 error
      const { data, error } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          conversations:conversation_id (
            id,
            is_group,
            creator_id,
            created_at,
            messages (
              content,
              created_at,
              file_url,
              message_type
            ),
            conversation_participants!inner (
              users:user_id (
                id,
                username,
                avatar_url
              )
            )
          )
        `)
        .eq("user_id", user.id);

        if (error) throw error;

        const convoList = (data || []).map((row) => {
          const conversation = row.conversations;

          let displayName = conversation?.name || "Unknown";
          let displayAvatar = "";
          let otherUser = null;

          if (!conversation.is_group) {
            otherUser = conversation?.conversation_participants
              ?.map((p) => p.users)
              .find((u) => u?.id !== user.id);
            displayName = otherUser?.username || "Unknown";
            displayAvatar = otherUser?.avatar_url || "/Images/me.jpeg";
          }

          const lastMsg = conversation?.messages?.[0];
          const lastMessageText = lastMsg
            ? lastMsg.message_type === "image"
              ? "📷 Image"
              : lastMsg.content
            : "No messages yet";

          return {
            conversationId: conversation?.id,
            displayName,
            displayAvatar,
            lastMessage: lastMessageText,
          };
        });

        setConversations(convoList);
      } catch (err) {
        console.error("Error fetching conversations:", err.message);
        setErrorMsg("Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, conversationId]);

  const handleSearch = () => {
    if (searchValue.trim()) setSearching(true);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <>
      <div className="w-full h-full border-r border-gray-300 flex flex-col bg-white">
        {/* Top Section */}
        <div className="p-4 border-b border-gray-300 flex items-center justify-between relative">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <img
              src={profile?.avatar_url || "/Images/me.jpeg"}
              alt="Profile"
              className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"
            />
            <input
              type="text"
              placeholder="Search by username or email"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300 text-sm"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Go
            </button>
          </div>

          {/* Menu */}
          <div className="ml-3 relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-200">
            {errorMsg}
          </p>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((convo, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                onClick={() => onSelectConversation(convo.conversationId)}
              >
                <img
                  src={convo.displayAvatar || "/Images/me.jpeg"}
                  alt={convo.displayName}
                  className="w-10 h-10 rounded-full bg-gray-300"
                />
                <div>
                  <p className="font-medium text-gray-800">
                    {convo.displayName}
                  </p>
                  <span className="text-sm text-gray-500 truncate w-40 block">
                    {convo.lastMessage}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 p-4">
              No conversations yet
            </p>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
            <ProfileUpdate />
          </div>
        </div>
      )}
    </>
  );
};

export default LeftSidebar;