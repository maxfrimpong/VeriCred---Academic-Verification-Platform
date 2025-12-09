import React, { useState } from 'react';
import { ViewProps, User, Role, PaymentGateway } from '../types';
import { User as UserIcon, Bell, Shield, Mail, Building, Save, Users, Plus, Edit2, Trash2, X, Check, Lock, Smartphone, LogOut, CreditCard } from 'lucide-react';

const Settings: React.FC<ViewProps> = ({ 
    navigate, user, allUsers = [], onAddUser, onEditUser, onDeleteUser, 
    paymentConfig, onUpdatePaymentConfig,
    showDemoCredentials, onToggleDemoCredentials 
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'notifications' | 'security' | 'payments'>('profile');
  const isAdmin = user?.role === 'ADMIN';

  // User Management State
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  // Security State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  
  // Notification State
  const [notifPreferences, setNotifPreferences] = useState({
    emailRequest: true,
    emailStatus: true,
    push: false,
    marketing: false
  });

  // Payment State
  const [pConfig, setPConfig] = useState(paymentConfig);

  const handleStartEdit = (userToEdit?: User) => {
    if (userToEdit) {
        setEditingUser({ ...userToEdit });
    } else {
        setEditingUser({
            role: 'CLIENT',
            organization: '',
            name: '',
            email: '',
            password: '',
            credits: 0 // Default new user credits
        });
    }
    setIsEditingUser(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.email || !editingUser.name) return;

    if (editingUser.id) {
        // Edit existing
        if (onEditUser) onEditUser(editingUser as User);
    } else {
        // Create new
        const newUser: User = {
            credits: 0,
            ...editingUser as User,
            id: `user-${Date.now()}`,
        };
        if (onAddUser) onAddUser(newUser);
    }
    setIsEditingUser(false);
    setEditingUser({});
  };

  const handleDeleteClick = (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user? This cannot be undone.')) {
        if (onDeleteUser) onDeleteUser(userId);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
        alert("New passwords do not match.");
        return;
    }
    alert("Password updated successfully.");
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handlePaymentConfigSave = () => {
      if (onUpdatePaymentConfig && pConfig) {
          onUpdatePaymentConfig(pConfig);
          alert("Payment configuration saved.");
      }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button 
        type="button"
        onClick={onChange}
        className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
        <span className={`w-4 h-4 transform bg-white rounded-full transition-transform duration-200 shadow-sm ml-1 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
         <button 
          onClick={() => navigate('dashboard')}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account preferences {isAdmin && '& system users'}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar for Settings */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2 font-medium rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="w-4 h-4" /> Profile
          </button>
          
          {isAdmin && (
            <>
             <button 
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-4 py-2 font-medium rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
                <Users className="w-4 h-4" /> User Management
            </button>
            <button 
                onClick={() => setActiveTab('payments')}
                className={`w-full text-left px-4 py-2 font-medium rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'payments' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
                <CreditCard className="w-4 h-4" /> Payment Integrations
            </button>
            </>
          )}

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-2 font-medium rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-2 font-medium rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4" /> Security
          </button>
        </div>

        {/* Main Settings Content */}
        <div className="md:col-span-2 space-y-6">
          
          {activeTab === 'profile' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-indigo-600" />
                  Profile Information
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input type="text" defaultValue={user?.name} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
    
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <input type="email" defaultValue={user?.email} className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
    
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                    <div className="relative">
                      <input type="text" defaultValue={user?.organization} className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
          )}

          {activeTab === 'payments' && isAdmin && pConfig && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      Payment Gateways
                  </h2>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-bold text-slate-900 mb-2">Default Payment Gateway</label>
                          <select 
                            value={pConfig.activeGateway}
                            onChange={(e) => setPConfig({...pConfig, activeGateway: e.target.value as PaymentGateway})}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                              <option value="PAYSTACK">Paystack</option>
                              <option value="STRIPE">Stripe</option>
                              <option value="PAYPAL">PayPal</option>
                          </select>
                          <p className="text-xs text-slate-500 mt-1">This gateway will be presented to clients during checkout.</p>
                      </div>

                      <div className="border-t border-slate-100 pt-6 space-y-4">
                          <h3 className="font-semibold text-slate-900">Paystack Settings</h3>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Public Key</label>
                              <input 
                                type="text" 
                                value={pConfig.keys.paystack.publicKey}
                                onChange={(e) => setPConfig({...pConfig, keys: { ...pConfig.keys, paystack: { ...pConfig.keys.paystack, publicKey: e.target.value }}})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Secret Key</label>
                              <input 
                                type="password" 
                                value={pConfig.keys.paystack.secret}
                                onChange={(e) => setPConfig({...pConfig, keys: { ...pConfig.keys, paystack: { ...pConfig.keys.paystack, secret: e.target.value }}})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                              />
                          </div>
                      </div>

                      <div className="border-t border-slate-100 pt-6 space-y-4">
                          <h3 className="font-semibold text-slate-900">Stripe Settings</h3>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Publishable Key</label>
                              <input 
                                type="text" 
                                value={pConfig.keys.stripe.publishable}
                                onChange={(e) => setPConfig({...pConfig, keys: { ...pConfig.keys, stripe: { ...pConfig.keys.stripe, publishable: e.target.value }}})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Secret Key</label>
                              <input 
                                type="password" 
                                value={pConfig.keys.stripe.secret}
                                onChange={(e) => setPConfig({...pConfig, keys: { ...pConfig.keys, stripe: { ...pConfig.keys.stripe, secret: e.target.value }}})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                              />
                          </div>
                      </div>

                      <div className="border-t border-slate-100 pt-6 space-y-4">
                          <h3 className="font-semibold text-slate-900">PayPal Settings</h3>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Client ID</label>
                              <input 
                                type="text" 
                                value={pConfig.keys.paypal.clientId}
                                onChange={(e) => setPConfig({...pConfig, keys: { ...pConfig.keys, paypal: { ...pConfig.keys.paypal, clientId: e.target.value }}})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Secret</label>
                              <input 
                                type="password" 
                                value={pConfig.keys.paypal.secret}
                                onChange={(e) => setPConfig({...pConfig, keys: { ...pConfig.keys, paypal: { ...pConfig.keys.paypal, secret: e.target.value }}})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                              />
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                      <button 
                        onClick={handlePaymentConfigSave}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                          <Save className="w-4 h-4" /> Save Configuration
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in">
                {!isEditingUser ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                User Management
                            </h2>
                            <button 
                                onClick={() => handleStartEdit()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add User
                            </button>
                        </div>
                        
                        <div className="overflow-hidden border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Name / Org</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Credits</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 group">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{u.name}</div>
                                                <div className="text-xs text-slate-500">{u.organization}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                                    ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                                                      u.role === 'VERIFICATION_OFFICER' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                                                    {u.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {u.role === 'CLIENT' ? (
                                                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                                        {u.subscriptionPlan === 'ENTERPRISE' ? '∞' : u.credits}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleStartEdit(u)} className="p-1 text-slate-400 hover:text-indigo-600">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {u.id !== user?.id && (
                                                        <button onClick={() => handleDeleteClick(u.id)} className="p-1 text-slate-400 hover:text-red-600">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900">
                                {editingUser.id ? 'Edit User' : 'Create New User'}
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setIsEditingUser(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={editingUser.name || ''} 
                                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select 
                                    value={editingUser.role || 'CLIENT'} 
                                    onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="CLIENT">Client</option>
                                    <option value="VERIFICATION_OFFICER">Verification Officer</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                value={editingUser.email || ''} 
                                onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        {!editingUser.id && (
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input 
                                    type="password" 
                                    value={editingUser.password || ''} 
                                    onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Set temporary password"
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1">Required for the user's first login.</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                            <input 
                                type="text" 
                                value={editingUser.organization || ''} 
                                onChange={e => setEditingUser({...editingUser, organization: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {editingUser.role === 'CLIENT' && (
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Credits</label>
                                <input 
                                    type="number" 
                                    value={editingUser.credits || 0} 
                                    onChange={e => setEditingUser({...editingUser, credits: parseInt(e.target.value) || 0})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        <div className="flex justify-end pt-4 gap-2 border-t border-slate-100 mt-4">
                             <button 
                                type="button" 
                                onClick={() => setIsEditingUser(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                Save User
                            </button>
                        </div>
                    </form>
                )}
            </div>
          )}

          {activeTab === 'notifications' && (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in">
                 <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    Notification Preferences
                </h2>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                        <div>
                            <h3 className="font-medium text-slate-900">Email Notifications</h3>
                            <p className="text-sm text-slate-500">Receive emails about new requests</p>
                        </div>
                        <Toggle checked={notifPreferences.emailRequest} onChange={() => setNotifPreferences({...notifPreferences, emailRequest: !notifPreferences.emailRequest})} />
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                        <div>
                            <h3 className="font-medium text-slate-900">Status Updates</h3>
                            <p className="text-sm text-slate-500">Get notified when status changes</p>
                        </div>
                         <Toggle checked={notifPreferences.emailStatus} onChange={() => setNotifPreferences({...notifPreferences, emailStatus: !notifPreferences.emailStatus})} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-slate-900">Marketing Emails</h3>
                            <p className="text-sm text-slate-500">Receive news and special offers</p>
                        </div>
                         <Toggle checked={notifPreferences.marketing} onChange={() => setNotifPreferences({...notifPreferences, marketing: !notifPreferences.marketing})} />
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    Security Settings
                </h2>

                <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={passwords.current}
                                onChange={e => setPasswords({...passwords, current: e.target.value})}
                                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={passwords.new}
                                onChange={e => setPasswords({...passwords, new: e.target.value})}
                                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={passwords.confirm}
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                            Update Password
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="font-semibold text-slate-900 mb-4">Demo Configuration</h3>
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                        <div>
                            <span className="font-medium text-slate-700 block">Show Demo Credentials</span>
                            <span className="text-xs text-slate-500">Pre-fill login form for testing</span>
                        </div>
                        <Toggle checked={!!showDemoCredentials} onChange={() => onToggleDemoCredentials && onToggleDemoCredentials(!showDemoCredentials)} />
                    </div>
                </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;