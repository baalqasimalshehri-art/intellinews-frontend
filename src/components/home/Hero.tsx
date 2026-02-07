
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { authService } from '../../services/authService';

const Hero = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          setIsLoggedIn(true);
          setUserRole(user.role);
        } catch (error) {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      }
    };
    checkAuth();
  }, []);

  const handleCTAClick = () => {
    if (isLoggedIn) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/signup');
    }
  };

  return (
    <section className="pt-20 pb-32 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
        <div className="flex justify-center pt-10">
          <div className="bg-white border border-slate-100 rounded-full px-4 py-2 flex items-center gap-3 shadow-sm">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 15}`} alt="User" />
                </div>
              ))}
            </div>
            <span className="text-[13px] font-semibold text-slate-700">Trusted by 11,000+ researchers</span>
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
          Consume Insights <br />
          <span className="text-gradient font-bold">Not Data Noise.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Personalized AI newsletters that collect and summarize the latest academic and industry breakthroughs—from research innovations to market trends—in a clear and concise format for professionals who value their time.
        </p>
        <div className="flex justify-center pt-2">
          <button
            onClick={handleCTAClick}
            className="px-10 py-5 bg-[rgb(152,16,250)] text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all group"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Start Your Feed Free'}
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 pt-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-base font-bold text-slate-900">4.9 / 5.0</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
