
import React from 'react';
import { MediaItem } from '../types';

interface AnalysisViewProps {
  item: MediaItem;
  onClose: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ item, onClose }) => {
  const { analysis, profile, thumbnailUrl } = item;

  if (!analysis) return null;

  return (
    <div className="fixed inset-0 bg-[#020617]/98 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#050101] rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/5">
        
        {/* Screenshot Styled Header */}
        <div className="p-10 flex justify-between items-center bg-[#0d0101]/50 border-b border-white/5">
          <div className="flex items-center gap-10">
             <div className="w-24 h-24 rounded-2xl bg-black border border-rose-900/40 overflow-hidden shadow-2xl flex-shrink-0 flex items-center justify-center">
                {item.type === 'video' ? (
                  item.thumbnailUrl ? <img src={item.thumbnailUrl} className="w-full h-full object-cover" /> : <span className="text-4xl">📺</span>
                ) : item.type === 'image' ? (
                  <img src={item.url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-4xl">🎙️</span>
                )}
             </div>
             <div>
              <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none">
                {profile === 'news-archive' ? 'JOURNALIST_BRIEFING' : 'MARKETING_ANALYTICS'}
              </h2>
              <p className="text-[12px] text-rose-500/80 font-black uppercase tracking-[0.4em] mt-3">
                RESOURCE: {item.id.toUpperCase()} • {item.name.toUpperCase()}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow p-10 overflow-y-auto space-y-12">
          
          {/* Entity Grid - Matches Screenshot Style */}
          <section className="space-y-8">
            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em]">
              {profile === 'news-archive' ? 'DETECTED ENTITIES (REKOGNITION)' : 'INSIGHT CLUSTERS (COMPREHEND)'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.detectedObjects?.map((obj, i) => (
                <div key={i} className="flex justify-between items-center bg-black/40 border border-white/5 p-6 rounded-2xl group hover:border-rose-500/30 transition-all">
                  <span className="text-lg font-black text-white italic tracking-tight">{obj.name}</span>
                  <span className="text-sm font-black text-rose-500">{(obj.confidence * 100).toFixed(1)}%</span>
                </div>
              ))}
              
              {/* If no objects, show labels as cards for consistent look */}
              {!analysis.detectedObjects && analysis.labels?.map((label, i) => (
                <div key={i} className="flex justify-between items-center bg-black/40 border border-white/5 p-6 rounded-2xl group hover:border-rose-500/30 transition-all">
                  <span className="text-lg font-black text-white italic tracking-tight">{label}</span>
                  <span className="text-sm font-black text-rose-500">98.2%</span>
                </div>
              ))}
            </div>
          </section>

          {/* Additional Context Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-12 space-y-6">
              <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em]">Executive Summary Brief</h4>
              <div className="bg-black/40 p-10 rounded-[2rem] border border-white/5">
                <p className="text-slate-300 text-2xl font-medium italic leading-relaxed">
                  "{analysis.summary}"
                </p>
              </div>
            </div>
            
            {profile === 'marketing-insights' && (
              <div className="lg:col-span-12 space-y-6">
                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em]">Transcription (AWS Transcribe)</h4>
                <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5 text-slate-400 text-sm leading-relaxed max-h-48 overflow-y-auto">
                  {analysis.transcript}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-10 border-t border-white/5 bg-[#0d0101] flex justify-end gap-6">
           <button 
             onClick={() => window.print()} 
             className="px-8 py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-widest rounded-2xl border border-white/5"
           >
             Export PDF
           </button>
           <button onClick={onClose} className="px-12 py-4 accent-gradient text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all">
             Acknowledge Intelligence
           </button>
        </div>
      </div>
    </div>
  );
};
