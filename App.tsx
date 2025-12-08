import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import NewRequest from './views/NewRequest';
import RequestDetail from './views/RequestDetail';
import Settings from './views/Settings';
import Clients from './views/Clients';
import AuditLog from './views/AuditLog';
import Login from './views/Login';
import { ViewState, VerificationRequest, VerificationStatus, User, Notification } from './types';
import { Bell, X, Check, Info, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

// Mock Initial Data with Client Ownership
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
  {
    id: 'REQ-2024-002',
    candidateName: 'Michael Chen',
    institution: 'Georgia Institute of Technology',
    degree: 'M.S. Cybersecurity',
    graduationYear: '2022',
    status: VerificationStatus.Processing,
    submissionDate: '2024-05-20T09:15:00Z',
    lastUpdated: '2024-05-20T09:20:00Z',
    clientId: 'client-2',
    clientName: 'Acme Corp',
    timeline: [
        { id: '1', label: 'Request Submitted', description: 'Request received.', status: 'completed', date: 'May 20, 2024' },
        { id: '2', label: 'Document Analysis', description: 'AI analysis in progress...', status: 'current' },
        { id: '3', label: 'Institution Outreach', description: 'Pending analysis completion.', status: 'upcoming' },
        { id: '4', label: 'Final Verification', description: 'Pending.', status: 'upcoming' }
    ]
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Sarah Connor',
    email: 'admin@vericred.com',
    role: 'ADMIN',
    organization: 'VeriCred HQ',
    password: 'admin'
  },
  {
    id: 'client-1',
    name: 'Alex Morgan',
    email: 'alex@techglobal.com',
    role: 'CLIENT',
    organization: 'TechGlobal Inc.',
    password: 'client'
  },
  {
    id: 'officer-1',
    name: 'James Gordon',
    email: 'officer@vericred.com',
    role: 'VERIFICATION_OFFICER',
    organization: 'VeriCred Operations',
    password: 'officer'
  },
  {
    id: 'client-2',
    name: 'David Liu',
    email: 'david@acme.com',
    role: 'CLIENT',
    organization: 'Acme Corp',
    password: 'client'
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>();
  const [requests, setRequests] = useState<VerificationRequest[]>(INITIAL_REQUESTS);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = (view: ViewState, id?: string) => {
    setCurrentView(view);
    if (id) setCurrentRequestId(id);
    setShowNotifications(false);
    window.scrollTo(0,0);
  };

  const handleNewRequest = (req: Omit<VerificationRequest, 'id' | 'clientId' | 'clientName'>) => {
    if (!currentUser) return;
    
    const newId = `REQ-2024-${String(requests.length + 1).padStart(3, '0')}`;
    const newRequest: VerificationRequest = { 
      ...req, 
      id: newId,
      clientId: currentUser.id,
      clientName: currentUser.organization
    };
    setRequests([newRequest, ...requests]);

    // Notify Officers/Admins
    const officers = allUsers.filter(u => u.role === 'ADMIN' || u.role === 'VERIFICATION_OFFICER');
    const newNotifs: Notification[] = officers.map(o => ({
        id: `n-${Date.now()}-${o.id}`,
        userId: o.id,
        title: 'New Request Received',
        message: `${currentUser.organization} submitted a verification request for ${req.candidateName}.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
        relatedRequestId: newId
    }));
    setNotifications(prev => [...newNotifs, ...prev]);
  };

  const handleUpdateRequest = (updatedRequest: VerificationRequest) => {
    // Check for status changes to trigger notifications
    const oldReq = requests.find(r => r.id === updatedRequest.id);
    
    if (oldReq && oldReq.status !== updatedRequest.status) {
        // Prepare notification for the client
        const clientId = updatedRequest.clientId;
        let title = "Verification Update";
        let message = `Your request ${updatedRequest.id} status has been updated.`;
        let type: 'info' | 'success' | 'warning' | 'error' = 'info';

        switch (updatedRequest.status) {
            case VerificationStatus.Verified:
                title = "Verification Successful";
                message = `Great news! The credentials for ${updatedRequest.candidateName} have been verified.`;
                type = 'success';
                break;
            case VerificationStatus.Rejected:
                title = "Verification Failed";
                message = `The verification for ${updatedRequest.candidateName} was rejected. Please check the report.`;
                type = 'error';
                break;
            case VerificationStatus.InstitutionOutreach:
                title = "Institution Outreach";
                message = `We are now contacting ${updatedRequest.institution} to verify records.`;
                type = 'info';
                break;
            case VerificationStatus.PendingClientAction:
                title = "Action Required";
                message = `We need more information or a clearer document for ${updatedRequest.candidateName}.`;
                type = 'warning';
                break;
            case VerificationStatus.Processing:
                title = "Processing Started";
                message = `Manual review for ${updatedRequest.candidateName} has begun.`;
                type = 'info';
                break;
        }

        const newNotif: Notification = {
            id: `n-${Date.now()}`,
            userId: clientId,
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false,
            relatedRequestId: updatedRequest.id
        };

        setNotifications(prev => [newNotif, ...prev]);
    }

    setRequests(prevRequests => 
      prevRequests.map(req => req.id === updatedRequest.id ? updatedRequest : req)
    );
  };

  // User Management Handlers
  const handleAddUser = (user: User) => {
    setAllUsers(prev => [...prev, user]);
  };

  const handleEditUser = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
    setShowNotifications(false);
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
    return requests.filter(r => r.clientId === currentUser.id);
  };

  const getActiveRequest = () => requests.find(r => r.id === currentRequestId);

  if (!currentUser) {
    return <Login onLogin={handleLogin} availableUsers={allUsers} />;
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
            <NewRequest navigate={navigate} onSubmit={handleNewRequest} />
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
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;