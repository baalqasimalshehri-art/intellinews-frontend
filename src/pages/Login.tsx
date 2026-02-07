
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../services/authService';

const Login = () => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.signin({ email, password });

      const userName = response.user.email.split('@')[0];
      const userRole = response.user.role;

      toast.success(`Welcome back, ${userName}!`);

      // Redirect based on role
      if (userRole === 'admin') {
        setTimeout(() => navigate('/admin'), 1000);
      } else {
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center bg-white px-6 font-sans">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="space-y-3 text-center lg:text-left">
          <h1 className="text-[40px] font-bold text-slate-900 tracking-tight leading-tight">Sign in to IntelliNews</h1>
          <p className="text-slate-500 text-base font-normal">One solution for all your intelligence needs</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bessiemcooper@mail.com"
              className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-base font-normal focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Password</label>
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

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[rgb(152,16,250)] focus:ring-[rgb(152,16,250)] cursor-pointer" />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Remember me</span>
            </label>
            <Link to="/forgot-password" size="sm" className="text-sm font-semibold text-slate-500 hover:text-[rgb(152,16,250)] transition-colors">Forgot Password?</Link>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full h-14 bg-[rgb(152,16,250)] text-white font-bold rounded-xl transition-all text-lg flex items-center justify-center shadow-lg hover:shadow-purple-200 active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-base font-normal text-slate-500 pt-4">
          Don't have an account? <Link to="/signup" className="text-slate-900 font-bold hover:underline ml-1">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;