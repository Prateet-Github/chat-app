import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const ProfileUpdate = () => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("/Images/me.jpeg");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("username, avatar_url, status")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUsername(data.username || "");
          setStatus(data.status || "");
          setPreviewUrl(data.avatar_url?.trim() || "/Images/me.jpeg");
        }
      } catch (err) {
        console.error("Error fetching profile:", err.message);
      }
    };

    fetchProfile();
  }, [user]);

  // Handle avatar image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    let avatarUrl = previewUrl;

    try {
      // Upload new avatar if changed
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, image, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      // Update DB record
      const { error: updateError } = await supabase
        .from("users")
        .update({
          username: username.trim(),
          status: status.trim(),
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err.message);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-2.5 flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4"
        >
          <h3 className="text-xl font-semibold text-gray-800">
            Profile Details
          </h3>

          {/* Avatar Upload */}
          <label htmlFor="avatar" className="cursor-pointer">
            <input
              onChange={handleImageChange}
              type="file"
              id="avatar"
              accept="image/png, image/jpeg"
              hidden
            />
            <img
              src={previewUrl}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 hover:opacity-80 transition"
            />
          </label>

          {/* Username */}
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Status */}
          <textarea
            placeholder="Write profile bio"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            rows={3}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdate;