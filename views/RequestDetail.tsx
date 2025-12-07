import React from 'react';
import { VerificationRequest, VerificationStatus, ViewProps } from '../types';
import StatusStepper from '../components/StatusStepper';
import { Download, ShieldAlert, BadgeCheck, Building2, Calendar, FileText } from 'lucide-react';

interface RequestDetailProps extends ViewProps {
  request?: VerificationRequest;
}

const RequestDetail: React.FC<RequestDetailProps> = ({ request, navigate }) => {
  if (!request) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-900">Request not found</h2>
        <button onClick={() => navigate('dashboard')} className="text-indigo-600 mt-4 hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <button 
                    onClick={() => navigate('dashboard')} 
                    className="text-slate-400 hover:text-slate-600 text-sm font-medium"
                >
                    Requests
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 text-sm font-medium">{request.id}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                {request.candidateName}
                {request.status === VerificationStatus.Verified && (
                <BadgeCheck className="w-7 h-7 text-green-500" />
                )}
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {request.institution} 
                <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                <Calendar className="w-4 h-4" /> Class of {request.graduationYear}
            </p>
        </div>
        <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2 shadow-sm">
                <Download className="w-4 h-4" />
                Report
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md shadow-indigo-200">
                Contact Support
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Progress & Details */}
        <div className="lg:col-span-2 space-y-8">
            {/* Tracker */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Verification Progress</h3>
                <StatusStepper steps={request.timeline} />
            </div>

            {/* AI Insights Card (Simulated) */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-sm border border-indigo-100 p-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                        <ShieldAlert className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">AI Document Analysis</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Gemini has analyzed the submitted document for authenticity markers.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence Score</span>
                                <div className="text-2xl font-bold text-slate-900 mt-1">98.5%</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tampering Detected</span>
                                <div className="text-2xl font-bold text-green-600 mt-1">None</div>
                            </div>
                        </div>

                        <div className="mt-4 bg-white p-4 rounded-lg border border-indigo-50 text-sm text-slate-600">
                            <strong>Note:</strong> Document layout matches standard templates for {request.institution}. Fonts and seals appear consistent with expected patterns for the year {request.graduationYear}.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Document & Info */}
        <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Submitted Document</h3>
                <div className="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                    {request.documentUrl ? (
                        <img 
                            src={request.documentUrl} 
                            alt="Credential" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-center p-6">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No document preview available</p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm">
                            View Fullscreen
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Request Details</h3>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-50">
                        <span className="text-slate-500">Request ID</span>
                        <span className="font-mono text-slate-700">{request.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                        <span className="text-slate-500">Submitted By</span>
                        <span className="font-medium text-slate-900">HR Manager</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium text-slate-900">{new Date(request.submissionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                        <span className="text-slate-500">Priority</span>
                        <span className="font-medium text-indigo-600">Standard</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;