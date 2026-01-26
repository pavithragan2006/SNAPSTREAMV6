
import React, { useCallback, useState } from 'react';
import { MediaType, AnalysisProfile } from '../types';

interface MediaUploadProps {
  onUpload: (file: File, type: MediaType, profile: AnalysisProfile) => void;
  isProcessing: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onUpload, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [profile, setProfile] = useState<AnalysisProfile>('news-archive');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      let type: MediaType = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      onUpload(file, type, profile);
    }
  }, [onUpload, profile]);

  return (
    <div className="space-y-6">
      <div className="flex bg-black/40 p-1.5 rounded-3xl border border-rose-900/20 w-fit mx-auto mb-4">
        <button 
          onClick={() => !isProcessing && setProfile('news-archive')}
          disabled={isProcessing}
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${profile === 'news-archive' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-rose-900 hover:text-rose-400'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          News Desk Flow
        </button>
        <button 
          onClick={() => !isProcessing && setProfile('marketing-insights')}
          disabled={isProcessing}
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${profile === 'marketing-insights' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-rose-900 hover:text-rose-400'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Marketing Insights
        </button>
      </div>

      <div 
        onDragOver={handleDrag}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative h-72 border-2 border-dashed rounded-[3rem] transition-all duration-500 flex flex-col items-center justify-center group
          ${isDragging ? 'border-rose-500 bg-rose-500/5 scale-[1.01]' : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'}
          ${isProcessing ? 'border-rose-600/50 bg-rose-950/10 cursor-wait' : 'cursor-pointer'}
        `}
      >
        {!isProcessing && (
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                let type: MediaType = 'image';
                if (file.type.startsWith('video/')) type = 'video';
                else if (file.type.startsWith('audio/')) type = 'audio';
                onUpload(file, type, profile);
              }
            }}
          />
        )}
        
        <div className="text-center space-y-6">
          <div className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center transition-all duration-500 shadow-2xl relative
            ${isDragging ? 'bg-rose-600 scale-110' : 'bg-slate-950 border border-white/5 group-hover:bg-slate-900'}
            ${isProcessing ? 'bg-rose-950 border-rose-500/50' : ''}
          `}>
            {isProcessing ? (
              <>
                <div className="absolute inset-0 border-4 border-rose-500/20 border-t-rose-500 rounded-3xl animate-spin"></div>
                <div className="w-4 h-4 bg-rose-500 rounded-full animate-pulse"></div>
              </>
            ) : (
              <svg className={`w-12 h-12 transition-colors duration-300 ${isDragging ? 'text-white' : 'text-rose-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-white tracking-tight">
              {isProcessing ? 'Cluster Synchronizing...' : 'Ingest News / Marketing Media'}
            </p>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isProcessing ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`}>
              {isProcessing ? 'Inference Engine Latency: ACTIVE' : `Mode: ${profile === 'news-archive' ? 'AWS REKOGNITION (VISUAL FOCUS)' : 'AWS TRANSCRIBE (AUDIO INSIGHTS)'}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
