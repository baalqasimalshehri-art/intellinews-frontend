
import React from 'react';
import { Activity, Shield, Globe } from 'lucide-react';

const Features = () => (
  <section id="features" className="py-24 px-6">
    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
       <div className="space-y-8">
          <h2 className="text-4xl font-black text-slate-900 leading-tight">Professional-Grade <br /> Intelligence Features</h2>
          <div className="space-y-8">
            {[
              { icon: Shield, title: "Academic Integrity", desc: "Verified grounding in peer-reviewed research and industry standard patents." },
              { icon: Activity, title: "Velocity Tracking", desc: "We prioritize signals that are gaining social and academic momentum." },
              { icon: Globe, title: "Global Coverage", desc: "Monitoring 20+ languages and 100+ high-authority knowledge bases." }
            ].map((feat, i) => (
              <div key={i} className="flex gap-5">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <feat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">{feat.title}</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
       </div>
       <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-2 rounded-[40px] border border-white shadow-2xl">
         <div className="bg-white rounded-[32px] p-10 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(152,16,250)] text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-purple-100">AI</div>
                  <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Newsletter Analysis</span>
               </div>
               <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-3 py-1 rounded-full">Live Preview</span>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-slate-50 rounded-full"></div>
              <div className="h-4 w-full bg-slate-50 rounded-full"></div>
              <div className="h-4 w-5/6 bg-slate-50 rounded-full"></div>
            </div>
            <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 shadow-inner">
              <p className="text-sm font-bold text-[rgb(152,16,250)] italic leading-relaxed">"Gato multi-modal agent demonstrates 98% domain master across 600 task types..."</p>
            </div>
         </div>
       </div>
    </div>
  </section>
);

export default Features;
