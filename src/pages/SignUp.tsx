
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../services/authService';

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          // Redirect based on role
          if (user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signup({ email, password });

      toast.success('Account created! Welcome to IntelliNews.');
      setTimeout(() => navigate('/onboarding'), 1000);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center bg-white px-6 font-sans">
      <div className="w-full max-w-[440px] space-y-10">
        <div className="space-y-3 text-center lg:text-left">
           <h1 className="text-[40px] font-bold text-slate-900 tracking-tight leading-tight">Create Account</h1>
           <p className="text-slate-500 text-base font-normal leading-relaxed">Join 11,000+ researchers getting AI-powered insights.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bessiemcooper@mail.com" 
              className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Create Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button 
            disabled={isLoading}
            className={`w-full h-14 bg-[rgb(152,16,250)] text-white font-bold rounded-xl transition-all text-lg flex items-center justify-center shadow-lg hover:shadow-purple-200 active:scale-[0.98] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-base font-normal text-slate-500 pt-4">
          Already have an account? <Link to="/login" className="text-slate-900 font-bold hover:underline ml-1">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;