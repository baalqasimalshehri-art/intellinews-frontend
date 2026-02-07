
import React from 'react';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import Footer from '../components/Footer';
import { BookOpen, Zap, Clock, ChevronDown } from 'lucide-react';

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 bg-slate-50 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl font-bold text-slate-900">Intelligence Pipeline</h2>
        <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs">Three steps to a smarter daily routine.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: BookOpen, title: "Choose Interests", desc: "Select from technical domains or provide custom keywords for deep niche tracking." },
          { icon: Zap, title: "AI Distillation", desc: "Our engine summarizes dense papers and reports into scannable, high-impact cards." },
          { icon: Clock, title: "Flexible Schedule", desc: "Choose your frequency—daily or weekly—and receive your curated dispatch exactly when you need it." }
        ].map((step, i) => (
          <div key={i} className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm relative group hover:border-[rgb(152,16,250)] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[rgb(152,16,250)] flex items-center justify-center mb-6 group-hover:bg-[rgb(152,16,250)] group-hover:text-white transition-all">
              <step.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
            <p className="text-slate-600 font-medium leading-relaxed">{step.desc}</p>
            <span className="absolute top-10 right-10 text-5xl font-black text-slate-50 opacity-10 group-hover:opacity-20">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQ = () => {
  const faqItems = [
    { q: "How does the AI personalization work?", a: "We use sophisticated AI models to analyze your chosen topics and keywords, cross-referencing them against high-authority feeds and real-time research to surface only the most relevant breakthroughs." },
    { q: "Can I cancel my subscription anytime?", a: "Yes, you can pause or delete your profile instantly from the Preferences dashboard with zero friction." },
    { q: "What sources do you monitor?", a: "Our pipeline tracks arXiv research papers, PubMed academic findings, and major industry news outlets like TechCrunch and Nature." }
  ];

  return (
    <section id="faq" className="py-24 bg-slate-50 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <details key={i} className="group bg-white border border-slate-200 rounded-2xl transition-all shadow-sm overflow-hidden">
              <summary className="flex items-center justify-between p-7 cursor-pointer font-black text-slate-900 list-none group-hover:bg-slate-50 transition-colors">
                {item.q}
                <span className="text-slate-300 transition-transform group-open:rotate-180">
                  <ChevronDown className="w-5 h-5" />
                </span>
              </summary>
              <div className="px-7 pb-7 text-slate-600 font-medium leading-relaxed bg-white">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <div className="relative">
      <Hero />
      <HowItWorks />
      <Features />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Home;
