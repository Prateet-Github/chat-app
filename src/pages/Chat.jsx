import React, { useState } from "react";
import LeftSidebar from "../components/LeftSidebar";
import ChatBox from "../components/ChatBox";
import RightSidebar from "../components/RightSidebar";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const Chat = () => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [startingChat, setStartingChat] = useState(false);

  const isValidUUID = (val) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

  // ✅ Create or get conversation without hooks
  const startNewChat = async (otherUserIdentifier) => {
    if (!otherUserIdentifier || startingChat) return;
    setStartingChat(true);

    try {
      let otherUserId = otherUserIdentifier.trim();
      let foundUser = null;

      // 🔹 Lookup by UUID or username/email
      if (isValidUUID(otherUserId)) {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("id", otherUserId)
          .maybeSingle();
        if (error) throw error;
        foundUser = data;
      } else {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .or(
            `username.eq.${encodeURIComponent(
              otherUserId
            )},email.eq.${encodeURIComponent(otherUserId)}`
          )
          .maybeSingle();
        if (error) throw error;
        foundUser = data;
      }

      if (!foundUser) {
        alert(`User "${otherUserIdentifier}" not found. They need to sign up first.`);
        return;
      }

      otherUserId = foundUser.id;

      if (otherUserId === user.id) {
        alert("You can't chat with yourself");
        return;
      }

      // 🔹 Check for existing conversation
      const { data: participants, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("user_id", [user.id, otherUserId]);

      if (participantsError) throw participantsError;

      const convoCounts = (participants || []).reduce((acc, row) => {
        acc[row.conversation_id] = (acc[row.conversation_id] || 0) + 1;
        return acc;
      }, {});

      const existingConvoId = Object.entries(convoCounts).find(
        ([, count]) => count === 2
      )?.[0];

      if (existingConvoId) {
        setConversationId(existingConvoId);
        return;
      }

      // 🔹 Create new conversation
      const { data: convo, error: convoError } = await supabase
        .from("conversations")
        .insert([{ is_group: false, creator_id: user.id }])
        .select()
        .single();

      if (convoError) throw convoError;

      // 🔹 Add participants
      const { error: addError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: convo.id, user_id: user.id },
          { conversation_id: convo.id, user_id: otherUserId },
        ]);

      if (addError) throw addError;

      setConversationId(convo.id);
    } catch (err) {
      console.error("New chat error:", err);
      alert(err.message || "Failed to start chat");
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Sidebar */}
      <div className="hidden lg:block lg:w-1/4 overflow-y-auto border-r border-gray-300">
        <LeftSidebar
          onSelectConversation={(id) => setConversationId(id)}
          onStartNewChat={startNewChat}
          startingChat={startingChat}
        />
      </div>

      {/* Chat Box */}
      <div className="w-full lg:w-1/2 overflow-y-auto">
        {conversationId ? (
          <ChatBox conversationId={conversationId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chat to start messaging
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