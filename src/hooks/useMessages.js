import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:users(username, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch full message with sender details
          const { data: fullMessage, error } = await supabase
            .from("messages")
            .select(`
              *,
              sender:users(username, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (!error && fullMessage) {
            setMessages((prev) => [...prev, fullMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId]);

  const sendMessage = async (content, messageType = "text") => {
    if (!user || !conversationId) return;

    const { data, error } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type: messageType,
      },
    ]);

    return { data, error };
  };

  return { messages, loading, sendMessage };
};