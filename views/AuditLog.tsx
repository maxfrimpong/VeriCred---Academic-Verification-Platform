import React from 'react';
import { ViewProps, VerificationRequest } from '../types';
import { Clock, FileText, Activity, ShieldCheck, UserCog, User } from 'lucide-react';

interface AuditLogItem {
  id: string;
  timestamp: string; // ISO String
  dateObj: Date;
  user: string;
  action: string;
  details: string;
  type: 'request' | 'system';
}

const AuditLog: React.FC<ViewProps> = ({ requests = [], allUsers = [] }) => {
  
  // Generate Audit Log dynamically from Requests & Users
  const logs: AuditLogItem[] = [];

  // 1. Add User Creation Logs (Mock based on user list)
  allUsers.forEach((u, idx) => {
    // Stagger dates slightly for demo
    const date = new Date();
    date.setDate(date.getDate() - (10 - idx));
    
    logs.push({
        id: `sys-user-${u.id}`,
        timestamp: date.toISOString(),
        dateObj: date,
        user: 'System Admin',
        action: 'User Created',
        details: `Created user ${u.name} (${u.role}) for ${u.organization}`,
        type: 'system'
    });
  });

  // 2. Add Request Logs from Timelines
  requests.forEach(req => {
    req.timeline.forEach(step => {
        // Use step.date if available, otherwise estimate based on submission
        let date = step.date ? new Date(step.date) : new Date(req.submissionDate);
        if (isNaN(date.getTime())) date = new Date(req.submissionDate); // Fallback

        // Determine user actor based on step
        let actor = req.clientName;
        if (step.id === '2' || step.id === '3') actor = 'System (AI)';
        if (step.id === '3' && step.status === 'completed') actor = 'Verification Officer';
        if (step.id === '4') actor = 'Verification Officer';

        if (step.status === 'completed' || step.status === 'error') {
            logs.push({
                id: `req-${req.id}-${step.id}`,
                timestamp: date.toISOString(),
                dateObj: date,
                user: actor,
                action: step.label,
                details: `${step.description} (Ref: ${req.id})`,
                type: 'request'
            });
        }
    });
  });

  // Sort by date descending
  logs.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Audit Log</h1>
        <p className="text-slate-500 mt-2">Comprehensive timeline of all system activities and verification events.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Actor</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {log.dateObj.toLocaleDateString()} <span className="text-xs opacity-70">{log.dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 font-medium text-slate-700">
                                    {log.user === 'System (AI)' ? <Activity className="w-4 h-4 text-purple-500" /> : 
                                     log.user === 'Verification Officer' ? <ShieldCheck className="w-4 h-4 text-indigo-500" /> :
                                     <User className="w-4 h-4 text-slate-400" />
                                    }
                                    {log.user}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                    log.type === 'system' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
                                }`}>
                                    {log.action}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 max-w-md truncate" title={log.details}>
                                {log.details}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;