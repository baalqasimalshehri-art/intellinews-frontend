
import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow h-full flex flex-col justify-between">
    <p className="text-sm font-semibold text-slate-500 uppercase tracking-tight">{label}</p>
    <h4 className="text-4xl font-black text-slate-900 leading-none">{value}</h4>
  </div>
);

export default StatCard;
