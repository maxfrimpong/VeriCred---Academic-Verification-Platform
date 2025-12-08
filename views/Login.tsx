import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Info, Building2, UserCog, ClipboardCheck } from 'lucide-react';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  availableUsers?: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, availableUsers = [] }) => {
  const [activeTab, setActiveTab] = useState<Role>('CLIENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Credentials state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Update credentials hint when tab changes
  React.useEffect(() => {
    // Find a demo user for this role to pre-fill for convenience
    const demoUser = availableUsers.find(u => u.role === activeTab);
    if (demoUser) {
        setEmail(demoUser.email);
        setPassword(demoUser.password || '');
    } else {
        setEmail('');
        setPassword('');
    }
    setError('');
  }, [activeTab, availableUsers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      setLoading(false);
      
      const foundUser = availableUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Invalid email or password.');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header Logo */}
        <div className="p-8 pb-0">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">VeriCred Portal</h1>
          <p className="text-center text-slate-500 mb-6">Secure Academic Verification Platform</p>
        </div>

        {/* Role Tabs */}
        <div className="px-6 mb-6">
          <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveTab('CLIENT')}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                activeTab === 'CLIENT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-3 h-3" /> Client
            </button>
            <button
              onClick={() => setActiveTab('VERIFICATION_OFFICER')}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                activeTab === 'VERIFICATION_OFFICER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardCheck className="w-3 h-3" /> Officer
            </button>
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                activeTab === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCog className="w-3 h-3" /> Admin
            </button>
          </div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="border rounded-lg p-3 mb-6 flex items-start gap-3 bg-slate-50 border-slate-200">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500" />
            <div className="text-sm text-slate-700 w-full">
              <p className="font-semibold mb-1">Pre-filled Credentials:</p>
              <div className="grid grid-cols-[60px_1fr] gap-x-2">
                <span className="opacity-70">Email:</span>
                <span className="font-mono font-medium truncate">{email}</span>
                <span className="opacity-70">Pass:</span>
                <span className="font-mono font-medium">{password ? '•••••' : ''}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded border border-red-100 text-center">
                    {error}
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;