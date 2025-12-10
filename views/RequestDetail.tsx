import React, { useState, useRef, ChangeEvent } from 'react';
import { VerificationRequest, VerificationStatus, ViewProps, User } from '../types';
import StatusStepper from '../components/StatusStepper';
import { Download, ShieldAlert, BadgeCheck, Building2, Calendar, FileText, AlertTriangle, CheckCircle, XCircle, RefreshCw, Mail, Upload, Sparkles, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { analyzeDocument } from '../services/geminiService';

interface RequestDetailProps extends ViewProps {
  request?: VerificationRequest;
}

const RequestDetail: React.FC<RequestDetailProps> = ({ request, navigate, user, onUpdateRequest, allUsers = [] }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isAddingStandardNote, setIsAddingStandardNote] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // State for Outreach Failure workflow
  const [isFailingOutreach, setIsFailingOutreach] = useState(false);
  const [outreachFailureReason, setOutreachFailureReason] = useState('');

  // Re-upload State
  const [isReuploading, setIsReuploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isOfficer = user?.role === 'VERIFICATION_OFFICER' || user?.role === 'ADMIN';
  const isClientOwner = user?.id === request.clientId;
  const isFinalized = request.status === VerificationStatus.Verified || request.status === VerificationStatus.Rejected;
  const clientUser = allUsers.find(u => u.id === request.clientId);

  // --- Client Re-upload Logic ---

  const handleReuploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUpdateRequest) {
        const file = e.target.files[0];
        setIsReuploading(true);

        const objectUrl = URL.createObjectURL(file);
        
        // 1. Read File
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];

            try {
                // 2. Analyze with Gemini
                const result = await analyzeDocument(base64Data);
                
                // 3. Update Request
                const updated = { ...request };
                updated.documentUrl = objectUrl;
                updated.aiAnalysis = result;
                updated.lastUpdated = new Date().toISOString();

                // 4. Determine Outcome based on AI
                if (result.confidenceScore >= 80 && !result.isTampered) {
                    // Success: Auto-advance to Institution Outreach
                    updated.status = VerificationStatus.InstitutionOutreach;
                    updated.timeline = updated.timeline.map(step => {
                        if (step.id === '2') return { ...step, status: 'completed', description: `Re-upload Verified by AI (Confidence: ${result.confidenceScore}%).`, date: new Date().toLocaleDateString() };
                        if (step.id === '3') return { ...step, status: 'current', description: 'Initiating contact with institution.' };
                        return step;
                    });
                } else {
                    // Fail: Send back to ReviewRequired
                    updated.status = VerificationStatus.ReviewRequired;
                    updated.timeline = updated.timeline.map(step => {
                        if (step.id === '2') return { ...step, status: 'error', description: `Re-upload AI Check Failed (${result.confidenceScore}%). Officer review required.` };
                        return step;
                    });
                }

                onUpdateRequest(updated);
            } catch (err) {
                console.error("Re-upload analysis failed", err);
                alert("Failed to analyze document. Please try again.");
            } finally {
                setIsReuploading(false);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  // --- Workflow Actions ---

  // Stage 1: Manual Verification Trigger (Officer)
  const handleRequestManualReview = () => {
    if (!onUpdateRequest) return;
    const updated = { ...request };
    updated.status = VerificationStatus.PendingClientAction;
    updated.manualVerificationRequested = true;
    updated.timeline = updated.timeline.map(step => {
      if (step.id === '2') { // Document Analysis
        return { ...step, status: 'error', description: 'Action Required: Client must upload a clearer document.' };
      }
      return step;
    });
    onUpdateRequest(updated);
  };

  // Stage 1: Complete Manual Verification (Officer)
  const handleCompleteManualVerification = () => {
    if (!onUpdateRequest) return;
    const updated = { ...request };
    updated.status = VerificationStatus.InstitutionOutreach; // Move to next stage
    updated.lastUpdated = new Date().toISOString();
    
    // Update timeline
    updated.timeline = updated.timeline.map(step => {
      if (step.id === '2') return { ...step, status: 'completed', description: 'Manual verification completed. Document valid.', date: new Date().toLocaleDateString() };
      if (step.id === '3') return { ...step, status: 'current', description: 'Initiating contact with institution.' };
      return step;
    });

    onUpdateRequest(updated);
  };

  // Stage 2: Mark Outreach Success
  const handleOutreachSuccess = () => {
    if (!onUpdateRequest) return;
    const updated = { ...request };
    updated.status = VerificationStatus.Processing; // Still processing finalization
    updated.verificationOutcome = 'SUCCESS';

    updated.timeline = updated.timeline.map(step => {
      if (step.id === '3') return { ...step, status: 'completed', description: 'Institution confirmed authenticity.', date: new Date().toLocaleDateString() };
      if (step.id === '4') return { ...step, status: 'current', description: 'Generating final report.' };
      return step;
    });

    onUpdateRequest(updated);
  };

  // Stage 2: Submit Outreach Failure (Direct Finalization)
  const submitOutreachFailure = () => {
    if (!onUpdateRequest) return;
    const updated = { ...request };
    updated.verificationOutcome = 'FAILURE';
    updated.status = VerificationStatus.Rejected;
    updated.finalReportNote = outreachFailureReason;
    updated.lastUpdated = new Date().toISOString();
    
    updated.timeline = updated.timeline.map(step => {
        if (step.id === '3') return { ...step, status: 'error', description: 'Institution failed to authenticate.', date: new Date().toLocaleDateString() };
        // Automatically complete the final step as well
        if (step.id === '4') return { ...step, status: 'completed', description: 'Credential Failed Verification', date: new Date().toLocaleDateString() };
        return step;
      });

    onUpdateRequest(updated);
    setIsFailingOutreach(false);
  };

  // Stage 3: Finalize Request (Used for Success path mostly now)
  const handleFinalizeRequest = () => {
    if (!onUpdateRequest) return;
    const updated = { ...request };
    updated.lastUpdated = new Date().toISOString();

    if (updated.verificationOutcome === 'SUCCESS') {
        updated.status = VerificationStatus.Verified;
        if (isAddingStandardNote) {
            updated.finalReportNote = `This submitted Academic credential has been successfully authenticated by the issuing Institution ${request.institution} as an original certificate issued to ${request.candidateName} on the ${request.graduationYear} and this confirms that ${request.candidateName} indeed attended the ${request.institution} and has passed all the prescribed examinations leading to the award of this academic credential.`;
        }
    } else {
        updated.status = VerificationStatus.Rejected;
        updated.finalReportNote = rejectReason;
    }

    updated.timeline = updated.timeline.map(step => {
        if (step.id === '4') return { ...step, status: 'completed', description: updated.status === VerificationStatus.Verified ? 'Credential Successfully Verified' : 'Credential Failed Verification', date: new Date().toLocaleDateString() };
        return step;
    });

    onUpdateRequest(updated);
  };

  // --- Reporting ---

  const handleDownloadReport = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Generate Report ID
      const now = new Date();
      const year = now.getFullYear();
      const dateTime = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
      // Extract sequence from request ID "REQ-YYYY-NNN" or default 0001
      const seqMatch = request.id.match(/-(\d+)$/);
      const sequence = seqMatch ? seqMatch[1].padStart(4, '0') : '0001';
      const reportId = `VFV-${year}:${dateTime}-${sequence}`;

      // --- Header ---
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Logo & Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text("VerifiVUE", 20, 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("SECURE ACADEMIC VERIFICATION", 20, 32);

      // --- QR Code ---
      // Direct deep link to this request view
      const verificationUrl = `${window.location.origin}${window.location.pathname}?view=request-detail&id=${request.id}`;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#000000', light: '#ffffff' } });
      
      // White box for QR
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth - 45, 8, 25, 25, 2, 2, 'F');
      doc.addImage(qrDataUrl, 'PNG', pageWidth - 43, 10, 21, 21);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("Scan to Validate", pageWidth - 43, 38);

      // --- Report Meta ---
      let yPos = 55;
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFontSize(10);
      doc.text(`REPORT ID: ${reportId}`, 20, yPos);
      doc.text(`GENERATED: ${now.toLocaleDateString().toUpperCase()}`, pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 8;
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.line(20, yPos, pageWidth - 20, yPos);

      // --- Status Section ---
      yPos += 12;
      
      let statusColor = [100, 116, 139]; // Slate 500
      if (request.status === VerificationStatus.Verified) statusColor = [22, 163, 74]; // Green 600
      if (request.status === VerificationStatus.Rejected) statusColor = [220, 38, 38]; // Red 600
      
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 24, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("VERIFICATION STATUS", 30, yPos + 8);
      doc.setFontSize(18);
      doc.text(request.status.toUpperCase(), 30, yPos + 18);

      // --- Client Details ---
      yPos += 35;
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("REQUESTING CLIENT", 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); 
      doc.text("Client Name:", 20, yPos);
      doc.text("Organization:", 80, yPos);
      doc.text("Email:", 140, yPos);

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      
      const cName = clientUser ? clientUser.name : request.clientName || 'N/A';
      const cOrg = clientUser ? clientUser.organization : 'N/A';
      const cEmail = clientUser ? clientUser.email : 'N/A';

      doc.text(cName, 20, yPos);
      doc.text(cOrg, 80, yPos);
      doc.text(cEmail, 140, yPos);

      // --- Candidate Details ---
      yPos += 20;
      doc.setTextColor(71, 85, 105); 
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("CANDIDATE DETAILS", 20, yPos);
      
      yPos += 8;
      // Background for details
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, yPos, pageWidth - 40, 45, 3, 3, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // Label color
      doc.text("Candidate Name:", 30, yPos + 12);
      doc.text("Institution:", 110, yPos + 12);
      doc.text("Degree:", 30, yPos + 32);
      doc.text("Graduation Year:", 110, yPos + 32);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Value color
      doc.text(request.candidateName, 30, yPos + 18);
      doc.text(request.institution, 110, yPos + 18);
      doc.text(request.degree, 30, yPos + 38);
      doc.text(request.graduationYear, 110, yPos + 38);

      // --- Verification Statement ---
      yPos += 55;
      
      if (request.finalReportNote) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229); // Indigo 600
        doc.text("OFFICIAL VERIFICATION STATEMENT", 20, yPos);
        yPos += 8;
        
        doc.setFont('courier', 'normal'); // Monospace for statement
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const splitNote = doc.splitTextToSize(request.finalReportNote, pageWidth - 40);
        doc.text(splitNote, 20, yPos);
        yPos += (splitNote.length * 5) + 10;
      } else {
         yPos += 10;
      }

      // --- AI Insights Summary ---
      if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(10);
      doc.text("DIGITAL FORENSICS SUMMARY", 20, yPos);
      yPos += 5;
      
      // Draw 2 boxes
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      
      // Confidence
      doc.roundedRect(20, yPos, 80, 20, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("AI CONFIDENCE SCORE", 25, yPos + 8);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${request.aiAnalysis?.confidenceScore ?? 0}%`, 25, yPos + 15);

      // Tampering
      doc.roundedRect(110, yPos, 80, 20, 2, 2, 'D');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("TAMPERING DETECTED", 115, yPos + 8);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const isTampered = request.aiAnalysis?.isTampered;
      doc.setTextColor(isTampered ? 220 : 22, isTampered ? 38 : 163, isTampered ? 38 : 74);
      doc.text(isTampered ? "YES" : "NO", 115, yPos + 15);

      // --- Footer ---
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text("Generated by VerifiVUE Platform - Confidential Document", pageWidth / 2, pageHeight - 6, { align: 'center' });

      // Save
      doc.save(`VerifiVUE_Report_${reportId}.pdf`);
    } catch (e) {
      console.error("PDF Generation Error", e);
      alert("Failed to generate PDF report.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const currentStep = request.timeline.find(s => s.status === 'current' || s.status === 'error');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
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
                {request.status === VerificationStatus.Rejected && (
                    <XCircle className="w-7 h-7 text-red-500" />
                )}
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {request.institution} 
                <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                <Calendar className="w-4 h-4" /> Class of {request.graduationYear}
            </p>
        </div>
        <div className="flex gap-3">
            {isFinalized && (
                <button 
                    onClick={handleDownloadReport}
                    disabled={isGeneratingPdf}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-wait"
                >
                    {isGeneratingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isGeneratingPdf ? 'Generating...' : 'PDF Report'}
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">

            {/* ACTION REQUIRED: CLIENT RE-UPLOAD */}
            {request.status === VerificationStatus.PendingClientAction && isClientOwner && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 animate-in slide-in-from-top-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900">Action Required: Upload Clearer Document</h3>
                            <p className="text-sm text-slate-600 mt-2 mb-4">
                                The verification officer or our AI system has requested a clearer copy of the credential. 
                                Please ensure the text is legible and the full document is visible.
                            </p>
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isReuploading}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                                >
                                    {isReuploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {isReuploading ? 'Analyzing...' : 'Upload New Document'}
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,.pdf"
                                    onChange={handleReuploadChange}
                                />
                                {isReuploading && <span className="text-sm text-amber-700 font-medium">Verifying with Gemini...</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* OFFICER CONTROL PANEL */}
            {isOfficer && request.status !== VerificationStatus.Verified && request.status !== VerificationStatus.Rejected && (
                <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert className="w-32 h-32" />
                    </div>
                    
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-400">
                        <ShieldAlert className="w-5 h-5" />
                        Officer Actions
                    </h3>
                    
                    <div className="relative z-10 space-y-6">
                        {/* Stage 1: Document Analysis Controls */}
                        {currentStep?.id === '2' && (
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <h4 className="font-semibold text-white mb-2">Stage: Document Analysis</h4>
                                
                                {request.status === VerificationStatus.PendingClientAction ? (
                                    <div>
                                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                                            <span>Waiting for client to upload clearer copy. (Offline step)</span>
                                        </div>
                                        <button 
                                            onClick={handleCompleteManualVerification}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                                        >
                                            Client Re-uploaded: Mark Verified
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                    <p className="text-slate-400 text-sm mb-4">
                                        Review the AI confidence score. If below 80% or distinct artifacts are found, trigger manual review.
                                    </p>
                                    <div className="flex gap-3">
                                        {(request.aiAnalysis?.confidenceScore || 0) < 80 && (
                                            <button 
                                                onClick={handleRequestManualReview}
                                                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" /> Request Manual Review
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleCompleteManualVerification}
                                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve Analysis
                                        </button>
                                    </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Stage 2: Institution Outreach Controls */}
                        {currentStep?.id === '3' && (
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <h4 className="font-semibold text-white mb-2">Stage: Institution Outreach</h4>
                                
                                {!isFailingOutreach ? (
                                    <>
                                        <p className="text-slate-400 text-sm mb-4">
                                            Contact {request.institution} via email or office visit. Verify student records.
                                        </p>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setIsFailingOutreach(true)}
                                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Mark Failed
                                            </button>
                                            <button 
                                                onClick={handleOutreachSuccess}
                                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Mark Authenticated
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-red-900/30 border border-red-800 p-3 rounded-lg text-red-400 text-sm">
                                            Please explain why the institution failed to authenticate this request. This will finalize the rejection.
                                        </div>
                                        <textarea 
                                            value={outreachFailureReason}
                                            onChange={(e) => setOutreachFailureReason(e.target.value)}
                                            placeholder="Enter reason for failure (e.g. 'Registrar confirmed no record of student')..."
                                            className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-red-500 outline-none placeholder:text-slate-500"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setIsFailingOutreach(false)}
                                                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={submitOutreachFailure}
                                                disabled={!outreachFailureReason}
                                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                                            >
                                                Confirm Failure & Finalize
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stage 3: Final Verification Controls */}
                        {currentStep?.id === '4' && (
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <h4 className="font-semibold text-white mb-2">Stage: Final Verification Report</h4>
                                
                                {request.verificationOutcome === 'SUCCESS' ? (
                                    <div className="space-y-4">
                                        <div className="bg-green-900/30 border border-green-800 p-3 rounded-lg text-green-400 text-sm">
                                            Authentication Successful. Prepare final report.
                                        </div>
                                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-colors border border-slate-700">
                                            <input 
                                                type="checkbox" 
                                                checked={isAddingStandardNote}
                                                onChange={(e) => setIsAddingStandardNote(e.target.checked)}
                                                className="mt-1 w-4 h-4 text-indigo-600 rounded bg-slate-700 border-slate-600 focus:ring-indigo-600 focus:ring-offset-slate-800"
                                            />
                                            <div className="text-sm text-slate-300">
                                                <span className="font-semibold text-white block mb-1">Add Standard Verification Statement</span>
                                                "This submitted Academic credential has been successfully authenticated by the issuing Institution..."
                                            </div>
                                        </label>
                                        <button 
                                            onClick={handleFinalizeRequest}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                                        >
                                            Finalize & Verify
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-red-900/30 border border-red-800 p-3 rounded-lg text-red-400 text-sm">
                                            Authentication Failed. Provide reason for rejection.
                                        </div>
                                        <textarea 
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Explain the exact reason for the failed verification..."
                                            className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-red-500 outline-none placeholder:text-slate-500"
                                        />
                                        <button 
                                            onClick={handleFinalizeRequest}
                                            disabled={!rejectReason}
                                            className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                                        >
                                            Finalize Rejection
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tracker */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Verification Progress</h3>
                <StatusStepper steps={request.timeline} />
            </div>

            {/* AI Insights Card */}
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
                                <div className={`text-2xl font-bold mt-1 ${(request.aiAnalysis?.confidenceScore || 0) < 80 ? 'text-amber-600' : 'text-slate-900'}`}>
                                    {request.aiAnalysis?.confidenceScore ?? 'N/A'}%
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tampering Detected</span>
                                <div className={`text-2xl font-bold mt-1 ${request.aiAnalysis?.isTampered ? 'text-red-600' : 'text-green-600'}`}>
                                    {request.aiAnalysis?.isTampered ? 'Yes' : 'None'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Final Report Notes Display */}
            {(request.status === VerificationStatus.Verified || request.status === VerificationStatus.Rejected) && request.finalReportNote && (
                 <div className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Official Verification Statement</h3>
                    <p className="text-slate-700 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-1">
                        "{request.finalReportNote}"
                    </p>
                 </div>
            )}
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
                        <span className="font-medium text-slate-900">{request.clientName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium text-slate-900">{new Date(request.submissionDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;