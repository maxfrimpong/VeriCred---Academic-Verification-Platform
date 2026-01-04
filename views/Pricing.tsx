import React, { useState } from 'react';
import { PackageDef, PaymentConfig, User } from '../types';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface PricingProps {
  onPurchase: (pkg: PackageDef) => void;
  paymentConfig: PaymentConfig;
  currentPlan?: string;
  packages?: PackageDef[];
  currency?: 'USD' | 'GHS';
  user?: User;
}

declare const PaystackPop: any;

const Pricing: React.FC<PricingProps> = ({ onPurchase, paymentConfig, currentPlan, packages = [], currency = 'USD', user }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currencySymbol = currency === 'GHS' ? '₵' : '$';

  const handleBuy = (pkg: PackageDef) => {
    setError(null);
    setProcessingId(pkg.id);

    // Check if using Paystack and if keys are available
    if (paymentConfig.activeGateway === 'PAYSTACK') {
      const publicKey = paymentConfig.keys.paystack.publicKey;
      
      if (!publicKey || publicKey.trim() === '') {
        setError("Paystack Public Key is not configured. Please contact administration.");
        setProcessingId(null);
        return;
      }

      try {
        const handler = PaystackPop.setup({
          key: publicKey,
          email: user?.email || 'customer@example.com',
          amount: pkg.price * 100, // Paystack expects amount in subunits (kobo/cents)
          currency: currency === 'GHS' ? 'GHS' : 'USD',
          ref: `VFV-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          metadata: {
            custom_fields: [
              {
                display_name: "Package Name",
                variable_name: "package_name",
                value: pkg.name
              },
              {
                display_name: "Credits",
                variable_name: "credits",
                value: String(pkg.credits)
              }
            ]
          },
          callback: function(response: any) {
            // Payment successful
            onPurchase(pkg);
            setProcessingId(null);
          },
          onClose: function() {
            setProcessingId(null);
          }
        });
        handler.openIframe();
      } catch (e) {
        console.error("Paystack Initialization Error", e);
        setError("Failed to initialize payment gateway. Please check your internet connection.");
        setProcessingId(null);
      }
      return;
    }

    // Fallback Mock for other gateways not yet fully implemented
    setTimeout(() => {
      const confirmed = window.confirm(
        `Mock Payment Gateway (${paymentConfig.activeGateway}):\n\n` +
        `Processing payment of ${currencySymbol}${pkg.price} for ${pkg.name} package.\n\n` +
        `Click OK to simulate successful payment.`
      );

      if (confirmed) {
        onPurchase(pkg);
      }
      setProcessingId(null);
    }, 1500);
  };

  const getGatewayColor = () => {
    switch(paymentConfig.activeGateway) {
        case 'PAYSTACK': return 'bg-emerald-500 hover:bg-emerald-600';
        case 'PAYPAL': return 'bg-blue-600 hover:bg-blue-700';
        case 'STRIPE': return 'bg-indigo-600 hover:bg-indigo-700';
        default: return 'bg-slate-900';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900">Choose Your Plan</h2>
        <p className="text-slate-500 mt-2">Select a verification package that suits your organization's needs.</p>
        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
            <CreditCard className="w-3 h-3" />
            Secure payment via {paymentConfig.activeGateway}
        </div>
        
        {error && (
            <div className="mt-4 max-w-md mx-auto p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {packages.map((pkg) => {
            const isEnterprise = pkg.credits === 'UNLIMITED';
            const isCurrent = currentPlan === pkg.id;

            return (
                <div 
                    key={pkg.id} 
                    className={`relative bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md flex flex-col
                        ${isEnterprise ? 'border-indigo-200 ring-4 ring-indigo-50/50' : 'border-slate-200'}
                    `}
                >
                    {isEnterprise && (
                        <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500 rounded-t-2xl" />
                    )}
                    
                    <div className="p-6 flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                        <p className="text-slate-500 text-sm mt-1 min-h-[40px]">{pkg.description}</p>
                        
                        <div className="mt-6 flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-slate-900">{currencySymbol}{pkg.price}</span>
                            {isEnterprise && <span className="text-slate-500 text-sm">/year</span>}
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="font-medium">
                                    {isEnterprise ? 'Unlimited Verifications' : `${pkg.credits} Verification Credits`}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <ShieldCheck className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                <span>AI + Manual Review</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <CheckCircle2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                <span>Official PDF Reports</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 pt-0 mt-auto">
                        <button
                            onClick={() => handleBuy(pkg)}
                            disabled={!!processingId}
                            className={`w-full py-3 px-4 rounded-xl font-medium text-white shadow-sm transition-all flex items-center justify-center gap-2
                                ${processingId === pkg.id ? 'bg-slate-400 cursor-wait' : getGatewayColor()}
                            `}
                        >
                            {processingId === pkg.id ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                </>
                            ) : (
                                `Buy ${pkg.name}`
                            )}
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default Pricing;