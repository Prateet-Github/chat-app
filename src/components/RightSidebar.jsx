import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const RightSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [media, setMedia] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchProfileAndMedia = async () => {
      // 1️⃣ Get profile info from `users`
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("id, username, avatar_url, status")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError && userProfile) {
        setProfile(userProfile);
      }

      // 2️⃣ Get last 6 media files from `messages`
      const { data: mediaMessages, error: mediaError } = await supabase
        .from("messages")
        .select("file_url")
        .eq("sender_id", user.id)
        .eq("message_type", "image")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!mediaError && mediaMessages) {
        setMedia(mediaMessages.map((m) => m.file_url));
      }
    };

    fetchProfileAndMedia();
  }, [user]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/"); // back to login
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="w-full h-full border-l border-gray-300 p-4 bg-white flex flex-col justify-between">
      {/* Top User Info */}
      <div className="space-y-2">
        <div className="flex flex-col items-center text-center space-y-1">
          <img
            src={profile?.avatar_url || "/Images/me.jpeg"}
            alt="profile"
            className="w-20 h-20 rounded-full bg-gray-300"
          />
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {profile?.username || "Loading..."}
            <span
              className={`w-2 h-2 rounded-full ${
                profile?.status === "online" ? "bg-green-500" : "bg-gray-400"
              }`}
            ></span>
          </h3>
          <p className="text-sm text-gray-500">{profile?.status || "offline"}</p>
        </div>

        <hr className="my-4 border-gray-300" />

        {/* Media Section */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Media</p>
          <div className="grid grid-cols-3 gap-2">
            {media.length > 0 ? (
              media.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="Media"
                  className="w-full h-20 object-cover rounded bg-gray-200"
                />
              ))
            ) : (
              <p className="text-gray-400 text-sm col-span-3">No media yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition"
      >
        Log Out
      </button>
    </div>
  );
};

export default RightSidebar;