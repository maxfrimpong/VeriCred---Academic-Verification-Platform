import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, Loader2, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { ViewProps, VerificationRequest, VerificationStatus, AIAnalysisResult, PackageDef, GlobalConfig } from '../types';
import { analyzeDocument } from '../services/geminiService';
import Pricing from './Pricing';

interface NewRequestProps extends ViewProps {
  onSubmit: (req: Omit<VerificationRequest, 'id' | 'clientId' | 'clientName'>) => void;
  packages?: PackageDef[];
  globalConfig?: GlobalConfig;
}

const NewRequest: React.FC<NewRequestProps> = ({ navigate, onSubmit, user, paymentConfig, onTopUp, packages, globalConfig }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | undefined>(undefined);
  
  // Form State
  const [formData, setFormData] = useState({
    candidateName: '',
    institution: '',
    degree: '',
    graduationYear: '',
    notes: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Credits Logic
  const hasEnterpriseAccess = user?.subscriptionPlan === 'ENTERPRISE' && 
    user.subscriptionExpiry && 
    new Date(user.subscriptionExpiry) > new Date();

  const isExempt = user?.role === 'ADMIN' || user?.role === 'VERIFICATION_OFFICER';

  const hasCredits = (user?.credits || 0) > 0;
  const canSubmit = hasEnterpriseAccess || hasCredits || isExempt;

  // Render Pricing if no credits and not exempt
  if (!canSubmit && user?.role === 'CLIENT' && paymentConfig && onTopUp) {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
             <div>
                <button 
                onClick={() => navigate('dashboard')}
                className="text-slate-500 hover:text-slate-900 mb-4 text-sm font-medium flex items-center gap-1"
                >
                ← Back to Dashboard
                </button>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 mb-8">
                    <div className="p-2 bg-amber-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-900">Insufficient Credits</h3>
                        <p className="text-amber-700 text-sm">You need to purchase a verification package to submit new requests.</p>
                    </div>
                </div>
                
                <Pricing 
                    onPurchase={onTopUp} 
                    paymentConfig={paymentConfig}
                    currentPlan={user.subscriptionPlan}
                    packages={packages}
                    currency={globalConfig?.currency}
                />
            </div>
        </div>
    );
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);

      // Convert to base64 for Gemini
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API
        const base64Data = base64String.split(',')[1];
        
        setIsAnalyzing(true);
        try {
          const result = await analyzeDocument(base64Data);
          setAiResult(result);
          setFormData(prev => ({
            ...prev,
            candidateName: result.extractedName || prev.candidateName,
            institution: result.extractedInstitution || prev.institution,
            degree: result.extractedDegree || prev.degree,
            graduationYear: result.extractedDate || prev.graduationYear,
            notes: result.authenticityNotes || ''
          }));
          setAnalysisDone(true);
        } catch (error) {
          console.error("Analysis failed", error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine initial status based on AI Analysis
    let initialStatus = VerificationStatus.Processing;
    let step2Status: 'current' | 'error' | 'completed' = 'current';
    let step2Desc = 'AI-powered initial document verification.';

    if (aiResult) {
        if (aiResult.confidenceScore < 80 || aiResult.isTampered) {
            initialStatus = VerificationStatus.ReviewRequired;
            step2Status = 'error';
            step2Desc = 'AI Verification Warning: Low confidence or tampering detected. Manual review required.';
        } else {
            // High confidence
            step2Desc = `AI Verification Passed (${aiResult.confidenceScore}%). Pending officer approval.`;
        }
    }

    const newReq: Omit<VerificationRequest, 'id' | 'clientId' | 'clientName'> = {
      candidateName: formData.candidateName,
      institution: formData.institution,
      degree: formData.degree,
      graduationYear: formData.graduationYear,
      status: initialStatus,
      submissionDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      documentUrl: preview || undefined,
      aiAnalysis: aiResult,
      timeline: [
        {
          id: '1',
          label: 'Request Submitted',
          description: 'Request received and logged in the system.',
          status: 'completed',
          date: 'Just now'
        },
        {
          id: '2',
          label: 'Document Analysis',
          description: step2Desc,
          status: step2Status,
        },
        {
          id: '3',
          label: 'Institution Outreach',
          description: 'Contacting the issuing institution for confirmation.',
          status: 'upcoming'
        },
        {
          id: '4',
          label: 'Final Verification',
          description: 'Final status update and report generation.',
          status: 'upcoming'
        }
      ]
    };
    onSubmit(newReq);
    navigate('dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <button 
          onClick={() => navigate('dashboard')}
          className="text-slate-500 hover:text-slate-900 mb-4 text-sm font-medium flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">New Verification Request</h1>
                <p className="text-slate-500 mt-2">Upload a document to auto-fill details or enter them manually.</p>
            </div>
            {/* Credit Display */}
            <div className="bg-indigo-50 px-4 py-2 rounded-lg text-indigo-700 text-sm font-medium border border-indigo-100">
                {isExempt ? 'Official Access' : hasEnterpriseAccess ? 'Enterprise Plan Active' : `Credits Remaining: ${user?.credits}`}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Upload */}
        <div className="md:col-span-1 space-y-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              preview ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-auto rounded-lg shadow-sm" />
                <button 
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setAnalysisDone(false);
                    setAiResult(undefined);
                    setFormData({ candidateName: '', institution: '', degree: '', graduationYear: '', notes: '' });
                  }}
                  className="absolute -top-2 -right-2 bg-white text-slate-500 hover:text-red-500 p-1 rounded-full shadow-md border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="text-sm font-semibold text-indigo-700 mt-2">Analyzing...</span>
                  </div>
                )}
                {analysisDone && (
                  <div className={`absolute bottom-2 left-2 right-2 text-xs font-semibold py-1.5 px-3 rounded-md flex items-center justify-center gap-2 backdrop-blur-sm shadow-sm ${
                      (aiResult?.confidenceScore || 0) < 80 
                      ? 'bg-amber-100/90 text-amber-800' 
                      : 'bg-green-100/90 text-green-800'
                  }`}>
                    <Sparkles className="w-3 h-3" />
                    {(aiResult?.confidenceScore || 0) < 80 ? 'Low Confidence' : 'AI Verified'}
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer py-8"
              >
                <div className="bg-white w-12 h-12 rounded-full shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Upload Document</h3>
                <p className="text-sm text-slate-500 mt-1 px-4">Drag and drop or click to select a PNG, JPG or PDF.</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 rounded-lg h-fit">
                 <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">AI-Powered Extraction</h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Our Gemini integration automatically scans uploaded documents to extract candidate details and verify authenticity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Candidate Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.candidateName}
                  onChange={e => setFormData({...formData, candidateName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Graduation Year/Date</label>
                <input 
                  type="text" 
                  value={formData.graduationYear}
                  onChange={e => setFormData({...formData, graduationYear: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. 2023"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Institution Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.institution}
                  onChange={e => setFormData({...formData, institution: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Stanford University"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Degree/Certificate Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.degree}
                  onChange={e => setFormData({...formData, degree: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Bachelor of Computer Science"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Additional Notes (Optional)</label>
                <textarea 
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Any specific instructions or context..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => navigate('dashboard')}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isExempt || hasEnterpriseAccess ? 'Submit Request' : 'Submit Request (Uses 1 Credit)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewRequest;