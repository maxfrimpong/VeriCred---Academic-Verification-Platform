import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import NewRequest from './views/NewRequest';
import RequestDetail from './views/RequestDetail';
import Settings from './views/Settings';
import Clients from './views/Clients';
import AuditLog from './views/AuditLog';
import Login from './views/Login';
import { ViewState, VerificationRequest, VerificationStatus, User, Notification, PaymentConfig, PackageDef, GlobalConfig } from './types';
import { Bell, X, CheckCircle, AlertTriangle, ExternalLink, Loader2, Menu } from 'lucide-react';
import { db } from './services/db';

// Mock Initial Data - Used as fallback data and Seeding
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

// Mock Users Database
const MOCK_DB_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'System Admin',
    email: 'admin@verifivue.com',
    password: 'password', 
    role: 'ADMIN',
    organization: 'VerifiVUE HQ',
    credits: 9999,
    status: 'active'
  },
  {
    id: 'u-officer',
    name: 'Sarah Officer',
    email: 'officer@verifivue.com',
    password: 'password',
    role: 'VERIFICATION_OFFICER',
    organization: 'VerifiVUE Operations',
    credits: 0,
    status: 'active'
  },
  {
    id: 'client-1',
    name: 'TechGlobal Admin',
    email: 'client@techglobal.com',
    password: 'password',
    role: 'CLIENT',
    organization: 'TechGlobal Inc.',
    credits: 15,
    subscriptionPlan: 'CORPORATE_PRO',
    status: 'active'
  }
];

const INITIAL_PACKAGES: PackageDef[] = [
  {
    id: 'STANDARD',
    name: 'Standard',
    price: 120,
    credits: 1,
    description: 'Perfect for one-off verification needs.'
  },
  {
    id: 'CORPORATE_PLUS',
    name: 'Corporate Plus',
    price: 600,
    credits: 5,
    description: 'For small businesses with occasional hiring.'
  },
  {
    id: 'CORPORATE_PRO',
    name: 'Corporate Pro',
    price: 1200,
    credits: 10,
    description: 'Ideal for growing teams and regular checks.'
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 2500,
    credits: 'UNLIMITED',
    durationMonths: 12,
    description: 'Unlimited access for high-volume institutions.'
  }
];

const INITIAL_PAYMENT_CONFIG: PaymentConfig = {
    activeGateway: 'PAYSTACK',
    keys: {
        stripe: { publishable: '', secret: '' },
        paystack: { publicKey: '', secret: '' },
        paypal: { clientId: '', secret: '' }
    }
};

const INITIAL_GLOBAL_CONFIG: GlobalConfig = {
    appName: 'VerifiVUE',
    copyrightText: '© 2024 VerifiVUE Inc. All rights reserved.',
    showDemoCreds: true,
    currency: 'USD'
};

const USER_STORAGE_KEY = 'verifivue_user_session';
const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 Minutes

const App: React.FC = () => {
  const [loadingData, setLoadingData] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize currentUser from LocalStorage if available
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
        return null;
    }
  });

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>();
  
  // Data States
  const [requests, setRequests] = useState<VerificationRequest[]>(INITIAL_REQUESTS);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_DB_USERS); 
  const [packages, setPackages] = useState<PackageDef[]>(INITIAL_PACKAGES);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(INITIAL_GLOBAL_CONFIG);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(INITIAL_PAYMENT_CONFIG);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Initialize Data from Supabase
  useEffect(() => {
    const initData = async () => {
        try {
            await db.seedIfNeeded(INITIAL_REQUESTS, MOCK_DB_USERS, INITIAL_PACKAGES, INITIAL_GLOBAL_CONFIG);

            const [fetchedConfig, fetchedUsers, fetchedPackages, fetchedRequests] = await Promise.all([
                db.getConfig(),
                db.getUsers(),
                db.getPackages(),
                db.getRequests()
            ]);

            if (fetchedConfig) setGlobalConfig(fetchedConfig);
            if (fetchedUsers) setAllUsers(fetchedUsers);
            if (fetchedPackages) setPackages(fetchedPackages);
            if (fetchedRequests) setRequests(fetchedRequests);

            const params = new URLSearchParams(window.location.search);
            const viewParam = params.get('view') as ViewState;
            const idParam = params.get('id');

            if (viewParam && ['dashboard', 'new-request', 'request-detail', 'settings', 'clients', 'audit-log'].includes(viewParam)) {
                setCurrentView(viewParam);
                if (idParam) setCurrentRequestId(idParam);
            }

        } catch (error) {
            console.error("Failed to load data from Supabase, using mock fallback.", error);
        } finally {
            setLoadingData(false);
        }
    };

    initData();
  }, []);

  // --- Session Management Handlers ---

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      navigate('dashboard');
  };

  const handleSignOut = useCallback(() => {
      setCurrentUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      setIsSidebarOpen(false);
      
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('id');
      window.history.pushState({}, '', url);

      setCurrentView('dashboard');
      setShowNotifications(false);
  }, []);

  // --- Inactivity Timer Logic ---
  useEffect(() => {
    if (!currentUser) return;

    let inactivityTimer: ReturnType<typeof setTimeout>;

    const logoutDueToInactivity = () => {
        handleSignOut();
        alert("For security, you have been signed out due to inactivity (10 minutes).");
    };

    const resetTimer = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutDueToInactivity, INACTIVITY_LIMIT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
        document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        events.forEach(event => {
            document.removeEventListener(event, resetTimer);
        });
    };
  }, [currentUser, handleSignOut]);


  // --- Navigation & Core Logic ---

  const navigate = (view: ViewState, id?: string) => {
    setCurrentView(view);
    if (id) setCurrentRequestId(id);
    
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    if (id) url.searchParams.set('id', id);
    else url.searchParams.delete('id');
    window.history.pushState({}, '', url);

    setShowNotifications(false);
    window.scrollTo(0,0);
  };

  const handleNewRequest = async (req: Omit<VerificationRequest, 'id' | 'clientId' | 'clientName'>) => {
    if (!currentUser) return;
    
    const isExempt = currentUser.role === 'ADMIN' || currentUser.role === 'VERIFICATION_OFFICER';

    const isEnterprise = currentUser.subscriptionPlan === 'ENTERPRISE' && 
        currentUser.subscriptionExpiry && 
        new Date(currentUser.subscriptionExpiry) > new Date();

    if (!isEnterprise && !isExempt) {
        if (currentUser.credits <= 0) {
            alert("Insufficient credits.");
            return;
        }
        
        const newCredits = currentUser.credits - 1;
        const updatedUser = { ...currentUser, credits: newCredits };
        
        setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        db.saveUser(updatedUser); 
    }

    const newId = `REQ-2024-${String(requests.length + 1).padStart(3, '0')}`;
    const newRequest: VerificationRequest = { 
      ...req, 
      id: newId,
      clientId: currentUser.id,
      clientName: currentUser.organization
    };
    
    setRequests([newRequest, ...requests]);
    db.saveRequest(newRequest); 

    const newNotif: Notification = {
        id: `n-${Date.now()}`,
        userId: currentUser.id, 
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
    db.saveRequest(updatedRequest); 
  };

  const handleAddUser = (user: User) => {
    const newUser = { ...user, id: `user-${Date.now()}`, status: 'active' as const };
    setAllUsers(prev => [...prev, newUser]);
    db.saveUser(newUser); 
    
    if (currentUser) {
        const newNotif: Notification = {
            id: `n-${Date.now()}`,
            userId: currentUser.id,
            title: 'User Added',
            message: `User ${user.name} (${user.role}) has been added.`,
            type: 'success',
            timestamp: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleEditUser = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    db.saveUser(updatedUser); 
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const handleToggleUserStatus = (userId: string, currentStatus?: string) => {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      const updatedUser = allUsers.find(u => u.id === userId);
      if (updatedUser) {
          const newUser = { ...updatedUser, status: newStatus };
          handleEditUser(newUser as User); 
      }
  };

  const handleDeleteUser = (userId: string) => {
     setAllUsers(prev => prev.filter(u => u.id !== userId));
     db.deleteUser(userId); 
  };

  const handleAddPackage = (pkg: PackageDef) => {
      setPackages(prev => [...prev, pkg]);
      db.savePackage(pkg); 
  };
  const handleUpdatePackage = (pkg: PackageDef) => {
      setPackages(prev => prev.map(p => p.id === pkg.id ? pkg : p));
      db.savePackage(pkg); 
  };
  const handleDeletePackage = (pkgId: string) => {
      setPackages(prev => prev.filter(p => p.id !== pkgId));
      db.deletePackage(pkgId); 
  };

  const handleUpdateGlobalConfig = (config: GlobalConfig) => {
      setGlobalConfig(config);
      db.saveConfig(config); 
  };

  const handleTopUp = (pkg: PackageDef) => {
    if (!currentUser) return;

    let updates: Partial<User> = {};

    if (pkg.credits === 'UNLIMITED') {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        updates.subscriptionPlan = pkg.id; 
        updates.subscriptionExpiry = nextYear.toISOString();
    } else {
        const currentCredits = currentUser.credits || 0;
        const addCredits = typeof pkg.credits === 'number' ? pkg.credits : 0;
        updates.credits = currentCredits + addCredits;
        updates.subscriptionPlan = pkg.id;
        updates.subscriptionExpiry = undefined;
    }

    const updatedUser = { ...currentUser, ...updates };
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser)); 
    db.saveUser(updatedUser); 
    
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

  // Notifications Logic
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

  // Filter requests
  const getVisibleRequests = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN' || currentUser.role === 'VERIFICATION_OFFICER') {
      return requests;
    }
    const myRequests = requests.filter(r => r.clientId === currentUser.id);
    return myRequests;
  };

  const getActiveRequest = () => requests.find(r => r.id === currentRequestId);

  if (loadingData) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Connecting to VerifiVUE Database...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return (
        <Login 
            onLogin={handleLogin} 
            availableUsers={allUsers}
            globalConfig={globalConfig}
        />
    );
  }

  const visibleRequests = getVisibleRequests();

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      <Sidebar 
        currentView={currentView} 
        onNavigate={navigate} 
        onSignOut={handleSignOut}
        user={currentUser}
        globalConfig={globalConfig}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* pt-24 ensures header doesn't overlap view content on mobile headers */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-24 md:pt-20 relative flex flex-col min-h-screen transition-all duration-300">
        {/* Top Header Bar with Notifications */}
        <div className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 flex justify-between items-center px-4 md:px-8 shadow-sm transition-all duration-300">
             
             {/* Mobile Menu Toggle */}
             <button 
                className="md:hidden text-slate-500 hover:text-slate-900 p-2 -ml-2"
                onClick={() => setIsSidebarOpen(true)}
             >
                <Menu className="w-6 h-6" />
             </button>

             <div className="flex-1"></div>

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
                    <div className="absolute right-0 top-12 w-[85vw] sm:w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
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
                        <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto">
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
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-sm font-medium truncate ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                        {n.title}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                        {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed mb-1.5 break-words">{n.message}</p>
                                                {n.type === 'success' && <div className="flex items-center text-[10px] text-green-600 font-medium"><CheckCircle className="w-3 h-3 mr-1"/> Success</div>}
                                                {n.type === 'error' && <div className="flex items-center text-[10px] text-red-600 font-medium"><AlertTriangle className="w-3 h-3 mr-1"/> Action Needed</div>}
                                                {n.type === 'warning' && <div className="flex items-center text-[10px] text-amber-600 font-medium"><AlertTriangle className="w-3 h-3 mr-1"/> Attention</div>}
                                            </div>
                                            {n.relatedRequestId && <ExternalLink className="w-3 h-3 text-slate-300 mt-1 shrink-0" />}
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
        <div className="max-w-7xl mx-auto flex-1 w-full relative">
          {currentView === 'dashboard' && (
            <Dashboard 
              navigate={navigate} 
              requests={visibleRequests} 
              user={currentUser}
              allUsers={allUsers}
              packages={packages}
              globalConfig={globalConfig}
            />
          )}
          
          {currentView === 'new-request' && (
            <NewRequest 
                navigate={navigate} 
                onSubmit={handleNewRequest} 
                user={currentUser}
                paymentConfig={paymentConfig}
                onTopUp={handleTopUp}
                packages={packages}
                globalConfig={globalConfig}
            />
          )}

          {currentView === 'request-detail' && (
            <RequestDetail 
                navigate={navigate} 
                request={getActiveRequest()} 
                user={currentUser}
                onUpdateRequest={handleUpdateRequest}
                allUsers={allUsers}
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
                globalConfig={globalConfig}
                onUpdateGlobalConfig={handleUpdateGlobalConfig}
                packages={packages}
                onAddPackage={handleAddPackage}
                onUpdatePackage={handleUpdatePackage}
                onDeletePackage={handleDeletePackage}
            />
          )}
        </div>
        
        {/* Global Copyright Footer */}
        <footer className="mt-auto py-6 text-center border-t border-slate-100 text-slate-400 text-sm px-4">
            {globalConfig.copyrightText}
        </footer>
      </main>
    </div>
  );
};

export default App;