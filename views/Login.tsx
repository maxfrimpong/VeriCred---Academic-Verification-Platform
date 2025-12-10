import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, User as UserIcon, Building2, AlertCircle } from 'lucide-react';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  availableUsers?: User[];
  onRegister: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, availableUsers, onRegister }) => {
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
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        if (isRegistering) {
            const newUser: User = {
                id: `new-${Date.now()}`,
                name,
                email,
                password,
                role,
                organization,
                credits: 0,
                status: 'active'
            };
            onRegister(newUser);
        } else {
            // Check credentials against availableUsers prop
            const user = availableUsers?.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            
            if (user) {
                if (user.status === 'suspended') {
                    throw new Error("This account has been suspended. Please contact support.");
                }
                onLogin(user);
            } else {
                throw new Error("Invalid email or password.");
            }
        }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  const fillDemoCreds = (role: Role) => {
      if (!availableUsers) return;
      const demoUser = availableUsers.find(u => u.role === role);
      if (demoUser) {
          setEmail(demoUser.email);
          setPassword(demoUser.password || 'password');
          setIsRegistering(false);
          setError('');
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <div className="inline-flex p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/50 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">VerifiVUE</h1>
          <p className="text-slate-400">Secure Academic Verification Platform</p>
        </div>
        
        <div className="p-8">
          
          {/* Demo Credentials Box */}
          {!isRegistering && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
                  <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Demo Credentials
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => fillDemoCreds('ADMIN')} className="px-2 py-1 bg-white border border-indigo-200 rounded text-indigo-700 hover:bg-indigo-50 text-xs font-medium">
                          Admin
                      </button>
                      <button onClick={() => fillDemoCreds('VERIFICATION_OFFICER')} className="px-2 py-1 bg-white border border-indigo-200 rounded text-indigo-700 hover:bg-indigo-50 text-xs font-medium">
                          Officer
                      </button>
                      <button onClick={() => fillDemoCreds('CLIENT')} className="px-2 py-1 bg-white border border-indigo-200 rounded text-indigo-700 hover:bg-indigo-50 text-xs font-medium">
                          Client
                      </button>
                  </div>
              </div>
          )}

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
        &copy; 2024 VerifiVUE Inc.
      </p>
    </div>
  );
};

export default Login;