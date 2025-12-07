import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { VerificationStep } from '../types';

interface StatusStepperProps {
  steps: VerificationStep[];
}

const StatusStepper: React.FC<StatusStepperProps> = ({ steps }) => {
  return (
    <div className="relative">
      {/* Connector Line */}
      <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200" />

      <div className="space-y-8 relative">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isError = step.status === 'error';

          return (
            <div key={step.id} className="flex gap-4 group">
              {/* Icon Bubble */}
              <div 
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isCompleted ? 'bg-green-500 border-green-100 text-white' :
                  isCurrent ? 'bg-indigo-600 border-indigo-100 text-white ring-2 ring-indigo-500 ring-offset-2' :
                  isError ? 'bg-red-500 border-red-100 text-white' :
                  'bg-white border-slate-200 text-slate-300'
                }`}
              >
                {isCompleted ? <Check className="w-6 h-6" /> :
                 isError ? <AlertCircle className="w-6 h-6" /> :
                 isCurrent ? <Clock className="w-6 h-6 animate-pulse" /> :
                 <span className="text-sm font-semibold">{index + 1}</span>}
              </div>

              {/* Content */}
              <div className={`pt-1 flex-1 ${isCurrent ? 'opacity-100' : 'opacity-80'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className={`text-base font-semibold ${
                            isCompleted ? 'text-slate-900' : 
                            isCurrent ? 'text-indigo-700' : 'text-slate-500'
                        }`}>
                        {step.label}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-md">{step.description}</p>
                    </div>
                    {step.date && (
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                            {step.date}
                        </span>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusStepper;