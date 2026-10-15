
import React, { useState, useEffect } from 'react';
import {
  User, Mail, PauseCircle, CheckCircle,
  Shield, Lock, Eye, EyeOff,
  ShieldCheck, RefreshCw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { authService } from '../services/authService';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState('Active');

  const [showPass, setShowPass] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const user = authService.getUser();

      if (!user) {
        toast.error('Please sign in to view your profile');
        return;
      }

      // Fetch from backend
      const profile = await api.getMyProfile();
      setEmail(profile.email);
      setUserName(profile.name || '');
      setUserStatus(profile.status || 'Active');
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      // Fallback to localStorage if backend fails
      const user = authService.getUser();
      if (user) {
        setEmail(user.email || '');
        setUserName(user.name || '');
        setUserStatus('Active');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await api.updateMyProfile({
        name: userName,
        email: email
      });

      // Update local storage
      const user = authService.getUser();
      if (user) {
        user.name = userName;
        user.email = email;
        authService.updateUser(user);
      }

      toast.success('Profile information updated successfully.');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.next !== passwords.confirm) {
      toast.error('New passwords do not match.');
      return;
    }

    if (passwords.next.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (passwords.next.length > 72) {
      toast.error('Password is too long. Please use a password with 72 characters or less.');
      return;
    }

    setIsUpdating(true);

    try {
      await api.changeMyPassword({
        current_password: passwords.current,
        new_password: passwords.next
      });

      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Password changed successfully.');
    } catch (error: any) {
      console.error('Failed to change password:', error);

      // Handle technical error messages and convert to user-friendly ones
      let errorMessage = 'Failed to change password. Please check your current password.';

      if (error.message && error.message.includes('72 bytes')) {
        errorMessage = 'Password is too long. Please use a password with 72 characters or less.';
      } else if (error.message && error.message.includes('incorrect')) {
        errorMessage = 'Current password is incorrect. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePause = () => {
    const newStatus = userStatus === 'Active' ? 'Paused' : 'Active';
    setUserStatus(newStatus);
    toast.success(`Subscription ${newStatus === 'Active' ? 'resumed' : 'paused'}.`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(152,16,250)]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col items-start justify-start space-y-8">
        <h3 className="text-sm font-semibold text-slate-900 px-1 uppercase tracking-widest leading-none">Account & Security</h3>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full sm:w-fit border border-slate-200">
          <button onClick={() => setActiveTab('profile')} className={`flex-1 sm:flex-none px-12 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><User className="w-4 h-4" /> Profile</button>
          <button onClick={() => setActiveTab('security')} className={`flex-1 sm:flex-none px-12 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'security' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Shield className="w-4 h-4" /> Security</button>
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'profile' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-400">
            <section className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex items-center gap-10">
                <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center relative shadow-inner shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Avatar" className="w-full h-full rounded-3xl" />
                  <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-[rgb(152,16,250)] hover:text-slate-900 transition-all shadow-lg active:scale-95"><RefreshCw className="w-4 h-4" /></button>
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-black leading-tight tracking-tight">{userName}</h2>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1"><Mail className="w-4 h-4 text-slate-400" /> {email}</p>
                </div>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-10 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">Full Name</label>
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your full name" className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400 shadow-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@example.com" className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400 shadow-sm" required />
                  </div>
                </div>
                <button type="submit" disabled={isUpdating} className={`w-full h-14 bg-[rgb(152,16,250)] text-white font-bold rounded-xl transition-all text-base flex items-center justify-center gap-3 shadow-xl hover:shadow-purple-200 active:scale-[0.99] ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Save Profile Changes
                </button>
              </form>
            </section>
            <section className="bg-white border border-slate-100 rounded-3xl p-10 flex items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${userStatus === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-amber-50 border-amber-100 text-amber-500'}`}>{userStatus === 'Active' ? <CheckCircle className="w-6 h-6" /> : <PauseCircle className="w-6 h-6" />}</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Intelligence Feed</h3>
                  <p className="text-base text-slate-500 font-normal mt-1">Your dispatches are currently <span className={`font-bold ${userStatus === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>{userStatus.toLowerCase()}</span>.</p>
                </div>
              </div>
              <button onClick={handlePause} className={`h-14 px-12 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm border ${userStatus === 'Active' ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}>{userStatus === 'Active' ? 'Pause Feed' : 'Resume Feed'}</button>
            </section>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-400">
            <section className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[rgb(152,16,250)] border border-purple-100"><Lock className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-bold text-black leading-tight">Password Management</h2><p className="text-base font-normal text-slate-500">Update your access credentials</p></div>
              </div>
              <form onSubmit={handleChangePassword} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">Current Password</label>
                    <input type={showPass ? "text" : "password"} value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400 shadow-sm" required />
                  </div>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 block">New Password</label>
                        <div className="relative">
                          <input type={showPass ? "text" : "password"} value={passwords.next} onChange={(e) => setPasswords({...passwords, next: e.target.value})} placeholder="••••••••" className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400 shadow-sm" required />
                          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[rgb(152,16,250)] transition-colors">{showPass ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}</button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 block">Verify New Password</label>
                        <input type={showPass ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400 shadow-sm" required />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Password must be 6-72 characters long</p>
                  </div>
                </div>
                <button type="submit" disabled={isUpdating || !passwords.next} className={`w-full h-14 bg-[rgb(152,16,250)] text-white font-bold rounded-xl transition-all text-base flex items-center justify-center gap-3 shadow-xl hover:shadow-purple-200 active:scale-[0.99] ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} Update Credentials
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
