
import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  lightColor: string;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon: Icon, title, desc, color, lightColor, onClick }) => (
  <div 
    className={`${lightColor} border border-slate-50 p-6 rounded-2xl shadow-sm space-y-8 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden active:scale-[0.98]`} 
    onClick={onClick}
  >
    <div className="flex justify-between items-start relative z-10">
      <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="space-y-2 relative z-10">
      <h4 className="text-xl font-bold text-slate-900 leading-tight">{title}</h4>
      <p className="text-[13px] font-medium text-slate-600 leading-relaxed pr-4">{desc}</p>
    </div>
    <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 pt-2 relative z-10 group-hover:gap-3 transition-all">
      Open tool <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </div>
  </div>
);

export default ToolCard;
