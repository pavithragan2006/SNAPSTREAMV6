
import React, { useState } from 'react';
import { MediaItem, UserProfile } from '../types';

interface AdminDashboardProps {
  allMedia: MediaItem[];
  onDeleteMedia: (id: string) => void;
}

type AdminTab = 'all-uploads' | 'manage-users';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ allMedia, onDeleteMedia }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('all-uploads');
  
  const [users, setUsers] = useState<UserProfile[]>([
    { id: 'USR-1001', name: 'Alice Reporter', email: 'alice@snapstream.io', role: 'user', mfaEnabled: true, lastLogin: 'Just now' },
    { id: 'USR-1002', name: 'Bob Producer', email: 'bob@snapstream.io', role: 'user', mfaEnabled: true, lastLogin: '1h ago' },
    { id: 'USR-1003', name: 'System Admin', email: 'admin@snapstream.io', role: 'admin', mfaEnabled: true, lastLogin: 'Active' },
  ]);

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* System Pulse Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">Admin_<span className="text-rose-600">Core</span></h2>
          <p className="text-[10px] text-rose-900 font-black uppercase tracking-[0.5em] mt-2">Global System Oversight Terminal</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-rose-950/10 border border-rose-900/30 px-6 py-3 rounded-2xl text-center min-w-[120px]">
              <p className="text-[9px] font-black text-rose-900 uppercase">Global Files</p>
              <p className="text-2xl font-black text-white">{allMedia.length}</p>
           </div>
           <div className="bg-rose-950/10 border border-rose-900/30 px-6 py-3 rounded-2xl text-center min-w-[120px]">
              <p className="text-[9px] font-black text-rose-900 uppercase">Active Users</p>
              <p className="text-2xl font-black text-white">{users.length}</p>
           </div>
        </div>
      </div>

      <div className="flex bg-[#0d0101] p-1.5 rounded-[1.5rem] border border-rose-900/20 shadow-xl">
        <button 
          onClick={() => setActiveTab('all-uploads')}
          className={`flex-1 px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'all-uploads' ? 'bg-rose-600 text-white' : 'text-rose-900 hover:text-rose-400'}`}
        >
          View All Uploads
        </button>
        <button 
          onClick={() => setActiveTab('manage-users')}
          className={`flex-1 px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'manage-users' ? 'bg-rose-600 text-white' : 'text-rose-900 hover:text-rose-400'}`}
        >
          Manage Users
        </button>
      </div>

      {activeTab === 'all-uploads' ? (
        <div className="bg-[#0d0101] border border-rose-900/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-rose-950/20 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] border-b border-rose-900/20">
              <tr>
                <th className="px-10 py-6">News Asset</th>
                <th className="px-6 py-6">Type</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-6 py-6 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-900/10">
              {allMedia.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center text-rose-950 font-black uppercase text-xs tracking-[1em]">Archive Buffer Empty</td>
                </tr>
              ) : (
                allMedia.map(item => (
                  <tr key={item.id} className="hover:bg-rose-600/5 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-black border border-rose-900/40 flex items-center justify-center text-2xl overflow-hidden shadow-inner">
                          {item.type === 'image' ? <img src={item.url} className="w-full h-full object-cover" alt="" /> : (item.type === 'video' ? '🎬' : '🎵')}
                        </div>
                        <div>
                           <p className="text-sm font-black text-white italic">{item.name}</p>
                           <p className="text-[9px] text-rose-900 font-mono mt-0.5">SHA256_{item.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                       <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/20">{item.type}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]'}`}></div>
                         <span className={`text-[10px] font-black uppercase ${item.status === 'completed' ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {item.status}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <button 
                        onClick={() => onDeleteMedia(item.id)}
                        className="text-[10px] font-black text-rose-500 uppercase hover:text-white bg-rose-500/10 hover:bg-rose-600 px-6 py-2.5 rounded-xl border border-rose-500/30 transition-all active:scale-95"
                      >
                        Purge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[#0d0101] border border-rose-900/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-rose-950/20 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] border-b border-rose-900/20">
              <tr>
                <th className="px-10 py-6">Node Operator</th>
                <th className="px-6 py-6">Clearance</th>
                <th className="px-6 py-6">Last Sync</th>
                <th className="px-6 py-6 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-900/10">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-rose-600/5 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-900/40 to-black border border-rose-600/30 flex items-center justify-center text-xs font-black text-rose-500 uppercase">
                          {user.name.charAt(0)}
                       </div>
                       <div>
                        <p className="text-sm font-black text-white italic">{user.name}</p>
                        <p className="text-[10px] text-rose-900 font-mono">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`text-[10px] font-black uppercase px-4 py-1 rounded-xl border ${user.role === 'admin' ? 'border-fuchsia-500/50 text-fuchsia-500 bg-fuchsia-500/10' : 'border-rose-500/50 text-rose-500 bg-rose-500/10'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-[10px] text-rose-100/40 uppercase font-black">{user.lastLogin}</td>
                  <td className="px-6 py-6 text-right">
                    <button 
                      onClick={() => removeUser(user.id)}
                      className="text-[10px] font-black text-rose-500 uppercase hover:text-white bg-rose-500/10 hover:bg-rose-500 px-6 py-2.5 rounded-xl border border-rose-500/30 transition-all active:scale-95"
                    >
                      Suspend Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
