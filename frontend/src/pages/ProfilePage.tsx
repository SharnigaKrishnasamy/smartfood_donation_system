import { useState } from "react";
import { Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AuthAPI } from "../services/endpoints";
import { apiErrorMessage } from "../services/api";
import { InlineSpinner } from "../components/LoadingScreen";
import { MapPicker } from "../components/MapPicker";
import { getApiBaseUrl } from "../services/apiConfig";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { show } = useToast();
  if (!user) return null;

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [orgName, setOrgName] = useState(user.organization_name ?? "");
  const [lat, setLat] = useState<number | null>(user.latitude ?? null);
  const [lng, setLng] = useState<number | null>(user.longitude ?? null);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const profileImageUrl = user.profile_image ? `${getApiBaseUrl()}/uploads/${user.profile_image}` : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("address", address);
      if (lat != null) formData.append("latitude", String(lat));
      if (lng != null) formData.append("longitude", String(lng));
      if (user.role_name === "ngo") formData.append("organization_name", orgName);
      if (image) formData.append("profile_image", image);

      await AuthAPI.updateProfile(formData);
      await refreshUser();
      show("Profile updated", "success");
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPw(true);
    try {
      await AuthAPI.changePassword(currentPw, newPw);
      show("Password changed", "success");
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Your profile</h1>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-brand-100 dark:bg-brand-900 overflow-hidden flex items-center justify-center text-xl font-semibold text-brand-700 dark:text-brand-200">
              {image ? (
                <img src={URL.createObjectURL(image)} className="h-full w-full object-cover" alt="" />
              ) : profileImageUrl ? (
                <img src={profileImageUrl} className="h-full w-full object-cover" alt="" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white cursor-pointer shadow-sm">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-ink dark:text-brand-50">{user.email}</p>
            <p className="text-xs text-brand-500 capitalize">{user.role_name} account</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="p-name">Name</label>
            <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="p-phone">Phone</label>
            <input id="p-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {user.role_name === "ngo" && (
            <div className="col-span-2">
              <label className="label" htmlFor="p-org">Organization name</label>
              <input id="p-org" className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
          )}
          <div className="col-span-2">
            <label className="label" htmlFor="p-address">Address</label>
            <input id="p-address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <div>
          <span className="label">Location</span>
          <MapPicker latitude={lat} longitude={lng} onChange={(a, b) => { setLat(a); setLng(b); }} height="220px" />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <InlineSpinner />}
          Save changes
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="card p-6 space-y-4">
        <h2 className="font-display font-semibold text-ink dark:text-brand-50">Change password</h2>
        <div>
          <label className="label" htmlFor="current-pw">Current password</label>
          <input id="current-pw" type="password" required className="input" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="new-pw">New password</label>
          <input id="new-pw" type="password" required minLength={6} className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        </div>
        <button type="submit" disabled={changingPw} className="btn-secondary">
          {changingPw && <InlineSpinner />}
          Update password
        </button>
      </form>
    </div>
  );
}
