'use client';
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import { getAccountTier, setAccountTier, canUpgradeTo } from "../utils/entitlements";
import { getApiBaseUrl } from "@/lib/config";

interface UserProfile {
  email: string;
  role?: string;
  name?: string;
  phone?: string;
  company?: string;
  company_email?: string;
  company_phone?: string;
  age?: string;
  gender?: string;
  location?: string;
  account_no?: string;
  photo_path?: string;
  document_path?: string;
}

interface DeletionStatus {
  status: string;
  requested_at?: string;
  purge_after?: string;
}

export default function AccountPage() {
  const { user, token, updateProfile, deleteAccount, getDeletionStatus, undoDeletion } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>({ status: "none" });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [currentTier, setCurrentTierState] = useState(getAccountTier());

  useEffect(() => {
    (async () => {
      if (!token) { setLoading(false); return; }
      try {
        const response = await fetch(`${getApiBaseUrl()}/profile/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          const p = data?.profile || null;
          setProfile(p);
          setEditForm({ name: p?.display_name, location: p?.location });
          setAvatarPreview(p?.avatar_medium || p?.avatar_thumb || null);
        }
      } catch (e) { console.error(e); }
      try {
        const status = await getDeletionStatus();
        setDeletionStatus(status);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [token, getDeletionStatus]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${getApiBaseUrl()}/profile/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        const p = data?.profile || null;
        setProfile(p);
        setEditForm({
          name: p?.display_name,
          location: p?.location,
        });
        setAvatarPreview(p?.avatar_medium || p?.avatar_thumb || null);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeletionStatus = async () => {
    try {
      const status = await getDeletionStatus();
      setDeletionStatus(status);
    } catch (error) {
      console.error("Failed to load deletion status:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Update basic profile fields via AuthProvider
      await updateProfile({
        name: editForm.name,
        account_type: editForm.role === "business" ? "business" : "personal"
      });

      // Update username/display/location via backend
      if (token && (editForm as any).username) {
        const form = new FormData();
        form.set("username", (editForm as any).username);
        if (editForm.name) form.set("display_name", editForm.name);
        if (editForm.location) form.set("location", editForm.location);
        await fetch(`${getApiBaseUrl()}/profile/me`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: form });
      }

      // Reload
      await loadProfile();
      setEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const onAvatarChoose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !token) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.set('file', f);
      const res = await fetch(`${getApiBaseUrl()}/profile/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAvatarPreview(data.url_medium || data.url_thumb || data.url_full);
    } catch (err) {
      console.error('avatar upload failed', err);
      alert('Avatar upload failed. Use jpg/png/webp up to 8MB.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(deleteReason || undefined);
      await loadDeletionStatus();
      setShowDeleteConfirm(false);
      setDeleteReason("");
    } catch (error) {
      console.error("Failed to request account deletion:", error);
      alert("Failed to request account deletion. Please try again.");
    }
  };

  const handleUndoDeletion = async () => {
    try {
      await undoDeletion();
      await loadDeletionStatus();
    } catch (error) {
      console.error("Failed to cancel deletion:", error);
      alert("Failed to cancel deletion request. Please try again.");
    }
  };

  const handleUpgradeToEnterprise = () => {
    setAccountTier('enterprise');
    setCurrentTierState('enterprise');
    alert('Successfully upgraded to Enterprise plan! You now have access to all features.');
  };

  const handleExportData = async () => {
    try {
  const response = await fetch(`${getApiBaseUrl()}/account/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tregu:token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tregu_data_export.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to export data. Please try again.");
      }
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  if (!user) return <div className="p-6">Please sign in to view your account.</div>;
  if (loading) return <div className="p-6">Loading your profile...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your profile and account preferences</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Account ID</div>
            <div className="font-mono text-lg font-semibold">{profile?.account_no || "Loading..."}</div>
          </div>
        </div>
      </div>

      {/* Account Status Alert */}
      {deletionStatus.status === "pending" && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-orange-600">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-orange-800">Account Deletion Pending</h3>
                <p className="text-orange-700">
                  Your account is scheduled for deletion on {new Date(deletionStatus.purge_after!).toLocaleDateString()}.
                  You can still cancel this request.
                </p>
              </div>
            </div>
            <button
              onClick={handleUndoDeletion}
              className="btn bg-orange-600 text-white hover:bg-orange-500"
            >
              Cancel Deletion
            </button>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="rounded-2xl border bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <div className="space-x-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="btn bg-blue-600 text-white hover:bg-blue-500"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditForm(profile || {});
                  }}
                  className="btn bg-gray-600 text-white hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="btn bg-green-600 text-white hover:bg-green-500"
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col items-start gap-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border bg-gray-100">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Avatar</div>
              )}
            </div>
            <div>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" ref={fileRef} onChange={onAvatarChoose} />
              <button disabled={avatarUploading} onClick={()=>fileRef.current?.click()} className="btn bg-gray-700 text-white hover:bg-gray-600 text-sm">
                {avatarUploading ? 'Uploading…' : 'Change Avatar'}
              </button>
            </div>
          </div>
          <ProfileField
            label="Full Name"
            value={profile?.name}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, name: value }))}
          />
          <ProfileField
            label="Username"
            value={(editForm as any)?.username || ''}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, username: value } as any))}
          />
          <ProfileField
            label="Email"
            value={profile?.email}
            readOnly
          />
          <ProfileField
            label="Phone"
            value={profile?.phone}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, phone: value }))}
          />
          <ProfileField
            label="Role"
            value={profile?.role}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
          />
          <ProfileField
            label="Company"
            value={profile?.company}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, company: value }))}
          />
          <ProfileField
            label="Company Email"
            value={profile?.company_email}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, company_email: value }))}
          />
          <ProfileField
            label="Company Phone"
            value={profile?.company_phone}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, company_phone: value }))}
          />
          <ProfileField
            label="Age"
            value={profile?.age}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, age: value }))}
          />
          <ProfileField
            label="Gender"
            value={profile?.gender}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}
          />
          <ProfileField
            label="Location"
            value={profile?.location}
            editing={editing}
            onChange={(value) => setEditForm(prev => ({ ...prev, location: value }))}
          />
        </div>
      </div>

      {/* Account Tier */}
      <div className="rounded-2xl border bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Account Plan</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentTier === 'enterprise'
                  ? 'bg-green-100 text-green-800'
                  : currentTier === 'pro'
                  ? 'bg-purple-100 text-purple-800'
                  : currentTier === 'standard'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentTier === 'enterprise' ? 'Enterprise Plan' :
                 currentTier === 'pro' ? 'Pro Plan' :
                 currentTier === 'standard' ? 'Standard Plan' : 'Starter Plan'}
              </div>
              {currentTier === 'starter' && (
                <span className="text-sm text-gray-500">Free</span>
              )}
            </div>
            <p className="text-gray-600 mt-2">
              {currentTier === 'enterprise'
                ? 'Full access to all Tregu business features including advanced inventory management, analytics, and integrations.'
                : currentTier === 'pro'
                ? 'Advanced features with team collaboration, analytics, and integrations.'
                : currentTier === 'standard'
                ? 'Enhanced features for growing businesses with order management and bulk import.'
                : 'Basic access with product listings and barcode scanning. Upgrade for advanced features.'
              }
            </p>
          </div>
        </div>

        {/* Tier Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Available Plans</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { id: 'starter', name: 'Starter', price: 'Free', description: 'Basic features for getting started' },
              { id: 'standard', name: 'Standard', price: '$19/mo', description: 'Enhanced features for growing businesses' },
              { id: 'pro', name: 'Pro', price: '$49/mo', description: 'Advanced features with team collaboration' },
              { id: 'enterprise', name: 'Enterprise', price: 'Contact Sales', description: 'Full platform access with dedicated support' }
            ].map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  currentTier === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  if (plan.id === 'enterprise') {
                    alert('Enterprise accounts require contacting Tregu customer service for activation. Please email enterprise@tregu.com or call 1-800-TREGU-1 to upgrade.');
                  } else if (canUpgradeTo(plan.id as any)) {
                    setAccountTier(plan.id as any);
                    setCurrentTierState(plan.id as any);
                    alert(`Successfully upgraded to ${plan.name} plan!`);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{plan.name}</h4>
                  <span className="text-sm font-medium text-gray-600">{plan.price}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                {currentTier === plan.id && (
                  <div className="text-xs text-blue-600 font-medium">Current Plan</div>
                )}
                {plan.id !== 'enterprise' && canUpgradeTo(plan.id as any) && (
                  <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                    Upgrade
                  </button>
                )}
                {plan.id === 'enterprise' && (
                  <button className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                    Contact Sales
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="rounded-2xl border bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Account Actions</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Export Your Data</h3>
              <p className="text-sm text-gray-600">Download a copy of all your data in JSON format</p>
            </div>
            <button
              onClick={handleExportData}
              className="btn bg-gray-600 text-white hover:bg-gray-500"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-red-800">Danger Zone</h2>
        <div className="space-y-4">
          <div className="p-4 border border-red-300 rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-800">Delete Account</h3>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                  {deletionStatus.status === "pending"
                    ? " You have a pending deletion request."
                    : " You will have 30 days to recover your account after requesting deletion."
                  }
                </p>
              </div>
              {deletionStatus.status !== "pending" && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn bg-red-600 text-white hover:bg-red-500"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Account Deletion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete your account? This action will:
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
              <li>• Permanently delete all your data after 30 days</li>
              <li>• Remove access to all your business listings</li>
              <li>• Cancel any pending transactions</li>
              <li>• Delete your profile and account information</li>
            </ul>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={3}
                placeholder="Please let us know why you're leaving..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn bg-gray-600 text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-500"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({
  label,
  value,
  editing = false,
  readOnly = false,
  onChange
}: {
  label: string;
  value?: string;
  editing?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {editing && !readOnly ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      ) : (
        <div className="p-2 bg-gray-50 border rounded-lg min-h-[40px] flex items-center">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </div>
      )}
    </div>
  );
}
