import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const { user } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("users")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    if (!error) setProfile(data);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data: participantCheck } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversationId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!participantCheck) {
          setMessages([]);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("messages")
          .select(`
            *,
            sender:users!messages_sender_id_fkey(username, avatar_url)
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const { data: fullMessage } = await supabase
            .from("messages")
            .select(`
              *,
              sender:users!messages_sender_id_fkey(username, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          setMessages((prev) =>
            prev.some((m) => m.id === fullMessage.id) ? prev : [...prev, fullMessage]
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, user]);

  const sendMessage = async (content = "", fileUrl = null, messageType = "text") => {
    if (!user || !conversationId) return;

    const { data: participantCheck } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!participantCheck) {
      return { error: { message: "You are not a participant in this conversation" } };
    }

    const optimisticMessage = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      file_url: fileUrl,
      message_type: fileUrl ? "image" : messageType,
      created_at: new Date().toISOString(),
      sender: {
        username: profile?.username || "You",
        avatar_url: profile?.avatar_url || "/Images/me.jpeg",
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        file_url: fileUrl,
        message_type: fileUrl ? "image" : messageType,
      },
    ]);

    if (error) {
      console.error("Send message error:", error);
      return { error };
    }
  };

  return { messages, loading, sendMessage };
};