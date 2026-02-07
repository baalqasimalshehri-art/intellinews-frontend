import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      await api.forgotPassword(email);
      setEmailSent(true);
      toast.success('Password reset link sent! Check your email.');
    } catch (error: any) {
      console.error('Failed to send reset email:', error);
      // Still show success to prevent email enumeration
      setEmailSent(true);
      toast.success('If an account exists, a reset link has been sent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center bg-white px-6 font-sans">
      <div className="w-full max-w-[440px] space-y-10">

        {!emailSent ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-3 text-center lg:text-left">
              <h1 className="text-[40px] font-bold text-slate-900 tracking-tight leading-tight">Forgot Password?</h1>
              <p className="text-slate-500 text-base font-normal leading-relaxed">Enter your email and we'll send you a password reset link.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSendResetEmail}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-[rgb(152,16,250)] text-white font-bold rounded-xl transition-all text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-200 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-10 animate-in zoom-in-95 duration-500 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-50 text-[rgb(152,16,250)] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h1 className="text-[40px] font-bold text-slate-900 tracking-tight">Check Your Email</h1>
              <p className="text-slate-500 text-base font-normal leading-relaxed">
                We've sent a password reset link to <span className="font-bold text-slate-900">{email}</span>
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-6">
                <p className="text-sm text-amber-900 font-medium">
                  ⏰ The reset link expires in 1 hour
                </p>
              </div>
              <p className="text-slate-400 text-sm pt-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="w-full h-14 bg-slate-100 text-slate-900 font-bold rounded-xl transition-all text-base hover:bg-slate-200 active:scale-[0.98]"
            >
              Try Different Email
            </button>
          </div>
        )}

        <p className="text-center text-base font-normal text-slate-500 pt-4">
          Remembered your password? <Link to="/login" className="text-slate-900 font-bold hover:underline ml-1">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;