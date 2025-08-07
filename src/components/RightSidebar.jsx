import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const RightSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [media, setMedia] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfileAndMedia = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // ✅ Fetch profile from `users` table
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("id, username, avatar_url, status")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setProfile(userProfile);

        // ✅ Fetch recent 6 images sent by the user
        const { data: mediaMessages, error: mediaError } = await supabase
          .from("messages")
          .select("file_url")
          .eq("sender_id", user.id)
          .eq("message_type", "image")
          .not("file_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(6);

        if (mediaError) throw mediaError;

        setMedia(mediaMessages.map((m) => m.file_url));
      } catch (err) {
        console.error("RightSidebar fetch error:", err.message);
        setErrorMsg("Failed to load profile or media.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndMedia();
  }, [user]);

  // Close fullscreen image on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleLogout = async () => {
    setErrorMsg(null);
    const { error } = await signOut();
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center border-l border-gray-300 bg-white">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full border-l border-gray-300 p-4 bg-white flex flex-col justify-between">
        {/* Profile Info */}
        <div className="space-y-2">
          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-col items-center text-center space-y-1">
            <img
              src={profile?.avatar_url?.trim() || "/Images/me.jpeg"}
              alt="profile"
              className="w-20 h-20 rounded-full bg-gray-300"
            />
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              {profile?.username || "Unknown User"}
              <span
                className={`w-2 h-2 rounded-full ${
                  profile?.status?.toLowerCase() === "online"
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              ></span>
            </h3>
            <p className="text-sm text-gray-500">{profile?.status || "offline"}</p>
          </div>

          <hr className="my-4 border-gray-300" />

          {/* Media Gallery */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Media</p>
            <div className="grid grid-cols-3 gap-2">
              {media.length > 0 ? (
                media.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="Media"
                    onClick={() => setSelectedImage(url)}
                    className="w-full h-20 object-cover rounded bg-gray-200 cursor-pointer hover:opacity-80 transition"
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

      {/* Fullscreen Image Preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="fullscreen"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
    </>
  );
};

export default RightSidebar;