import React from 'react';
import { ViewProps, User } from '../types';
import { Building2, Mail, ExternalLink, Shield, TrendingUp, CheckCircle2 } from 'lucide-react';

const Clients: React.FC<ViewProps> = ({ allUsers = [], requests = [], navigate }) => {
  const clients = allUsers.filter(u => u.role === 'CLIENT');

  // Helper to get stats per client
  const getClientStats = (clientId: string) => {
    const clientRequests = requests.filter(r => r.clientId === clientId);
    const total = clientRequests.length;
    const verified = clientRequests.filter(r => r.status === 'VERIFIED').length;
    const pending = clientRequests.filter(r => r.status === 'PROCESSING' || r.status === 'PENDING').length;
    return { total, verified, pending };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Registered Clients</h1>
        <p className="text-slate-500 mt-2">Manage and view statistics for all partner organizations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => {
          const stats = getClientStats(client.id);
          
          return (
            <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 border-b border-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                    Active
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 truncate">{client.organization}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <Mail className="w-3 h-3" /> {client.email}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <Shield className="w-3 h-3" /> {client.name} (Admin)
                </div>
              </div>

              <div className="p-6 bg-slate-50/50">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Total</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Verified</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Pending</div>
                    </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Add New Client Card Placeholder */}
        <button 
            onClick={() => navigate('settings')}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/10 transition-all min-h-[250px]"
        >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-indigo-100">
                <ExternalLink className="w-6 h-6" />
            </div>
            <span className="font-medium">Manage or Add Clients</span>
            <span className="text-sm mt-1 opacity-70">Go to User Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Clients;