
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onClose, onUpdate }) => {
  const isAdmin = user.role === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });

  const securityLogs = [
    { event: 'Login Success', time: 'Today, 10:24', status: 'OK', color: 'text-emerald-500' },
    { event: 'Profile Updated', time: 'Yesterday, 14:20', status: 'OK', color: 'text-emerald-500' },
    { event: 'Session Refresh', time: 'Yesterday, 23:15', status: 'OK', color: 'text-fuchsia-500' },
  ];

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) return;
    onUpdate(formData);
    setIsEditing(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">
            Profile_<span className={isAdmin ? 'text-fuchsia-500' : 'text-rose-500'}>{user.role.toUpperCase()}</span>
          </h2>
          <p className="text-[10px] text-rose-950 font-black uppercase tracking-[0.5em] mt-1">Personnel Record Management</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${isEditing ? 'bg-black text-rose-500 border-rose-500/30' : 'bg-rose-600 text-white border-rose-600/50'}`}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Information'}
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white/5 border border-white/10 text-[10px] font-black text-white rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest"
          >
            Close
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Core Identity */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#0d0101] border border-rose-900/30 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 blur-[40px] rounded-full group-hover:bg-rose-600/10 transition-all"></div>
            
            <div className="flex flex-col items-center text-center mb-10">
              <div className={`w-32 h-32 rounded-full border-4 ${isAdmin ? 'border-fuchsia-600 shadow-[0_0_20px_rgba(162,28,175,0.3)]' : 'border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)]'} p-1 mb-6 relative group/avatar`}>
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                  <span className={`text-5xl font-black ${isAdmin ? 'text-fuchsia-600' : 'text-rose-600'}`}>
                    {user.name.charAt(0)}
                  </span>
                </div>
              </div>
              
              {!isEditing ? (
                <div className="animate-in fade-in duration-300">
                  <h3 className="text-3xl font-black text-white italic">{user.name}</h3>
                  <p className="text-rose-100/30 font-mono text-[11px] mt-2 uppercase tracking-widest">{user.email}</p>
                </div>
              ) : (
                <div className="w-full space-y-4 animate-in fade-in zoom-in-95">
                  <div className="space-y-2">
                    <label className="block text-[8px] font-black text-rose-900 uppercase tracking-widest text-left px-2">Operator Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-black border border-rose-600/40 rounded-xl p-4 text-sm text-white focus:border-rose-500 outline-none transition-all shadow-inner"
                      placeholder="Display Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[8px] font-black text-rose-900 uppercase tracking-widest text-left px-2">Primary Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-black border border-rose-600/40 rounded-xl p-4 text-sm text-white focus:border-rose-500 outline-none transition-all shadow-inner"
                      placeholder="contact@snapstream.io"
                    />
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={handleSave}
                      className="w-full py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-500 shadow-xl shadow-rose-600/20 transition-all active:scale-95"
                    >
                      Commit Profile Changes
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-8 border-t border-rose-900/10">
              <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-rose-950 uppercase tracking-widest">Internal Hash ID</span>
                <span className="text-[9px] font-mono text-rose-100">{user.id}</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-rose-950 uppercase tracking-widest">Database Sync</span>
                <span className="text-[9px] font-mono text-rose-100">{user.lastLogin}</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-950/5 border border-rose-900/10 rounded-[2.5rem] p-8">
             <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.4em] mb-6 px-2">Security Audit Trace</h3>
             <div className="space-y-3">
               {securityLogs.map((log, i) => (
                 <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-rose-900/20 group hover:border-rose-500/30 transition-all">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-white uppercase tracking-tight group-hover:text-rose-500 transition-colors">{log.event}</p>
                      <p className="text-[9px] text-rose-900 uppercase font-bold">{log.time}</p>
                    </div>
                    <span className={`text-[9px] font-black ${log.color} bg-black/60 px-2 py-1 rounded-lg`}>{log.status}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* User Info visualization */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-[#0f0101] border border-rose-900/30 rounded-[2.5rem] p-10 h-full flex flex-col">
            <h3 className={`text-xs font-black uppercase tracking-[0.4em] mb-8 ${isAdmin ? 'text-fuchsia-500' : 'text-rose-500'}`}>
              Identity Schema Metadata
            </h3>
            <div className="flex-grow bg-black/80 rounded-3xl p-8 border border-rose-950 font-mono text-[11px] leading-loose text-rose-200/50 relative overflow-hidden shadow-2xl">
               <div className="absolute top-4 right-4 text-[8px] text-rose-950 uppercase font-black">ENCRYPTED_BUF_X012</div>
               <pre className="whitespace-pre-wrap">
{`{
  "entity_id": "${user.id}",
  "operator_class": "${user.role.toUpperCase()}",
  "operational_status": "VERIFIED_ACTIVE",
  "data_clearance": {
    "media_ingest": true,
    "rekognition_access": true,
    "system_purge": ${isAdmin ? "true" : "false"}
  },
  "mfa_provisioning": {
    "enabled": ${user.mfaEnabled},
    "protocol": "TOTP_HARDENED"
  },
  "provisioning_date": "2024-Q3-SYSTEM-GEN"
}`}
               </pre>
            </div>
            <div className="mt-8 flex items-center justify-between p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
               <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest">Session Heartbeat: 124ms</span>
               </div>
               <span className="text-[9px] text-rose-900 font-black uppercase tracking-widest">TLS_1.3 AES_256_GCM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
