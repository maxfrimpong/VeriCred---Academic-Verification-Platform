import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { User, Role, GlobalConfig } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
  globalConfig?: GlobalConfig;
}

const Login: React.FC<LoginProps> = ({ onLogin, availableUsers, globalConfig }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const appName = globalConfig?.appName || 'VerifiVUE';
  const showDemo = globalConfig?.showDemoCreds !== false; // Default to true if undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay for realistic feel
    setTimeout(() => {
        const user = availableUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            if (user.password === password) {
                if (user.status === 'suspended') {
                    setError("Account suspended. Please contact Admin.");
                } else {
                    onLogin(user);
                }
            } else {
                setError("Incorrect password.");
            }
        } else {
            setError("User not found. Please contact Administrator.");
        }
        setLoading(false);
    }, 800);
  };

  const fillDemoCreds = (role: Role) => {
      let demoEmail = '';
      if (role === 'ADMIN') demoEmail = 'admin@verifivue.com';
      else if (role === 'VERIFICATION_OFFICER') demoEmail = 'officer@verifivue.com';
      else demoEmail = 'client@techglobal.com';

      setEmail(demoEmail);
      setPassword('password'); 
      setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center flex flex-col items-center">
            {globalConfig?.logoUrl ? (
                <img src={globalConfig.logoUrl} alt="Logo" className="h-16 w-auto mb-4 object-contain" />
            ) : (
                <div className="inline-flex p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/50 mb-4">
                    <ShieldCheck className="w-8 h-8 text-white" />
                </div>
            )}
          <h1 className="text-2xl font-bold text-white mb-2">{appName}</h1>
          <p className="text-slate-400">Secure Academic Verification Platform</p>
        </div>
        
        <div className="p-8">
          
          {/* Demo Credentials Box */}
          {showDemo && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
                  <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Demo Auto-fill
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => fillDemoCreds('ADMIN')} className="px-2 py-1 bg-white border border-indigo-200 rounded text-indigo-700 hover:bg-indigo-50 text-xs font-medium">
                          Admin
                      </button>
                      <button type="button" onClick={() => fillDemoCreds('VERIFICATION_OFFICER')} className="px-2 py-1 bg-white border border-indigo-200 rounded text-indigo-700 hover:bg-indigo-50 text-xs font-medium">
                          Officer
                      </button>
                      <button type="button" onClick={() => fillDemoCreds('CLIENT')} className="px-2 py-1 bg-white border border-indigo-200 rounded text-indigo-700 hover:bg-indigo-50 text-xs font-medium">
                          Client
                      </button>
                  </div>
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded border border-red-100 text-center animate-in shake">
                    <p>{error}</p>
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : 'Sign In'} 
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
             Only Administrators can create new accounts.
          </div>
        </div>
      </div>
      <p className="text-center text-slate-400 text-sm mt-8">
        {globalConfig?.copyrightText || '© 2024 VerifiVUE Inc.'}
      </p>
    </div>
  );
};

export default Login;