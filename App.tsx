import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import NewRequest from './views/NewRequest';
import RequestDetail from './views/RequestDetail';
import Settings from './views/Settings';
import Clients from './views/Clients';
import AuditLog from './views/AuditLog';
import Login from './views/Login';
import { ViewState, VerificationRequest, VerificationStatus, User, Notification, PaymentConfig, PackageDef, Role } from './types';
import { Bell, X, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './services/supabaseClient';
import { createClient } from '@supabase/supabase-js';

// Mock Initial Data - Used as fallback data for the dashboard if DB is empty
const INITIAL_REQUESTS: VerificationRequest[] = [
  {
    id: 'REQ-2024-001',
    candidateName: 'Alice Johnson',
    institution: 'University of California, Berkeley',
    degree: 'B.S. Computer Science',
    graduationYear: '2023',
    status: VerificationStatus.Verified,
    submissionDate: '2024-05-15T10:00:00Z',
    lastUpdated: '2024-05-18T14:30:00Z',
    clientId: 'client-1',
    clientName: 'TechGlobal Inc.',
    timeline: [
        { id: '1', label: 'Request Submitted', description: 'Request received.', status: 'completed', date: 'May 15, 2024' },
        { id: '2', label: 'Document Analysis', description: 'AI verification passed. Confidence: 99%.', status: 'completed', date: 'May 15, 2024' },
        { id: '3', label: 'Institution Outreach', description: 'Registrar confirmed enrollment and graduation.', status: 'completed', date: 'May 17, 2024' },
        { id: '4', label: 'Final Verification', description: 'Verified successfully.', status: 'completed', date: 'May 18, 2024' }
    ]
  },
  {
    id: 'REQ-2024-003',
    candidateName: 'Sarah Smith',
    institution: 'New York University',
    degree: 'B.A. Economics',
    graduationYear: '2021',
    status: VerificationStatus.ReviewRequired,
    submissionDate: '2024-05-19T16:45:00Z',
    lastUpdated: '2024-05-19T16:50:00Z',
    clientId: 'client-1',
    clientName: 'TechGlobal Inc.',
    aiAnalysis: {
        extractedName: 'Sarah Smith',
        extractedInstitution: 'NYU',
        extractedDegree: 'BA Econ',
        extractedDate: '2021',
        confidenceScore: 65,
        authenticityNotes: 'Image is blurry. Cannot read official seal clearly.',
        isTampered: false
    },
    timeline: [
        { id: '1', label: 'Request Submitted', description: 'Request received.', status: 'completed', date: 'May 19, 2024' },
        { id: '2', label: 'Document Analysis', description: 'Low confidence score (65%). Possible blurry image. Human review needed.', status: 'error', date: 'May 19, 2024' },
        { id: '3', label: 'Institution Outreach', description: 'On hold pending manual review.', status: 'upcoming' },
        { id: '4', label: 'Final Verification', description: 'Pending.', status: 'upcoming' }
    ]
  },
];

const INITIAL_PAYMENT_CONFIG: PaymentConfig = {
    activeGateway: 'PAYSTACK',
    keys: {
        stripe: { publishable: '', secret: '' },
        paystack: { publicKey: '', secret: '' },
        paypal: { clientId: '', secret: '' }
    }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>();
  const [requests, setRequests] = useState<VerificationRequest[]>(INITIAL_REQUESTS);
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(INITIAL_PAYMENT_CONFIG);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // SUPABASE AUTH INTEGRATION
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper to map DB profile to App User
  const mapDbProfileToUser = (p: any): User => ({
    id: p.id,
    email: p.email,
    name: p.name,
    organization: p.organization,
    role: p.role as Role,
    credits: p.credits,
    subscriptionPlan: p.subscription_plan,
    subscriptionExpiry: p.subscription_expiry,
    status: p.status || 'active'
  });

  // Fetch all users if Admin + Realtime Subscription
  useEffect(() => {
      if (currentUser?.role === 'ADMIN') {
          fetchSystemUsers();

          const channel = supabase.channel('realtime-profiles')
              .on(
                  'postgres_changes',
                  { event: '*', schema: 'public', table: 'profiles' },
                  (payload) => {
                      if (payload.eventType === 'INSERT') {
                          setAllUsers((prev) => [...prev, mapDbProfileToUser(payload.new)]);
                      } else if (payload.eventType === 'UPDATE') {
                          setAllUsers((prev) => prev.map((u) => u.id === payload.new.id ? mapDbProfileToUser(payload.new) : u));
                      } else if (payload.eventType === 'DELETE') {
                          setAllUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
                      }
                  }
              )
              .subscribe();

          return () => {
              supabase.removeChannel(channel);
          };
      }
  }, [currentUser?.role]);

  const fetchUserProfile = async (userId: string) => {
    // Fetch from profiles table for most up-to-date data
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (data && !error) {
        if (data.status === 'suspended') {
            alert("Your account has been suspended. Please contact support.");
            await supabase.auth.signOut();
            setCurrentUser(null);
            return;
        }
        setCurrentUser(mapDbProfileToUser(data));
    } else {
        // Fallback to auth metadata if profile doesn't exist yet (race condition)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) mapSessionUser(user);
    }
  };

  const fetchSystemUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      
      if (error) {
          console.error("Error fetching system users:", error);
          return;
      }
      
      if (data) {
          const mappedUsers = data.map(mapDbProfileToUser);
          setAllUsers(mappedUsers);
      }
  };

  const mapSessionUser = (supabaseUser: any) => {
    // Map Supabase User Metadata to App User Type
    const metadata = supabaseUser.user_metadata || {};
    const mappedUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: metadata.name || 'Supabase User',
      organization: metadata.organization || 'Organization',
      role: (metadata.role as Role) || 'CLIENT',
      credits: metadata.credits || 0,
      subscriptionPlan: metadata.subscriptionPlan,
      subscriptionExpiry: metadata.subscriptionExpiry,
      status: 'active'
    };
    setCurrentUser(mappedUser);
  };

  const navigate = (view: ViewState, id?: string) => {
    setCurrentView(view);
    if (id) setCurrentRequestId(id);
    setShowNotifications(false);
    window.scrollTo(0,0);
  };

  const handleNewRequest = async (req: Omit<VerificationRequest, 'id' | 'clientId' | 'clientName'>) => {
    if (!currentUser) return;
    
    // Deduct Credit if not Enterprise (Check for Enterprise validity)
    const isEnterprise = currentUser.subscriptionPlan === 'ENTERPRISE' && 
        currentUser.subscriptionExpiry && 
        new Date(currentUser.subscriptionExpiry) > new Date();

    if (!isEnterprise) {
        if (currentUser.credits <= 0) {
            alert("Insufficient credits.");
            return;
        }
        
        // Update user credits in Supabase (Profiles table)
        const newCredits = currentUser.credits - 1;
        
        const { error } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', currentUser.id);

        if (error) {
            console.error("Failed to update credits", error);
            alert("Transaction failed. Please try again.");
            return;
        }

        // Optimistic UI Update
        const updatedUser = { ...currentUser, credits: newCredits };
        setCurrentUser(updatedUser);
    }

    const newId = `REQ-2024-${String(requests.length + 1).padStart(3, '0')}`;
    const newRequest: VerificationRequest = { 
      ...req, 
      id: newId,
      clientId: currentUser.id,
      clientName: currentUser.organization
    };
    setRequests([newRequest, ...requests]);

    // Notify (Local simulation of notification system)
    const newNotif: Notification = {
        id: `n-${Date.now()}`,
        userId: currentUser.id, // Notify self for demo
        title: 'Request Submitted',
        message: `Verification request for ${req.candidateName} submitted successfully.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
        relatedRequestId: newId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleUpdateRequest = (updatedRequest: VerificationRequest) => {
    setRequests(prevRequests => 
      prevRequests.map(req => req.id === updatedRequest.id ? updatedRequest : req)
    );
  };

  // User Management Handlers
  const handleAddUser = async (user: User) => {
    // We must creating a TEMPORARY client to sign up the new user.
    if (!user.password) {
        alert("Password is required to create a user.");
        return;
    }

    try {
        const tempSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        // This triggers the Database Trigger 'on_auth_user_created' which populates the 'profiles' table
        const { data, error } = await tempSupabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: {
                    name: user.name,
                    organization: user.organization,
                    role: user.role,
                    credits: user.credits || 0,
                    subscriptionPlan: user.subscriptionPlan,
                    subscriptionExpiry: user.subscriptionExpiry
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            const newNotif: Notification = {
                id: `n-${Date.now()}`,
                userId: currentUser?.id || '',
                title: 'User Created',
                message: `User ${user.name} (${user.role}) has been successfully created in the database.`,
                type: 'success',
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [newNotif, ...prev]);
        }

    } catch (err: any) {
        console.error("Failed to create user", err);
        alert(`Error creating user: ${err.message}`);
    }
  };

  const handleEditUser = async (updatedUser: User) => {
    // Update the Profile Table directly
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                name: updatedUser.name,
                organization: updatedUser.organization,
                role: updatedUser.role,
                credits: updatedUser.credits,
                subscription_plan: updatedUser.subscriptionPlan,
                subscription_expiry: updatedUser.subscriptionExpiry,
                status: updatedUser.status
            })
            .eq('id', updatedUser.id);

        if (error) throw error;

        // If editing self
        if (currentUser?.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
    } catch (err: any) {
        console.error("Error updating user", err);
        alert("Failed to update user.");
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus?: string) => {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      try {
        const { error } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', userId);

        if (error) throw error;
        
        // Optimistic update
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        
      } catch (err: any) {
          console.error("Error updating status", err);
          alert("Failed to change user status.");
      }
  };

  const handleDeleteUser = async (userId: string) => {
    // Note: This only deletes from Profiles table. 
    // To delete from Auth, you need a backend function with Service Role.
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        // Realtime subscription handles list update
    } catch (err: any) {
        console.error("Delete failed", err);
        alert("Failed to delete user profile.");
    }
  };

  const handleLogin = (user: User) => {}; 
  
  const handleSignOut = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        setCurrentUser(null);
        setCurrentView('dashboard');
        setShowNotifications(false);
    }
  };

  const handleTopUp = async (pkg: PackageDef) => {
    if (!currentUser) return;

    let updates: any = {};

    if (pkg.id === 'ENTERPRISE') {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        updates.subscription_plan = 'ENTERPRISE';
        updates.subscription_expiry = nextYear.toISOString();
    } else {
        const currentCredits = currentUser.credits || 0;
        const addCredits = typeof pkg.credits === 'number' ? pkg.credits : 0;
        updates.credits = currentCredits + addCredits;
        updates.subscription_plan = pkg.id;
        updates.subscription_expiry = null;
    }

    // Update Profile
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

    if (error) {
        console.error("TopUp Failed", error);
        alert("Purchase failed. Please try again.");
        return;
    }

    // Optimistic UI update
    // Map db keys back to app keys
    const appUpdates = {
        subscriptionPlan: updates.subscription_plan,
        subscriptionExpiry: updates.subscription_expiry,
        credits: updates.credits
    };
    const updatedUser = { ...currentUser, ...appUpdates };
    setCurrentUser(updatedUser);
    
    const newNotif: Notification = {
        id: `n-${Date.now()}`,
        userId: currentUser.id,
        title: 'Purchase Successful',
        message: `You have successfully purchased the ${pkg.name} package.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // --- Notifications Logic ---
  const myNotifications = currentUser 
    ? notifications.filter(n => n.userId === currentUser.id) 
    : [];
  const unreadCount = myNotifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.relatedRequestId) {
        navigate('request-detail', n.relatedRequestId);
    }
    setShowNotifications(false);
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.filter(n => n.userId !== currentUser?.id));
  };

  // --- Render Helpers ---

  // Filter requests based on role
  const getVisibleRequests = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN' || currentUser.role === 'VERIFICATION_OFFICER') {
      return requests;
    }
    const myRequests = requests.filter(r => r.clientId === currentUser.id);
    return myRequests;
  };

  const getActiveRequest = () => requests.find(r => r.id === currentRequestId);

  if (!currentUser) {
    return (
        <Login 
            onLogin={handleLogin} 
            availableUsers={allUsers} // Not really used in Supabase mode
            onRegister={handleAddUser} 
        />
    );
  }

  const visibleRequests = getVisibleRequests();

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar 
        currentView={currentView} 
        onNavigate={navigate} 
        onSignOut={handleSignOut}
        user={currentUser}
      />
      
      <main className="flex-1 ml-64 p-8 pt-20 relative">
        
        {/* Top Header Bar with Notifications */}
        <div className="fixed top-0 right-0 left-64 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 flex justify-end items-center px-8 shadow-sm">
             <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-900">Notifications</h3>
                            <div className="flex gap-2">
                                {myNotifications.length > 0 && (
                                    <button 
                                        onClick={clearAllNotifications}
                                        className="text-xs text-slate-500 hover:text-red-500 font-medium"
                                    >
                                        Clear all
                                    </button>
                                )}
                                <button onClick={() => setShowNotifications(false)}>
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {myNotifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm">No new notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {myNotifications.map(n => (
                                        <div 
                                            key={n.id} 
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${n.read ? 'opacity-60' : 'bg-indigo-50/30'}`}
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-slate-300' : 'bg-indigo-500'}`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-sm font-medium ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                        {n.title}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                        {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{n.message}</p>
                                                {n.type === 'success' && <div className="flex items-center text-[10px] text-green-600 font-medium"><CheckCircle className="w-3 h-3 mr-1"/> Success</div>}
                                                {n.type === 'error' && <div className="flex items-center text-[10px] text-red-600 font-medium"><AlertTriangle className="w-3 h-3 mr-1"/> Action Needed</div>}
                                                {n.type === 'warning' && <div className="flex items-center text-[10px] text-amber-600 font-medium"><AlertTriangle className="w-3 h-3 mr-1"/> Attention</div>}
                                            </div>
                                            {n.relatedRequestId && <ExternalLink className="w-3 h-3 text-slate-300 mt-1" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
             </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard 
              navigate={navigate} 
              requests={visibleRequests} 
              user={currentUser}
            />
          )}
          
          {currentView === 'new-request' && (
            <NewRequest 
                navigate={navigate} 
                onSubmit={handleNewRequest} 
                user={currentUser}
                paymentConfig={paymentConfig}
                onTopUp={handleTopUp}
            />
          )}

          {currentView === 'request-detail' && (
            <RequestDetail 
                navigate={navigate} 
                request={getActiveRequest()} 
                user={currentUser}
                onUpdateRequest={handleUpdateRequest}
            />
          )}
          
          {currentView === 'clients' && (
             <Clients 
                navigate={navigate}
                user={currentUser}
                allUsers={allUsers}
                requests={requests}
             />
          )}

          {currentView === 'audit-log' && (
             <AuditLog 
                navigate={navigate}
                user={currentUser}
                requests={requests}
                allUsers={allUsers}
             />
          )}

          {currentView === 'settings' && (
            <Settings 
                navigate={navigate} 
                user={currentUser}
                allUsers={allUsers}
                onAddUser={handleAddUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                onToggleUserStatus={handleToggleUserStatus}
                paymentConfig={paymentConfig}
                onUpdatePaymentConfig={setPaymentConfig}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;