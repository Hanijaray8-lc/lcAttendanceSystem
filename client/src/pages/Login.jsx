import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ASSETS } from '../assets';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  MoveRight,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Clock,
  User,
  Building2,
  Send
} from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // In-Card Page Navigation State: 'front' | 'login' | 'forgot'
  const [cardPage, setCardPage] = useState('front');

  // Forgot Password In-Card States
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetPreviewUrl, setResetPreviewUrl] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('lms_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let finalEmail = email.trim();
    if (!finalEmail) {
      setError('Please enter your email or username.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail}@enterprise.com`;
    }

    setLoading(true);

    try {
      await login(finalEmail, password);

      if (rememberMe) {
        localStorage.setItem('lms_remembered_email', finalEmail);
      } else {
        localStorage.removeItem('lms_remembered_email');
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Check email and password.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgot = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResetEmail(email);
    setResetStep(1);
    setResetError('');
    setResetSuccessMessage('');
    setCardPage('forgot');
  };

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    let target = resetEmail.trim();
    if (!target) {
      setResetError('Please enter your registered email address or username.');
      return;
    }

    if (!target.includes('@')) {
      target = `${target}@enterprise.com`;
      setResetEmail(target);
    }

    setResetLoading(true);
    setResetError('');

    try {
      const res = await api.post('/auth/forgot-password', { email: target });
      setResetStep(2);
      setResetPreviewUrl(res.data?.previewUrl || '');
      setResetLink(res.data?.resetUrl || '');

      if (res.data?.resetUrl) {
        try {
          const urlObj = new URL(res.data.resetUrl);
          setResetToken(urlObj.searchParams.get('token') || '');
        } catch (err) {
          // ignore url parse error
        }
      }
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to send reset link. Try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccessMessage('');

    if (!newPassword) {
      setResetError('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token: resetToken,
        email: resetEmail,
        password: newPassword,
        confirmPassword: confirmNewPassword
      });

      setResetSuccessMessage('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        setCardPage('login');
        setResetStep(1);
        setNewPassword('');
        setConfirmNewPassword('');
        setResetSuccessMessage('');
      }, 2000);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-screen w-full max-w-full bg-slate-900 flex items-center justify-center p-3 sm:p-4 overflow-hidden relative transition-colors duration-200">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      >
        <source src={ASSETS.bgVideo} type="video/mp4" />
      </video>

      {/* Subtle overlay for optimal card readability */}
      <div className="absolute inset-0 bg-slate-950/15 backdrop-blur-[1px] pointer-events-none z-0" />

      {/* Uiverse 3D Interactive Flip Card Container */}
      <div
        className={`uiverse-card my-auto max-w-md w-full ${cardPage !== 'front' ? 'is-flipped' : ''}`}
        onClick={() => {
          if (cardPage === 'front') {
            setCardPage('login');
          }
        }}
      >
        <div className="uiverse-content">
          {/* ================= FRONT SIDE (Interactive Flip Card - Exact Image 1 Design) ================= */}
          <div className="uiverse-front">
            <div className="uiverse-front-inner p-5 sm:p-6 text-center flex flex-col justify-between items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
              
              {/* Top Pill Badge: • LIFE CHANGERS IND • PORTAL • */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50/90 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/90 dark:border-blue-800/80 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                <span>LIFE CHANGERS IND • PORTAL</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              </div>

              {/* Main Circular Logo Container with Soft Radiant Blue Glow Aura */}
              <div className="relative group cursor-pointer my-1 inline-flex items-center justify-center">
                <div className="absolute -inset-3 bg-gradient-to-tr from-blue-400 via-sky-300 to-indigo-400 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                <div className="relative w-24 h-24 sm:w-26 sm:h-26 rounded-full bg-white dark:bg-slate-900 shadow-[0_0_35px_rgba(59,130,246,0.45)] flex items-center justify-center p-3.5 transition-transform duration-300 group-hover:scale-105">
                  <img src={ASSETS.logo} alt="Life Changers Ind Logo" className="w-16 h-16 object-contain" />
                </div>
              </div>

              {/* Branding Text, Underline Accent, Subtitle & Quote */}
              <div className="space-y-1 w-full text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Life Changers <span className="text-blue-600 dark:text-blue-400">Ind</span>
                </h2>
                
                {/* Blue Underline Accent Bar */}
                <div className="w-10 h-1 bg-gradient-to-r from-blue-600 to-sky-400 rounded-full mx-auto my-1.5 shadow-xs" />

                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  LIFE CHANGERS MANAGEMENT
                </p>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic font-semibold max-w-xs mx-auto mt-1 flex items-center justify-center gap-1">
                  <span className="text-blue-600 dark:text-blue-400 text-lg font-serif font-bold">“</span>
                  <span>We enlighten your future by developing your skills</span>
                  <span className="text-blue-600 dark:text-blue-400 text-lg font-serif font-bold">”</span>
                </p>
              </div>

              {/* Action Section: Primary Fingerprint Button, Divider, Secondary Button */}
              <div className="w-full space-y-2.5 my-1">
                {/* Primary Button: TAP TO SIGN IN with Left Fingerprint Circle Icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardPage('login');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 flex items-center justify-between group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-md shrink-0">
                    <Fingerprint className="w-4 h-4 text-blue-600 animate-pulse" />
                  </div>

                  <span className="flex-1 text-center font-black">TAP TO SIGN IN</span>

                  <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </button>

                {/* Divider Line: —— or —— */}
                <div className="w-full flex items-center justify-center gap-3 my-0.5">
                  <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                </div>

                {/* Secondary Button: OPEN LOGIN FORM */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardPage('login');
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl border-2 border-blue-400/80 dark:border-blue-500/60 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all duration-200 hover:scale-[1.01]"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>OPEN LOGIN FORM</span>
                </button>
              </div>

              {/* Footer Trust Indicators */}
              <div className="w-full pt-1 flex items-center justify-evenly text-[10px] font-bold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/60">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <span>Secure</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/60">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <span>Reliable</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/60">
                    <Clock className="w-3 h-3" />
                  </div>
                  <span>Fast & Easy</span>
                </div>
              </div>

            </div>
          </div>

          {/* ================= BACK SIDE (In-Card Page Views: Login Form OR Forgot Password Form) ================= */}
          <div className="uiverse-back" onClick={(e) => e.stopPropagation()}>
            <div className="uiverse-back-inner p-5 sm:p-6 text-center flex flex-col justify-between items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden">
              
              {cardPage === 'forgot' ? (
                /* ================= IN-CARD PAGE: FORGOT PASSWORD (TROUBLE LOGGING IN?) ================= */
                <div className="w-full text-center flex flex-col justify-between items-center h-full animate-in fade-in zoom-in-95 duration-300">
                  {resetStep === 1 ? (
                    <>
                      {/* Pure White Circular Key Container with Soft Radiant Blue Halo Aura */}
                      <div className="relative group cursor-pointer inline-flex items-center justify-center mx-auto mb-0.5">
                        <div className="absolute -inset-2.5 bg-gradient-to-tr from-blue-400 via-sky-300 to-indigo-400 rounded-full blur-lg opacity-60 group-hover:opacity-90 transition-opacity duration-500 animate-pulse" />
                        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white dark:bg-slate-900 shadow-[0_0_25px_rgba(59,130,246,0.4)] flex items-center justify-center p-3 transition-transform duration-300 group-hover:scale-105">
                          <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>

                      <div className="space-y-1 w-full text-center">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Trouble Logging <span className="text-blue-600 dark:text-blue-400">In?</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                          Enter your username and we'll send you a link to reset your password.
                        </p>
                      </div>

                      {resetError && (
                        <div className="w-full p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-center gap-2 text-left my-1">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{resetError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSendResetLink} className="w-full space-y-3.5 text-left my-1">
                        {/* Email Input with Solid Blue Square Badge */}
                        <div className="flex items-center border border-blue-200/90 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/60 transition-all">
                          <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-white" />
                          </div>
                          <input
                            type="text"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Enter your username"
                            className="w-full px-3 py-2.5 bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                            required
                          />
                        </div>

                        {/* Primary Action Button: SEND RESET LINK */}
                        <button
                          type="submit"
                          disabled={resetLoading}
                          className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 flex items-center justify-between group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 relative overflow-hidden mt-2"
                        >
                          <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Send className="w-3.5 h-3.5 text-white" />
                          </div>

                          <span className="flex-1 text-center font-black">{resetLoading ? 'SENDING RESET LINK...' : 'SEND RESET LINK'}</span>

                          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                            <Send className="w-3.5 h-3.5 text-white" />
                          </div>
                        </button>

                        {/* Divider Line: —— OR —— */}
                        <div className="w-full flex items-center justify-center gap-3 my-1">
                          <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            OR
                          </span>
                          <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                        </div>

                        {/* Secondary Link: ← Back to Sign In */}
                        <button
                          type="button"
                          onClick={() => setCardPage('login')}
                          className="w-full py-1 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                          <span>Back to Sign In</span>
                        </button>
                      </form>
                    </>
                  ) : resetStep === 2 ? (
                    <>
                      {/* Step 2: Reset Link Sent Confirmation & Security Verification */}
                      <div className="relative group cursor-pointer inline-flex items-center justify-center mx-auto mb-1">
                        <div className="absolute -inset-2 bg-emerald-400 rounded-full blur-md opacity-50 animate-pulse" />
                        <div className="relative w-16 h-16 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center p-3">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                      </div>

                      <div className="space-y-1 w-full text-center">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Reset Link Sent! 📧
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          A secure password reset link has been sent to <strong className="text-blue-600">{resetEmail}</strong>.
                        </p>
                      </div>

                      {/* Security Verification Notice Badge */}
                      <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 text-left space-y-1 my-1">
                        <div className="flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
                          <span>Enterprise Security Verification</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          Please check your email inbox and click the secure verification link to verify your identity and set a new password.
                        </p>
                      </div>

                      {/* Action Buttons - Always Visible and Clickable */}
                      <div className="w-full space-y-2 my-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (resetLink) {
                              window.location.href = resetLink;
                            } else if (resetToken) {
                              navigate(`/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(resetEmail)}`);
                            } else {
                              setResetStep(3);
                            }
                          }}
                          className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-white shrink-0" />
                          <span>PROCEED TO SET NEW PASSWORD 🔑</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCardPage('login')}
                          className="w-full py-2.5 px-4 rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Back to Sign In
                        </button>
                      </div>

                      {resetPreviewUrl && (
                        <a
                          href={resetPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                        >
                          Open test email preview ↗
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Step 3: Set New Password Form */}
                      <div className="relative group cursor-pointer inline-flex items-center justify-center mx-auto mb-0.5">
                        <div className="absolute -inset-2.5 bg-gradient-to-tr from-blue-400 via-sky-300 to-indigo-400 rounded-full blur-lg opacity-60 group-hover:opacity-90 transition-opacity duration-500 animate-pulse" />
                        <div className="relative w-14 h-14 rounded-full bg-white dark:bg-slate-900 shadow-[0_0_25px_rgba(59,130,246,0.4)] flex items-center justify-center p-3">
                          <KeyRound className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>

                      <div className="space-y-0.5 w-full text-center">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Set New Password
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Enter a new password for <strong className="text-blue-600">{resetEmail}</strong>
                        </p>
                      </div>

                      {resetError && (
                        <div className="w-full p-2 rounded-xl bg-danger/10 text-danger text-xs font-semibold my-0.5">
                          {resetError}
                        </div>
                      )}

                      {resetSuccessMessage && (
                        <div className="w-full p-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold my-0.5">
                          {resetSuccessMessage}
                        </div>
                      )}

                      <form onSubmit={handleUpdatePassword} className="w-full space-y-2.5 text-left my-0.5">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            New Password *
                          </label>
                          <div className="flex items-center border border-blue-200/90 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/60 transition-all">
                            <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Lock className="w-4 h-4 text-white" />
                            </div>
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="w-full px-3 py-2 bg-transparent text-xs font-semibold text-slate-900 dark:text-white outline-none"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="px-3 text-slate-400 hover:text-slate-600 p-1"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            Confirm New Password *
                          </label>
                          <div className="flex items-center border border-blue-200/90 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/60 transition-all">
                            <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Lock className="w-4 h-4 text-white" />
                            </div>
                            <input
                              type={showConfirmNewPassword ? 'text' : 'password'}
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full px-3 py-2 bg-transparent text-xs font-semibold text-slate-900 dark:text-white outline-none"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                              className="px-3 text-slate-400 hover:text-slate-600 p-1"
                            >
                              {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={resetLoading}
                          className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/35 transition-all mt-1"
                        >
                          {resetLoading ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD NOW 🔑'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setCardPage('login')}
                          className="w-full py-1 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                          <span>Back to Sign In</span>
                        </button>
                      </form>
                    </>
                  )}
                </div>
              ) : (
                /* ================= IN-CARD PAGE: LOGIN FORM ================= */
                <div className="w-full text-center flex flex-col justify-between items-center h-full animate-in fade-in zoom-in-95 duration-300">
                  {/* Header Branding Logo & Title */}
                  <div className="w-full text-center space-y-1">
                    <div className="relative group cursor-pointer inline-flex items-center justify-center mx-auto mb-0.5">
                      <div className="absolute -inset-2.5 bg-gradient-to-tr from-blue-400 via-sky-300 to-indigo-400 rounded-full blur-lg opacity-60 group-hover:opacity-90 transition-opacity duration-500 animate-pulse" />
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white dark:bg-slate-900 shadow-[0_0_25px_rgba(59,130,246,0.4)] flex items-center justify-center p-2.5 transition-transform duration-300 group-hover:scale-105">
                        <img src={ASSETS.logo} alt="Life Changers Ind" className="w-12 h-12 object-contain" />
                      </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Life Changers <span className="text-blue-600 dark:text-blue-400">Ind</span>
                    </h2>
                    
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      LIFE CHANGERS MANAGEMENT
                    </p>

                    {/* 3 Blue Dots Decorative Accent Line */}
                    <div className="flex items-center justify-center gap-1 my-1 opacity-70">
                      <div className="w-6 h-px bg-gradient-to-r from-transparent to-blue-400" />
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      <div className="w-6 h-px bg-gradient-to-l from-transparent to-blue-400" />
                    </div>
                  </div>

                  {error && (
                    <div className="w-full p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold text-center my-1">
                      {error}
                    </div>
                  )}

                  {/* Real Production Login Form */}
                  <form onSubmit={handleSubmit} autoComplete="off" className="w-full space-y-3 text-left">
                    {/* Input 1: Username */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        USERNAME *
                      </label>
                      <div className="flex items-center border border-blue-200/90 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/60 transition-all">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter username"
                          className="w-full px-3 py-2 bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Input 2: Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Password *
                        </label>
                        {/* Forgot Password removed - Contact HR/Admin for password reset */}
                      </div>
                      <div className="flex items-center border border-blue-200/90 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/60 transition-all">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                          title={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me Option */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <button
                          type="button"
                          onClick={() => setRememberMe(!rememberMe)}
                          className="text-blue-600 focus:outline-none"
                        >
                          {rememberMe ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-500/20" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                          )}
                        </button>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          Remember Username
                        </span>
                      </label>
                    </div>

                    {/* Primary Button: SIGN IN TO DASHBOARD with Left Shield Circle */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 flex items-center justify-between group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 relative overflow-hidden mt-1"
                    >
                      <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center shadow-xs shrink-0">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>

                      <span className="flex-1 text-center font-black">{loading ? 'Authenticating...' : 'SIGN IN TO DASHBOARD'}</span>

                      <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </button>

                    {/* Secondary Button: BACK TO PORTAL INFO */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCardPage('front');
                      }}
                      className="w-full py-2.5 px-4 rounded-full border-2 border-blue-400/90 dark:border-blue-500/70 bg-white dark:bg-slate-900 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all duration-200 hover:scale-[1.01]"
                    >
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>BACK TO PORTAL INFO</span>
                    </button>
                  </form>

                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
