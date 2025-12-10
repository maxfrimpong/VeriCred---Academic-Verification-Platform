import React from 'react';
import { LayoutDashboard, FilePlus, ShieldCheck, Settings, LogOut, CheckCircle, Users, ScrollText, UserCircle, CreditCard } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onSignOut: () => void;
  user?: User;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onSignOut, user }) => {
  const isAdmin = user?.role === 'ADMIN';
  const isOfficer = user?.role === 'VERIFICATION_OFFICER';
  const isClient = user?.role === 'CLIENT';

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin Portal';
    if (isOfficer) return 'Officer Portal';
    return 'Client Access';
  };

  const navButtonClass = (view: ViewState) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
    currentView === view 
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`;

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-20">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
            <span className="text-xl font-bold tracking-tight block">VerifiVUE</span>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{getRoleLabel()}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4">Menu</div>
        
        <button
          onClick={() => onNavigate('dashboard')}
          className={navButtonClass('dashboard')}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </button>
        
        <button
          onClick={() => onNavigate('new-request')}
          className={navButtonClass('new-request')}
        >
          <FilePlus className="w-5 h-5" />
          <span className="font-medium">New Verification</span>
        </button>

        {isAdmin && (
          <>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2 px-4">Administration</div>
            
            <button
              onClick={() => onNavigate('clients')}
              className={navButtonClass('clients')}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Clients</span>
            </button>
            
            <button
              onClick={() => onNavigate('audit-log')}
              className={navButtonClass('audit-log')}
            >
              <ScrollText className="w-5 h-5" />
              <span className="font-medium">Audit Log</span>
            </button>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        {isClient && user && (
            <div className="bg-slate-800 rounded-lg p-3 mb-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs font-semibold uppercase">
                    <CreditCard className="w-3 h-3" /> Balance
                </div>
                <div className="text-lg font-bold text-white">
                    {user.subscriptionPlan === 'ENTERPRISE' ? (
                        <span className="text-green-400">Enterprise</span>
                    ) : (
                        <span>{user.credits} Credits</span>
                    )}
                </div>
            </div>
        )}

        {/* User Profile Mini */}
        {user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.organization}</p>
            </div>
          </div>
        )}

        <button 
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-left text-sm ${
            currentView === 'settings' 
              ? 'bg-slate-800 text-white' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium">Settings</span>
        </button>
        <button 
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-left text-sm mt-1"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;