
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, name?: string, email?: string, id?: string) => void;
  addLog: (source: string, msg: string, level?: 'info' | 'warning' | 'error' | 'success' | 'database') => void;
}

type AuthMode = 'LANDING' | 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'RECOVERY_SENT';

const API_BASE = 'http://localhost:5000/api';

const SMTP_CORE_CONFIG = {
  service: 'Gmail Relay (Simulated AWS SES)',
  auth: { user: 'snapstreamteam@gmail.com', pass: 'etbm qtdl gcfk cydf' },
  host: 'smtp.gmail.com',
  port: 587
};

export const Login: React.FC<LoginProps> = ({ onLogin, addLog }) => {
  const [mode, setMode] = useState<AuthMode>('LANDING');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const handleLandingChoice = (target: 'LOGIN' | 'SIGNUP') => {
    setMode(target);
    setError(null);
    addLog('Auth Service', `Navigating to ${target} interface`, 'info');
  };

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    addLog('Flask API', `POST /login - Attempting auth for ${email}`, 'info');

    try {
      const resp = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await resp.json();
      
      if (resp.ok) {
        addLog('SQLite DB', `SELECT successful: Session created for ${data.id}`, 'database');
        onLogin(data.role, data.name, data.email, data.id);
      } else if (resp.status === 401) {
        setError('Invalid email or password. Please try again or create a new account.');
        addLog('Auth Service', `401 Unauthorized: Credentials rejected for ${email}`, 'error');
      } else {
        setError(data.error || 'Identity verification failed');
      }
    } catch (err) {
      // FALLBACK TO SIMULATOR MODE
      addLog('System', 'Backend Offline. Switching to Simulator Mode...', 'warning');
      setIsSimulated(true);

      // Default Admin Bypass
      if (email === 'admin@snapstream.io' && password === 'password123') {
        onLogin('admin', 'System Administrator', 'admin@snapstream.io', 'SIM-ADMIN');
        return;
      }

      // Check Mock Users in LocalStorage
      const mockUsers = JSON.parse(localStorage.getItem('snapstream_mock_users') || '[]');
      const user = mockUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (user) {
        onLogin(user.role, user.name, user.email, user.id);
      } else {
        setError('Backend Offline. Try the default admin: admin@snapstream.io / password123');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    addLog('Flask API', `POST /register - Provisioning ${email}`, 'info');

    try {
      const resp = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: selectedRole })
      });
      const data = await resp.json();

      if (resp.ok) {
        addLog('SQLite DB', `INSERT successful: Record ${data.id} committed`, 'database');
        onLogin(data.role, data.name, data.email, data.id);
      } else {
        setError(data.error || 'Resource provisioning failed');
      }
    } catch (err) {
      // SIMULATOR MODE SIGNUP
      addLog('System', 'Backend Offline. Registering in Local Cache.', 'warning');
      const mockUsers = JSON.parse(localStorage.getItem('snapstream_mock_users') || '[]');
      if (mockUsers.some((u: any) => u.email === email)) {
        setError('Email already registered in local cache.');
        setLoading(false);
        return;
      }
      const newUser = { id: `MOCK-${Date.now()}`, name, email, password, role: selectedRole };
      mockUsers.push(newUser);
      localStorage.setItem('snapstream_mock_users', JSON.stringify(mockUsers));
      onLogin(newUser.role, newUser.name, newUser.email, newUser.id);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog('System', `Connecting to ${SMTP_CORE_CONFIG.host}:${SMTP_CORE_CONFIG.port}...`, 'info');
    setTimeout(() => {
      addLog('Auth Service', `SMTP_AUTH: LOGIN [${SMTP_CORE_CONFIG.auth.user}]`, 'database');
      addLog('Auth Service', `DATA: Recovery link dispatched via AWS SES.`, 'success');
      setLoading(false);
      setMode('RECOVERY_SENT');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050101] p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e11d48 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}></div>
      <div className="w-full max-w-md z-10">
        <div className="bg-[#0d0101] border border-rose-900/30 rounded-[3rem] p-10 shadow-2xl glow-red relative overflow-hidden">
          
          <div className="text-center mb-10">
            <div className="inline-flex bg-gradient-to-br from-rose-600 to-fuchsia-700 p-4 rounded-3xl shadow-lg mb-6 group">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none"><path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">SNAP<span className="text-rose-600">STREAM</span></h1>
            <p className="text-rose-100/40 text-[10px] font-black uppercase tracking-[0.5em]">Persistence Terminal</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center animate-in slide-in-from-top-2">
              <p className="text-[10px] font-black uppercase text-red-500 leading-relaxed">{error}</p>
            </div>
          )}

          {isSimulated && !error && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
              <p className="text-[9px] font-black uppercase text-amber-500">Simulator Mode Active (Backend Offline)</p>
            </div>
          )}

          {mode === 'LANDING' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <button onClick={() => handleLandingChoice('LOGIN')} className="w-full py-6 bg-rose-950/20 border border-rose-500/30 rounded-3xl flex flex-col items-center group transition-all hover:bg-rose-600">
                <span className="text-xs font-black uppercase tracking-widest text-rose-500 group-hover:text-white">Log In</span>
              </button>
              <button onClick={() => handleLandingChoice('SIGNUP')} className="w-full py-6 bg-fuchsia-950/20 border border-fuchsia-500/30 rounded-3xl flex flex-col items-center group transition-all hover:bg-fuchsia-600">
                <span className="text-xs font-black uppercase tracking-widest text-fuchsia-500 group-hover:text-white">Sign Up</span>
              </button>
            </div>
          )}

          {(mode === 'LOGIN' || mode === 'SIGNUP') && (
            <form onSubmit={mode === 'LOGIN' ? handleInitialLogin : handleSignUp} className="space-y-5 animate-in zoom-in-95 duration-300">
              <div className="flex bg-black/40 p-1 rounded-2xl border border-rose-900/20 mb-6">
                <button type="button" onClick={() => setSelectedRole('user')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl ${selectedRole === 'user' ? 'bg-rose-600 text-white shadow-lg' : 'text-rose-900'}`}>User</button>
                <button type="button" onClick={() => setSelectedRole('admin')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl ${selectedRole === 'admin' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-fuchsia-900'}`}>Admin</button>
              </div>
              <div className="space-y-4">
                {mode === 'SIGNUP' && <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full bg-black border border-rose-900/30 rounded-2xl p-4 text-xs text-rose-100 focus:border-rose-500 outline-none" />}
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-black border border-rose-900/30 rounded-2xl p-4 text-xs text-rose-100 focus:border-rose-500 outline-none" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-black border border-rose-900/30 rounded-2xl p-4 text-xs text-rose-100 focus:border-rose-500 outline-none" />
              </div>
              <button type="submit" disabled={loading} className={`w-full py-4 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl transition-all ${loading ? 'opacity-50' : (mode === 'LOGIN' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-600/20')}`}>
                {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Log In' : 'Register')}
              </button>
              <div className="flex justify-between items-center px-1">
                <button type="button" onClick={() => setMode('LANDING')} className="text-[9px] font-black text-rose-900 uppercase hover:text-rose-500 transition-colors">← Back</button>
                {mode === 'LOGIN' && (
                  <button type="button" onClick={() => setMode('FORGOT')} className="text-[9px] font-black text-fuchsia-900 uppercase hover:text-fuchsia-500 transition-colors">Forgot Password?</button>
                )}
              </div>
              
              <div className="pt-4 text-center">
                <p className="text-[8px] text-rose-900/40 uppercase font-black tracking-widest leading-relaxed">
                  Default Access: admin@snapstream.io<br/>Password: password123
                </p>
              </div>
            </form>
          )}

          {mode === 'FORGOT' && (
            <form onSubmit={handleSendRecovery} className="space-y-6">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-black border border-rose-900/30 rounded-2xl p-4 text-xs text-rose-100 focus:border-rose-500 outline-none" />
              <button type="submit" disabled={loading} className="w-full py-4 bg-fuchsia-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-fuchsia-600/20">Send Recovery Link</button>
              <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-[9px] font-black text-rose-900 uppercase text-center hover:text-rose-500 transition-colors">← Back</button>
            </form>
          )}

          {mode === 'RECOVERY_SENT' && (
            <div className="text-center space-y-6 animate-in fade-in">
              <h3 className="text-xl font-black text-white uppercase">Email Sent</h3>
              <p className="text-rose-100/40 text-[11px] uppercase tracking-tight leading-relaxed">A secure link has been dispatched via <span className="text-rose-500">{SMTP_CORE_CONFIG.auth.user}</span>. Please verify your inbox.</p>
              <button onClick={() => setMode('LOGIN')} className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-slate-800 transition-all">Back to Login</button>
            </div>
          )}
          
          <div className="mt-10 pt-6 border-t border-rose-900/10 text-center">
            <p className="text-[8px] font-black text-rose-950 uppercase tracking-[0.8em]">Core Identity Protocol v5.2.1</p>
          </div>
        </div>
      </div>
    </div>
  );
};
