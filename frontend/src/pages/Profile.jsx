import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

// A blank address, used to reset the modal form for "Add Address"
const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState("");

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [addressError, setAddressError] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users/profile");
      setProfile(res.data);
      setFormData({ name: res.data.name, email: res.data.email });
    } catch (err) {
      setError("Could not load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const emailChanged = formData.email.trim().toLowerCase() !== profile?.email;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    if (emailChanged && !currentPasswordForEmail) {
      setSaveError("Enter your current password to change your email.");
      return;
    }

    setSaving(true);
    try {
      const payload = { name: formData.name, email: formData.email };
      if (emailChanged) {
        payload.currentPassword = currentPasswordForEmail;
      }

      const res = await axiosInstance.put("/users/profile", payload);
      setProfile(res.data);
      updateUser({ name: res.data.name, email: res.data.email });
      setSaveSuccess("Profile updated successfully.");
      setEditing(false);
      setCurrentPasswordForEmail("");
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({ name: profile.name, email: profile.email });
    setCurrentPasswordForEmail("");
    setSaveError("");
    setEditing(false);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      await axiosInstance.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess("Password changed successfully.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPicture(true);
    setPictureError("");

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const uploadRes = await axiosInstance.post("/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newPictureUrl = uploadRes.data.url;

      const updateRes = await axiosInstance.put("/users/profile", {
        profilePicture: newPictureUrl,
      });

      setProfile(updateRes.data);
      updateUser({ profilePicture: updateRes.data.profilePicture });
    } catch (err) {
      setPictureError("Failed to upload profile picture.");
    } finally {
      setUploadingPicture(false);
    }
  };

  const openAddAddressModal = () => {
    setAddressForm(EMPTY_ADDRESS);
    setEditingAddressId(null);
    setAddressError("");
    setShowAddressModal(true);
  };

  const openEditAddressModal = (address) => {
    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address._id);
    setAddressError("");
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setAddressError("");
  };

  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError("");
    setSavingAddress(true);

    try {
      let res;
      if (editingAddressId) {
        res = await axiosInstance.put(`/users/addresses/${editingAddressId}`, addressForm);
      } else {
        res = await axiosInstance.post("/users/addresses", addressForm);
      }
      setProfile((prev) => ({ ...prev, addresses: res.data }));
      setShowAddressModal(false);
    } catch (err) {
      setAddressError(err.response?.data?.message || "Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const confirmDelete = window.confirm("Delete this address?");
    if (!confirmDelete) return;

    try {
      const res = await axiosInstance.delete(`/users/addresses/${addressId}`);
      setProfile((prev) => ({ ...prev, addresses: res.data }));
    } catch (err) {
      setError("Failed to delete address.");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await axiosInstance.put(`/users/addresses/${addressId}/set-default`);
      setProfile((prev) => ({ ...prev, addresses: res.data }));
    } catch (err) {
      setError("Failed to set default address.");
    }
  };

  if (loading) return <p className="text-center py-10 text-gray-500">Loading profile...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>

      {profile.role !== "admin" && (
        <div className="bg-white shadow rounded p-6 mb-6 flex items-center gap-4">
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold">
              {profile.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePictureChange}
              className="text-sm"
            />
            {uploadingPicture && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            {pictureError && <p className="text-sm text-red-600 mt-1">{pictureError}</p>}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Profile Details</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-indigo-600 hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {saveSuccess && !editing && (
          <p className="text-sm text-green-600 mb-3">{saveSuccess}</p>
        )}

        {!editing ? (
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Name:</span> {profile.name}</p>
            <p><span className="text-gray-500">Email:</span> {profile.email}</p>
            <p>
              <span className="text-gray-500">Joined:</span>{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>

            {emailChanged && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Current Password <span className="text-gray-400">(required to change email)</span>
                </label>
                <input
                  type="password"
                  value={currentPasswordForEmail}
                  onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>
            )}

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="border px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white shadow rounded p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Password</h2>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="text-sm text-indigo-600 hover:underline"
            >
              Change Password
            </button>
          )}
        </div>

        {passwordSuccess && !showPasswordForm && (
          <p className="text-sm text-green-600">{passwordSuccess}</p>
        )}

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>

            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {changingPassword ? "Saving..." : "Update Password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                  setPasswordError("");
                }}
                className="border px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {profile.role !== "admin" && (
        <div className="bg-white shadow rounded p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Saved Addresses</h2>
            <button
              onClick={openAddAddressModal}
              className="text-sm text-indigo-600 hover:underline"
            >
              + Add Address
            </button>
          </div>

          {profile.addresses.length === 0 ? (
            <p className="text-sm text-gray-500">No saved addresses yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.addresses.map((address) => (
                <div
                  key={address._id}
                  className={
                    "border rounded p-3 text-sm " +
                    (address.isDefault ? "border-indigo-400 bg-indigo-50" : "border-gray-200")
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {address.fullName}{" "}
                        {address.isDefault && (
                          <span className="ml-1 text-xs text-indigo-600 font-semibold">
                            (Default)
                          </span>
                        )}
                      </p>
                      <p className="text-gray-600">{address.phone}</p>
                      <p className="text-gray-600">
                        {address.addressLine1}
                        {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                      </p>
                      <p className="text-gray-600">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-gray-600">{address.country}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => openEditAddressModal(address)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address._id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(address._id)}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {profile.role !== "admin" && (
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-lg font-semibold mb-4">Need Help?</h2>

          <div className="space-y-3 text-sm">
            
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=venkyvenkyy129@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
            >
              <span>📧</span>
              <span>venkyvenkyy129@gmail.com</span>
            </a>

            
            <a
              href="https://wa.me/918904629757"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
            >
              <span>📞</span>
              <span>+91 8904629757</span>
            </a>

            <div className="flex items-center gap-2 text-gray-700">
              <span>🕒</span>
              <span>Mon - Sat, 9:00 AM - 6:00 PM</span>
            </div>
          </div>

          
          <a
            href="https://wa.me/918904629757"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
          >
            💬 Chat with Us
          </a>
        </div>
      )}

      {showAddressModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeAddressModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingAddressId ? "Edit Address" : "Add Address"}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input
                  name="fullName"
                  value={addressForm.fullName}
                  onChange={handleAddressFormChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleAddressFormChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Address Line 1</label>
                <input
                  name="addressLine1"
                  value={addressForm.addressLine1}
                  onChange={handleAddressFormChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Address Line 2 <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  name="addressLine2"
                  value={addressForm.addressLine2}
                  onChange={handleAddressFormChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">City</label>
                  <input
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressFormChange}
                    required
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">State</label>
                  <input
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressFormChange}
                    required
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Postal Code</label>
                  <input
                    name="postalCode"
                    value={addressForm.postalCode}
                    onChange={handleAddressFormChange}
                    required
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Country</label>
                  <input
                    name="country"
                    value={addressForm.country}
                    onChange={handleAddressFormChange}
                    required
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleAddressFormChange}
                />
                Set as default address
              </label>

              {addressError && <p className="text-sm text-red-600">{addressError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="border px-4 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
