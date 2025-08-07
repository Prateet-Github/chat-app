import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureUserExists = async (authUser) => {
    if (!authUser) return;

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id, avatar_url, status")
        .eq("id", authUser.id)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking user existence:", checkError);
        return;
      }

      if (!existingUser) {
        const { error: insertError } = await supabase.from("users").insert([
          {
            id: authUser.id,
            email: authUser.email,
            username:
              authUser.user_metadata?.username ||
              authUser.email?.split("@")[0] ||
              `user_${authUser.id.slice(0, 8)}`,
            avatar_url: "/Images/me.jpeg",
            status: "Hey there! I am using Chat.",
          },
        ]);
        if (insertError) {
          console.error("Error creating user record:", insertError);
        }
      } else {
        // Fix missing avatar or status
        if (!existingUser.avatar_url || !existingUser.status) {
          await supabase
            .from("users")
            .update({
              avatar_url: existingUser.avatar_url || "/Images/me.jpeg",
              status: existingUser.status || "Hey there! I am using Chat.",
            })
            .eq("id", authUser.id);
        }
      }
    } catch (error) {
      console.error("Error in ensureUserExists:", error);
    }
  };

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error("Error getting session:", error);

        if (active) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) await ensureUserExists(currentUser);
          setLoading(false);
        }
      } catch (err) {
        console.error("InitAuth error:", err);
        if (active) setLoading(false);
      }
    };

    initAuth();

    // Auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) await ensureUserExists(currentUser);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, username) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <p>Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};