
import React from 'react';

interface AboutViewProps {
  onBack: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
  const capabilities = [
    {
      title: 'Visual Intelligence',
      desc: 'Powered by Amazon Rekognition, our cluster identifies thousands of unique objects, faces, and brand logos in real-time.',
      icon: '👁️'
    },
    {
      title: 'Audience Sentiment',
      desc: 'Amazon Comprehend analyzes tonal shifts and emotional markers to provide deep marketing insights.',
      icon: '📊'
    },
    {
      title: 'Neural Transcription',
      desc: 'State-of-the-art speech-to-text conversion via Amazon Transcribe with 98% accuracy for news archives.',
      icon: '🎙️'
    },
    {
      title: 'Secure Persistence',
      desc: 'High-performance Flask backend coupled with SQLite ensuring your media metadata remains indexed and durable.',
      icon: '🛡️'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-6">
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic">
          CRIMSON_<span className="text-rose-600">INTEL</span>
        </h2>
        <p className="text-rose-100/40 text-[12px] font-black uppercase tracking-[0.5em]">System Architecture v5.2</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {capabilities.map((cap, i) => (
          <div key={i} className="ui-surface p-10 rounded-[3rem] border border-white/5 hover:border-rose-500/20 transition-all group">
            <div className="text-4xl mb-6 bg-black w-16 h-16 rounded-2xl flex items-center justify-center border border-rose-900/30 group-hover:scale-110 transition-transform">
              {cap.icon}
            </div>
            <h3 className="text-2xl font-black text-white italic mb-4 uppercase tracking-tighter">{cap.title}</h3>
            <p className="text-slate-400 leading-relaxed font-medium">{cap.desc}</p>
          </div>
        ))}
      </div>

      <div className="ui-surface p-12 rounded-[4rem] border border-rose-600/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/5 blur-[80px] rounded-full"></div>
        <div className="relative z-10 space-y-8">
          <h3 className="text-3xl font-black text-white italic tracking-tighter">THE SNAPSTREAM ADVANTAGE</h3>
          <div className="space-y-6 text-slate-300 text-lg leading-relaxed">
            <p>SnapStream represents the pinnacle of crimson media intelligence, bridging the gap between raw data and actionable narratives. By leveraging AWS’s distributed inference clusters, we provide newsrooms and marketing agencies with instantaneous content indexing.</p>
            <p>Our platform doesn't just store video; it understands it. From detecting political candidates in a crowd to identifying brand mentions in a podcast, Crimson Intel is your invisible research assistant.</p>
          </div>
          <button 
            onClick={onBack}
            className="px-10 py-4 accent-gradient text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-600/20"
          >
            Return to Terminal
          </button>
        </div>
      </div>

      <div className="pt-10 border-t border-white/5 flex justify-center">
         <p className="text-[10px] text-slate-700 font-black uppercase tracking-[1em]">Secure Environment • End-to-End Encryption</p>
      </div>
    </div>
  );
};
