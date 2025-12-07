import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import NewRequest from './views/NewRequest';
import RequestDetail from './views/RequestDetail';
import { ViewState, VerificationRequest, VerificationStatus } from './types';

// Mock Initial Data
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
    timeline: [
        { id: '1', label: 'Request Submitted', description: 'Request received.', status: 'completed', date: 'May 15' },
        { id: '2', label: 'Document Analysis', description: 'AI verification passed.', status: 'completed', date: 'May 15' },
        { id: '3', label: 'Institution Outreach', description: 'Registrar confirmed.', status: 'completed', date: 'May 17' },
        { id: '4', label: 'Final Verification', description: 'Verified successfully.', status: 'completed', date: 'May 18' }
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
    timeline: [
        { id: '1', label: 'Request Submitted', description: 'Request received.', status: 'completed', date: 'May 20' },
        { id: '2', label: 'Document Analysis', description: 'AI analysis in progress.', status: 'current' },
        { id: '3', label: 'Institution Outreach', description: 'Pending analysis.', status: 'upcoming' },
        { id: '4', label: 'Final Verification', description: 'Pending.', status: 'upcoming' }
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
    timeline: [
        { id: '1', label: 'Request Submitted', description: 'Request received.', status: 'completed', date: 'May 19' },
        { id: '2', label: 'Document Analysis', description: 'Low confidence score. Human review needed.', status: 'error', date: 'May 19' },
        { id: '3', label: 'Institution Outreach', description: 'On hold.', status: 'upcoming' },
        { id: '4', label: 'Final Verification', description: 'Pending.', status: 'upcoming' }
    ]
  },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>();
  const [requests, setRequests] = useState<VerificationRequest[]>(INITIAL_REQUESTS);

  const navigate = (view: ViewState, id?: string) => {
    setCurrentView(view);
    if (id) setCurrentRequestId(id);
    window.scrollTo(0,0);
  };

  const handleNewRequest = (req: Omit<VerificationRequest, 'id'>) => {
    const newId = `REQ-2024-${String(requests.length + 1).padStart(3, '0')}`;
    const newRequest = { ...req, id: newId };
    setRequests([newRequest, ...requests]);
  };

  const getActiveRequest = () => requests.find(r => r.id === currentRequestId);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onNavigate={navigate} />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard navigate={navigate} requests={requests} />
          )}
          
          {currentView === 'new-request' && (
            <NewRequest navigate={navigate} onSubmit={handleNewRequest} />
          )}

          {currentView === 'request-detail' && (
            <RequestDetail navigate={navigate} request={getActiveRequest()} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;