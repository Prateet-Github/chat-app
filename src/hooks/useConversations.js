import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export const useConversation = (otherUserIdentifier) => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isValidUUID = (val) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

  useEffect(() => {
    if (!user || !otherUserIdentifier) return;

    const getOrCreateConversation = async () => {
      setLoading(true);
      setError(null);

      try {
        let otherUserId = otherUserIdentifier;

        // Step 1: Lookup by username/email if not UUID
        if (!isValidUUID(otherUserIdentifier)) {
          const { data: usernameResult } = await supabase
            .from("users")
            .select("id")
            .eq("username", otherUserIdentifier)
            .maybeSingle();

          if (usernameResult) {
            otherUserId = usernameResult.id;
          } else {
            const { data: emailResult } = await supabase
              .from("users")
              .select("id")
              .eq("email", otherUserIdentifier)
              .maybeSingle();

            if (emailResult) {
              otherUserId = emailResult.id;
            } else {
              throw new Error(`User "${otherUserIdentifier}" not found`);
            }
          }
        }

        if (otherUserId === user.id) {
          throw new Error("Cannot create conversation with yourself");
        }

        // Step 2: Check if a conversation already exists for both users
        const { data: allParticipantRows, error: participantsError } = await supabase
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("user_id", [user.id, otherUserId]);

        if (participantsError) throw participantsError;

        // Count how many times each conversation_id appears
        const conversationCount = {};
        allParticipantRows.forEach((row) => {
          conversationCount[row.conversation_id] =
            (conversationCount[row.conversation_id] || 0) + 1;
        });

        // Find a conversation where both users are participants (count === 2)
        const sharedConversationId = Object.entries(conversationCount)
          .find(([_, count]) => count === 2)?.[0];

        if (sharedConversationId) {
          setConversationId(sharedConversationId);
          setLoading(false);
          return;
        }

        // Step 3: If no existing conversation, create one
        const { data: newConvo, error: convoError } = await supabase
          .from("conversations")
          .insert([{ is_group: false, creator_id: user.id }])
          .select()
          .single();

        if (convoError) throw convoError;

        // Add both users as participants
        const { error: participantInsertError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: newConvo.id, user_id: user.id },
            { conversation_id: newConvo.id, user_id: otherUserId },
          ]);

        if (participantInsertError) throw participantInsertError;

        setConversationId(newConvo.id);
      } catch (err) {
        console.error("useConversation error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getOrCreateConversation();
  }, [user, otherUserIdentifier]);

  return { conversationId, loading, error };
};