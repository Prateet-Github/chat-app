import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const ProfileUpdate = () => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // 1️⃣ Load current profile when page opens
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("username, avatar_url, status")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        setUsername(data.username || "");
        setStatus(data.status || "");
        setPreviewUrl(data.avatar_url || "/Images/me.jpeg");
      }
    };

    fetchProfile();
  }, [user]);

  // 2️⃣ Handle file change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ✅ Ensure avatars bucket exists before uploading
  const ensureBucketExists = async () => {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((bucket) => bucket.name === "avatars");

    if (!exists) {
      const { error } = await supabase.storage.createBucket("avatars", {
        public: true,
      });
      if (error) {
        console.error("Error creating bucket:", error.message);
        throw error;
      }
    }
  };

  // 3️⃣ Save profile updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    let avatarUrl = previewUrl;

    try {
      await ensureBucketExists();

      // Upload image if selected
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName; // ✅ No "avatars/" prefix

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, image, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      // Update user table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          username,
          status,
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4"
        >
          <h3 className="text-xl font-semibold text-gray-800">
            Profile Details
          </h3>

          {/* Avatar */}
          <label htmlFor="avatar" className="cursor-pointer">
            <input
              onChange={handleImageChange}
              type="file"
              id="avatar"
              accept="image/png, image/jpeg"
              hidden
            />
            <img
              src={previewUrl || "/Images/me.jpeg"}
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
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>

          {/* Save button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </form>

        {/* Preview */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Current Profile Picture:</p>
          <img
            src={previewUrl || "/Images/me.jpeg"}
            alt="preview"
            className="w-20 h-20 rounded-full mx-auto object-cover border border-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdate;