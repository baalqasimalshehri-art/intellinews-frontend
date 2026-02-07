import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      toast.error('Invalid reset link');
      setTokenValid(false);
    } else {
      setToken(resetToken);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword.length > 72) {
      toast.error('Password is too long. Please use a password with 72 characters or less.');
      return;
    }

    setIsLoading(true);

    try {
      await api.resetPassword(token, newPassword);
      setResetSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error('Failed to reset password:', error);

      // Handle technical error messages and convert to user-friendly ones
      let errorMessage = 'Failed to reset password. The link may have expired.';

      if (error.message && error.message.includes('72 bytes')) {
        errorMessage = 'Password is too long. Please use a password with 72 characters or less.';
      } else if (error.message && error.message.includes('expired')) {
        errorMessage = 'Reset link has expired. Please request a new one.';
      } else if (error.message && error.message.includes('invalid')) {
        errorMessage = 'Invalid reset link. Please request a new one.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center bg-white px-6 font-sans">
        <div className="w-full max-w-[440px] space-y-10 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-[40px] font-bold text-slate-900 tracking-tight">Invalid Link</h1>
            <p className="text-slate-500 text-base font-normal leading-relaxed">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <Link
            to="/forgot-password"
            className="inline-block w-full h-14 bg-[rgb(152,16,250)] text-white font-bold rounded-xl transition-all text-lg leading-[56px] shadow-lg hover:shadow-purple-200 active:scale-[0.98]"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center bg-white px-6 font-sans">
        <div className="w-full max-w-[440px] space-y-10 animate-in zoom-in-95 duration-500 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-[40px] font-bold text-slate-900 tracking-tight">Password Reset!</h1>
            <p className="text-slate-500 text-base font-normal leading-relaxed">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full h-14 bg-[rgb(152,16,250)] text-white font-bold rounded-xl transition-all text-lg shadow-lg hover:shadow-purple-200 active:scale-[0.98]"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center bg-white px-6 font-sans">
      <div className="w-full max-w-[440px] space-y-10">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-3 text-center lg:text-left">
            <h1 className="text-[40px] font-bold text-slate-900 tracking-tight leading-tight">Set New Password</h1>
            <p className="text-slate-500 text-base font-normal leading-relaxed">
              Your new password must be secure and unique.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[rgb(152,16,250)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[rgb(152,16,250)] text-white font-bold rounded-xl transition-all text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-200 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Reset Password
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-base font-normal text-slate-500 pt-4">
          Remembered your password? <Link to="/login" className="text-slate-900 font-bold hover:underline ml-1">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
