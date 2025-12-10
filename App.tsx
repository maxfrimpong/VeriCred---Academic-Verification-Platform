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

// Mock Initial Data - Used as fallback data
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

const INITIAL_USERS: User[] = [
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
    status: 'active'
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>();
  const [requests, setRequests] = useState<VerificationRequest[]>(INITIAL_REQUESTS);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS); 
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(INITIAL_PAYMENT_CONFIG);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = (view: ViewState, id?: string) => {
    setCurrentView(view);
    if (id) setCurrentRequestId(id);
    setShowNotifications(false);
    window.scrollTo(0,0);
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      navigate('dashboard');
  };

  const handleSignOut = async () => {
      setCurrentUser(null);
      setCurrentView('dashboard');
      setShowNotifications(false);
  };

  const handleNewRequest = async (req: Omit<VerificationRequest, 'id' | 'clientId' | 'clientName'>) => {
    if (!currentUser) return;
    
    // Check exemptions
    const isExempt = currentUser.role === 'ADMIN' || currentUser.role === 'VERIFICATION_OFFICER';

    // Deduct Credit if not Enterprise and not Exempt
    const isEnterprise = currentUser.subscriptionPlan === 'ENTERPRISE' && 
        currentUser.subscriptionExpiry && 
        new Date(currentUser.subscriptionExpiry) > new Date();

    if (!isEnterprise && !isExempt) {
        if (currentUser.credits <= 0) {
            alert("Insufficient credits.");
            return;
        }
        
        // Update user credits locally
        const newCredits = currentUser.credits - 1;
        const updatedUser = { ...currentUser, credits: newCredits };
        
        // Update in allUsers list
        setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
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

    // Notify
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
  };

  // User Management Handlers (Local State)
  const handleAddUser = (user: User) => {
    const newUser = { ...user, id: `user-${Date.now()}`, status: 'active' as const };
    setAllUsers(prev => [...prev, newUser]);
    
    // Auto login if it was a registration
    if (!currentUser) {
        handleLogin(newUser);
    } else {
        const newNotif: Notification = {
            id: `n-${Date.now()}`,
            userId: currentUser.id,
            title: 'User Created',
            message: `User ${user.name} (${user.role}) has been successfully created.`,
            type: 'success',
            timestamp: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleEditUser = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };

  const handleToggleUserStatus = (userId: string, currentStatus?: string) => {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  const handleDeleteUser = (userId: string) => {
     setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleTopUp = (pkg: PackageDef) => {
    if (!currentUser) return;

    let updates: Partial<User> = {};

    if (pkg.id === 'ENTERPRISE') {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        updates.subscriptionPlan = 'ENTERPRISE';
        updates.subscriptionExpiry = nextYear.toISOString();
    } else {
        const currentCredits = currentUser.credits || 0;
        const addCredits = typeof pkg.credits === 'number' ? pkg.credits : 0;
        updates.credits = currentCredits + addCredits;
        updates.subscriptionPlan = pkg.id as any;
        updates.subscriptionExpiry = undefined;
    }

    const updatedUser = { ...currentUser, ...updates };
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
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
            availableUsers={allUsers}
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