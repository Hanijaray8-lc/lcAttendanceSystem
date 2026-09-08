import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ImageCropModal } from '../components/ImageCropModal';
import { UserAvatar } from '../components/UserAvatar';
import {
  User, Phone, Mail, MapPin, Building2, Calendar, ShieldCheck, Save,
  Camera, Eye, EyeOff, Folder, Trash2, X, Check, Link as LinkIcon, Lock, KeyRound
} from 'lucide-react';

// ── Password Change Section Component ──────────────────────────────────────
const ChangePasswordSection = () => {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      alert('✅ Password changed successfully! Application will now log out. Please sign in using your new password.');
      logout();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <Lock className="w-5 h-5 text-primary" />
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Change Password</h2>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          ✅ Password changed successfully!
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Current Password *</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary"
            required
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New Password *</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary"
              required
            />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Confirm New Password *</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary"
              required
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" /> {saving ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
};
// ───────────────────────────────────────────────────────────────────────────

export const Profile = () => {
  const { user, setUser } = useAuth();
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [tempImageSrc, setTempImageSrc] = useState('');
  
  // Modals and Menu States
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatarContainerRef = useRef(null);
  const menuRef = useRef(null);

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync formData when user context loads/updates
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  const handlePhoneChange = (value) => {
    // Only numbers, max 10 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: cleaned });
  };

  // Check if profileImage is a custom uploaded photo
  const isCustomPhoto = profileImage && !profileImage.includes('unsplash.com') && !profileImage.includes('default');

  const getInitials = () => {
    if (!user?.firstName) return 'U';
    const first = user.firstName.charAt(0).toUpperCase();
    const last = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  // Toggle Context Menu via React Portal Positioning
  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!showMenu && avatarContainerRef.current) {
      const rect = avatarContainerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left)
      });
    }
    setShowMenu((prev) => !prev);
  };

  // Close Menu on Outside Click or Window Scroll
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    const handleScroll = () => {
      if (showMenu) setShowMenu(false);
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showMenu]);

  // Real-time Photo Auto-Sync to Database & AuthContext
  const savePhotoRealtime = async (newPhotoUrl) => {
    setProfileImage(newPhotoUrl);
    try {
      const payload = {
        ...formData,
        profileImage: newPhotoUrl
      };
      const res = await api.put('/auth/profile', payload);
      const updatedUser = res.data.data.user;
      setUser(updatedUser);
      localStorage.setItem('elms_user', JSON.stringify(updatedUser));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to sync profile photo', err);
    }
  };

  // 1. View Photo (Full Preview)
  const handleViewPhoto = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowViewModal(true);
  };

  // 2. Take Photo (Live Device Camera)
  const handleTakePhoto = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Unable to access device camera. Please allow camera permissions in your browser.');
      setShowCameraModal(false);
    }
  };

  const handleCaptureCamera = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedUrl = canvas.toDataURL('image/jpeg');

      // Stop camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      setShowCameraModal(false);
      setTempImageSrc(capturedUrl);
      setIsCropModalOpen(true);
    }
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  // 3. Upload Photo (File Choice)
  const handleUploadClick = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be under 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 4. Remove Photo (Reset to Initials)
  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    savePhotoRealtime('');
  };

  // Drag & Crop Complete -> Realtime Sync
  const handleCropComplete = (croppedImage) => {
    savePhotoRealtime(croppedImage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        profileImage
      };
      const res = await api.put('/auth/profile', payload);
      setUser(res.data.data.user);
      localStorage.setItem('elms_user', JSON.stringify(res.data.data.user));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 sm:pb-8">
      {/* Profile Banner Card */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        {/* Profile Avatar Container (Shows Initials Badge if no custom photo) */}
        <div ref={avatarContainerRef} className="relative">
          <div
            onClick={toggleMenu}
            className="relative cursor-pointer group rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl"
          >
            {isCustomPhoto ? (
              <img
                src={profileImage}
                alt={user?.firstName}
                className="w-28 h-28 object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black text-3xl flex items-center justify-center tracking-wider transition-transform group-hover:scale-105">
                {getInitials()}
              </div>
            )}

            {/* Camera Overlay Icon */}
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>

          <button
            type="button"
            onClick={toggleMenu}
            className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 border-2 border-white dark:border-slate-800"
            title="Profile Options"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-xs text-primary font-mono font-bold mt-1">{user?.employeeId}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-white uppercase">
                  {user?.role?.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-semibold">• {user?.department?.name || 'Human Resources'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-all shrink-0 self-center sm:self-auto"
            >
              <LinkIcon className="w-3.5 h-3.5" /> Paste Image URL
            </button>
          </div>

          {showUrlInput && (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (imageUrlInput.trim()) {
                    setTempImageSrc(imageUrlInput.trim());
                    setIsCropModalOpen(true);
                    setShowUrlInput(false);
                    setImageUrlInput('');
                  }
                }}
                className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold text-center">
          ✅ Profile picture and information updated successfully!
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              maxLength={10}
              placeholder="Enter 10-digit phone number"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email (Read Only)</label>
            <input
              type="text"
              value={formData.email || user?.email || ''}
              placeholder={user?.email || 'Email not available'}
              disabled
              className="w-full p-3 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Change Password Section */}
      <ChangePasswordSection />

      {/* React Portal Dropdown Menu attached to document.body */}
      {showMenu &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
            className="fixed w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2.5 z-[9999] transition-all"
          >
            <button
              type="button"
              onClick={handleViewPhoto}
              className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>View photo</span>
            </button>

            <button
              type="button"
              onClick={handleTakePhoto}
              className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>Take photo</span>
            </button>

            <button
              type="button"
              onClick={handleUploadClick}
              className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <Folder className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>Upload photo</span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            <button
              type="button"
              onClick={handleRemovePhoto}
              className="w-full px-4 py-2.5 text-left text-xs font-bold text-danger hover:bg-danger/10 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-danger" />
              <span>Remove photo</span>
            </button>
          </div>,
          document.body
        )}

      {/* 1. View Photo Lightbox Modal */}
      {showViewModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-2xl overflow-hidden p-4 shadow-2xl border border-slate-800 text-center">
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute top-4 right-4 p-2 text-white bg-slate-800 rounded-full hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {isCustomPhoto ? (
              <img
                src={profileImage}
                alt="Full Profile"
                className="w-80 h-80 mx-auto rounded-full object-cover border-4 border-slate-800 my-4 shadow-2xl"
              />
            ) : (
              <div className="w-80 h-80 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black text-6xl flex items-center justify-center border-4 border-slate-800 my-4 shadow-2xl">
                {getInitials()}
              </div>
            )}
            <p className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</p>
          </div>
        </div>
      )}

      {/* 2. Take Photo Live Camera Stream Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative max-w-md w-full bg-slate-900 rounded-2xl overflow-hidden p-5 shadow-2xl border border-slate-800 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" /> Take Live Photo
              </h4>
              <button onClick={closeCameraModal} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>

            <button
              type="button"
              onClick={handleCaptureCamera}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" /> Snap Photo & Crop
            </button>
          </div>
        </div>
      )}

      {/* 3. Drag & Crop Adjuster Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
