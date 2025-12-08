import React, { useState } from 'react';
import { ViewProps, User, Role } from '../types';
import { User as UserIcon, Bell, Shield, Mail, Building, Save, Users, Plus, Edit2, Trash2, X, Check, Lock, Smartphone, LogOut } from 'lucide-react';

const Settings: React.FC<ViewProps> = ({ navigate, user, allUsers = [], onAddUser, onEditUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'notifications' | 'security'>('profile');
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

  const handleStartEdit = (userToEdit?: User) => {
    if (userToEdit) {
        setEditingUser({ ...userToEdit });
    } else {
        setEditingUser({
            role: 'CLIENT',
            organization: '',
            name: '',
            email: '',
            password: ''
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
             <button 
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-4 py-2 font-medium rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
                <Users className="w-4 h-4" /> User Management
            </button>
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
                                        <th className="px-4 py-3">Email</th>
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
                                            <td className="px-4 py-3 text-slate-600">{u.email}</td>
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
                    <form onSubmit={handleSaveUser} className="animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingUser.id ? 'Edit User' : 'New User'}
                            </h2>
                            <button 
                                type="button"
                                onClick={() => { setIsEditingUser(false); setEditingUser({}); }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={editingUser.name || ''} 
                                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select 
                                        value={editingUser.role || 'CLIENT'} 
                                        onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="CLIENT">Client</option>
                                        <option value="VERIFICATION_OFFICER">Verification Officer</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                                    <input 
                                        type="text" 
                                        value={editingUser.organization || ''} 
                                        onChange={e => setEditingUser({...editingUser, organization: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    required
                                    value={editingUser.email || ''} 
                                    onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Password {editingUser.id && '(Leave blank to keep current)'}
                                </label>
                                <input 
                                    type="text" 
                                    value={editingUser.password || ''} 
                                    onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                                    placeholder={editingUser.id ? '••••••' : 'Set password'}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => { setIsEditingUser(false); setEditingUser({}); }}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Save User
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
                    <div className="flex items-center justify-between py-3 border-b border-slate-50">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Email Notifications</h3>
                            <p className="text-sm text-slate-500 mt-1">Receive emails about new requests and major updates.</p>
                        </div>
                        <Toggle 
                            checked={notifPreferences.emailRequest} 
                            onChange={() => setNotifPreferences({...notifPreferences, emailRequest: !notifPreferences.emailRequest})}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-slate-50">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Status Updates</h3>
                            <p className="text-sm text-slate-500 mt-1">Get notified when request status changes.</p>
                        </div>
                        <Toggle 
                            checked={notifPreferences.emailStatus} 
                            onChange={() => setNotifPreferences({...notifPreferences, emailStatus: !notifPreferences.emailStatus})}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-slate-50">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Push Notifications</h3>
                            <p className="text-sm text-slate-500 mt-1">Receive real-time alerts in your browser.</p>
                        </div>
                        <Toggle 
                            checked={notifPreferences.push} 
                            onChange={() => setNotifPreferences({...notifPreferences, push: !notifPreferences.push})}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Marketing & Tips</h3>
                            <p className="text-sm text-slate-500 mt-1">Receive platform tips and promotional content.</p>
                        </div>
                        <Toggle 
                            checked={notifPreferences.marketing} 
                            onChange={() => setNotifPreferences({...notifPreferences, marketing: !notifPreferences.marketing})}
                        />
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button onClick={() => alert('Preferences saved!')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Preferences
                  </button>
                </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in space-y-8">
                <div>
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
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                />
                                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                            <input 
                                type="password" 
                                value={passwords.new}
                                onChange={e => setPasswords({...passwords, new: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                            <input 
                                type="password" 
                                value={passwords.confirm}
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                        </div>

                        <div className="pt-2">
                             <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                                Update Password
                             </button>
                        </div>
                    </form>
                </div>

                <div className="border-t border-slate-100 pt-8">
                    <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-slate-500" />
                        Two-Factor Authentication
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Authenticator App</p>
                            <p className="text-sm text-slate-500">Secure your account with Google Authenticator or similar apps.</p>
                        </div>
                        <button className="text-indigo-600 text-sm font-medium hover:underline">Setup</button>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                     <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-slate-500" />
                        Active Sessions
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div>
                                    <p className="font-medium text-slate-900">Chrome on MacOS</p>
                                    <p className="text-slate-500 text-xs">San Francisco, US • Current Session</p>
                                </div>
                            </div>
                        </div>
                         <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                                <div>
                                    <p className="font-medium text-slate-900">Safari on iPhone 13</p>
                                    <p className="text-slate-500 text-xs">San Francisco, US • 2 days ago</p>
                                </div>
                            </div>
                             <button className="text-red-500 hover:text-red-600 text-xs font-medium">Revoke</button>
                        </div>
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