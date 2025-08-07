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
    if (!user || !otherUserIdentifier) {
      console.log("Missing required data:", { user: !!user, otherUserIdentifier });
      return;
    }

    const getOrCreateConversation = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Verify current user exists
        const { data: currentUser, error: currentUserError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (currentUserError || !currentUser) throw new Error("Current user not found");

        // 2. Get other user's ID
        let otherUserId = otherUserIdentifier;
        if (!isValidUUID(otherUserIdentifier)) {
          const { data: foundUser, error: findError } = await supabase
            .from("users")
            .select("id")
            .or(`username.eq.${otherUserIdentifier},email.eq.${otherUserIdentifier}`);

          if (findError || !foundUser?.length) {
            throw new Error(`User '${otherUserIdentifier}' not found`);
          }
          otherUserId = foundUser[0].id;
        } else {
          const { data: existingUser, error: verifyError } = await supabase
            .from("users")
            .select("id")
            .eq("id", otherUserIdentifier)
            .maybeSingle();
          if (verifyError || !existingUser) throw new Error("User not found");
        }

        if (otherUserId === user.id) throw new Error("Cannot create conversation with yourself");

        // 3. Check existing conversation
        const { data: myConvos } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        const myConvoIds = myConvos?.map(p => p.conversation_id) || [];

        const { data: sharedConvos } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", otherUserId)
          .in("conversation_id", myConvoIds);

        const existingConvoId = sharedConvos?.[0]?.conversation_id;
        if (existingConvoId) {
          setConversationId(existingConvoId);
          return;
        }

        // 4. Create new conversation
        const { data: convo, error: convoErr } = await supabase
          .from("conversations")
          .insert([{ is_group: false, creator_id: user.id }])
          .select()
          .single();

        if (convoErr) throw convoErr;

        // 5. Add participants
        const { error: addErr } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: convo.id, user_id: user.id },
            { conversation_id: convo.id, user_id: otherUserId },
          ]);

        if (addErr) throw addErr;

        setConversationId(convo.id);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    getOrCreateConversation();
  }, [user, otherUserIdentifier]);

  return { conversationId, loading, error };
};