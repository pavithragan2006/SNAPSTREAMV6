import React from 'react';
import { UserRole, AppView } from '../types';

interface HeaderProps {
  role: UserRole | null;
  activeView: AppView;
  onLogout: () => void;
  onViewHome: () => void;
  onViewAbout: () => void;
  onViewDashboard: () => void;
  onViewProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  role, activeView, onLogout, onViewHome, onViewAbout, onViewDashboard, onViewProfile 
}) => {
  return (
    <header className="sticky top-0 z-50 ui-surface border-b border-white/5 h-24 flex items-center">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-5 group cursor-pointer" onClick={onViewHome}>
          <div className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
             <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white leading-none italic">SnapStream</span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Intelligence Layer</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-12">
          {[
            { label: 'Home', view: 'home', action: onViewHome },
            { label: 'Platform', view: 'about', action: onViewAbout },
            { label: role ? 'Dashboard' : 'Sign In', view: 'dashboard', action: onViewDashboard },
          ].map((link) => (
            <button 
              key={link.view}
              onClick={link.action}
              className={`relative text-[11px] font-black uppercase tracking-widest transition-all ${activeView === link.view ? 'accent-text' : 'text-slate-500 hover:text-white'}`}
            >
              {link.label}
              {activeView === link.view && (
                <span className="absolute -bottom-4 left-0 w-full h-0.5 bg-rose-500 rounded-full shadow-[0_0_10px_#e11d48]"></span>
              )}
            </button>
          ))}
          {role && (
            <div className="flex items-center gap-8 pl-8 border-l border-white/10">
               <button 
                onClick={onViewProfile} 
                className={`text-[11px] font-black uppercase tracking-widest ${activeView === 'profile' ? 'accent-text' : 'text-slate-500 hover:text-white'}`}
               >
                 Profile
               </button>
               <button onClick={onLogout} className="text-slate-500 hover:text-red-500 transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};