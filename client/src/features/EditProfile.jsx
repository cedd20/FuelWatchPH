import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, User, Camera, Save, Loader2, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { toast } from "sonner";
import { api as apiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";

export function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    avatar_url: "",
  });

  const [existingRequest, setExistingRequest] = useState(undefined);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiClient.get("/me/profile");
        if (data) {
          setFormData({
            username: data.username || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
          });
        }
      } catch (error) {
        setFormData({
          username: user?.username || user?.email?.split("@")[0] || "",
          bio: user?.bio || "",
          avatar_url: user?.avatar_url || "",
        });
      } finally {
        setIsFetching(false);
      }
    }
    if (user) fetchProfile();
  }, [user]);

  // Fetch existing verification request status for displaying Pending/Resubmit states
  useEffect(() => {
    async function checkExistingRequest() {
      try {
        const requests = await apiClient.get("/me/verifications");
        if (requests && requests.length > 0) {
          setExistingRequest(requests[0]);
        } else {
          setExistingRequest(null);
        }
      } catch (e) {
        console.error('Failed to check verification requests', e);
        setExistingRequest(null);
      } finally {
        setIsCheckingRequest(false);
      }
    }

    if (user) checkExistingRequest();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedProfile = await apiClient.put("/me/profile", formData);
      if (setUser) {
        setUser(prev => ({
          ...prev,
          ...updatedProfile,
          name: updatedProfile.username || prev.name,
          initials: (updatedProfile.username || prev.name || "U").substring(0, 1).toUpperCase(),
        }));
      }
      toast.success("Profile updated successfully!");
      navigate("/app/profile");
    } catch (error) {
      toast.error(error.body?.detail || error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB.");
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Image uploaded! Don't forget to save changes.");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-emerald-500/60 font-bold animate-pulse text-sm">Loading profile...</p>
      </div>
    );
  }

  const inputClass =
    "app-input w-full rounded-2xl border border-emerald-500/10 p-5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none transition-all";

  return (
    <div className="app-shell min-h-screen pb-28 text-foreground">
      {/* Header */}
      <div className="relative pt-14 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <button
              onClick={() => navigate(-1)}
              className="app-panel group rounded-full border border-emerald-500/10 p-3 shadow-2xl transition-all hover:bg-emerald-500 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Edit Profile</h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Update your public info</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-14 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Avatar Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="app-panel flex flex-col items-center rounded-[3rem] border border-emerald-500/10 p-10 shadow-2xl"
          >
            <div className="relative group mb-4">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-2xl shadow-emerald-500/20">
                <div className="app-panel-strong flex h-full w-full items-center justify-center overflow-hidden rounded-[2.2rem] border border-white/10">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-black text-emerald-500">
                      {(formData.username || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[var(--app-shell)] bg-emerald-500 shadow-xl transition-transform hover:scale-110 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Tap the camera to update photo
            </p>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="app-panel space-y-6 rounded-[3rem] border border-emerald-500/10 p-8 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="font-black">Basic Information</h2>
            </div>

            <div>
              <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username / Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Your name or username"
                  className={`${inputClass} pl-12`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us a bit about yourself..."
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Verification Row */}
            <div className="pt-4 border-t border-emerald-500/5">
              <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity Verification</label>
              {/* Simplified Verification Section */}
              <div className="app-elevated flex items-center justify-between rounded-2xl border border-emerald-500/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <Shield className="w-5 h-5 text-emerald-500/40" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verification</div>
                    <div className="mt-0.5 text-xs font-bold text-foreground">
                      {user?.is_verified ? "Verified Member" : "Not Verified"}
                    </div>
                  </div>
                </div>

                <div>
                  {user?.is_verified ? (
                    <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  ) : (
                    (function(){
                      const status = existingRequest?.status;
                      if (!existingRequest) {
                        return (
                          <button
                            type="button"
                            onClick={() => navigate("/app/verify-identity")}
                            className="text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors"
                          >
                            Verify Now
                          </button>
                        );
                      }

                      if (status === 'pending') {
                        return (
                          <span className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest">Pending</span>
                        );
                      }

                      if (status === 'needs_correction') {
                        return (
                          <button
                            type="button"
                            onClick={() => navigate("/app/verify-identity")}
                            className="text-amber-400 text-[10px] font-black uppercase tracking-widest hover:text-amber-300 transition-colors"
                          >
                            Fix Status
                          </button>
                        );
                      }

                      if (status === 'rejected') {
                        return (
                          <button
                            type="button"
                            onClick={() => navigate("/app/verify-identity")}
                            className="text-rose-400 text-[10px] font-black uppercase tracking-widest hover:text-rose-300 transition-colors"
                          >
                            Retry
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => navigate("/app/verify-identity")}
                          className="text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors"
                        >
                          Verify
                        </button>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="app-panel flex-1 rounded-2xl border border-emerald-500/10 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground transition-all hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-5 bg-emerald-500 text-[#050A09] rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-emerald-500/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Save className="w-4 h-4" strokeWidth={3} /> Save Profile</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
