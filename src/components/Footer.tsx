
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="py-24 bg-slate-950 text-white px-6 border-t border-slate-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgb(152,16,250)] text-white flex items-center justify-center font-black shadow-lg shadow-purple-900/20">iN</div>
          <span className="font-black text-white text-xl tracking-tight">IntelliNews AI</span>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm font-bold text-slate-400">
          <a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')} className="hover:text-white transition-colors">How it works</a>
          <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-white transition-colors">Features</a>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
        </nav>
        
        <div className="flex flex-col items-center md:items-end gap-1">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">© {new Date().getFullYear()} IntelliNews AI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
