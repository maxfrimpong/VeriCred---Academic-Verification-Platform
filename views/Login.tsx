import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, User as UserIcon, Building2 } from 'lucide-react';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
  availableUsers?: User[];
  onRegister: (user: User) => void;
  showDemoCredentials?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, showDemoCredentials = true }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<Role>('CLIENT');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              organization,
              role,
              credits: 0,
            },
          },
        });

        if (signUpError) throw signUpError;
        if (data.user && !data.session) {
             setError("Registration successful. Please check your email for confirmation.");
             setLoading(false);
             return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  const fillCredentials = (roleType: Role) => {
    if (roleType === 'ADMIN') {
        setEmail('max.frimpong@vericred.com');
        setPassword('IoU10074385?');
    } else if (roleType === 'VERIFICATION_OFFICER') {
        setEmail('officer@vericred.com');
        setPassword('password123');
    } else {
        setEmail('client@techglobal.com');
        setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <div className="inline-flex p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/50 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">VeriCred</h1>
          <p className="text-slate-400">Secure Academic Verification Platform</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Organization</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="CLIENT">Client</option>
                            <option value="VERIFICATION_OFFICER">Verification Officer</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                    </div>
                </div>
            )}

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
                    {error}
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')} 
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          
          {showDemoCredentials && (
             <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Quick Login (Demo)</p>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => fillCredentials('ADMIN')} className="text-xs bg-purple-50 text-purple-700 py-1 rounded hover:bg-purple-100 font-medium">Admin</button>
                    <button onClick={() => fillCredentials('VERIFICATION_OFFICER')} className="text-xs bg-blue-50 text-blue-700 py-1 rounded hover:bg-blue-100 font-medium">Officer</button>
                    <button onClick={() => fillCredentials('CLIENT')} className="text-xs bg-slate-100 text-slate-700 py-1 rounded hover:bg-slate-200 font-medium">Client</button>
                </div>
             </div>
          )}

          <div className="mt-6 text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                  {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
              </button>
          </div>
        </div>
      </div>
      <p className="text-center text-slate-400 text-sm mt-8">
        &copy; 2024 VeriCred Inc.
      </p>
    </div>
  );
};

export default Login;