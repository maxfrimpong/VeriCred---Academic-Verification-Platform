import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Search, Filter, ExternalLink, MoreHorizontal, 
  ArrowUpRight, Clock, CheckCircle2, XCircle, DollarSign, Calendar
} from 'lucide-react';
import { VerificationRequest, VerificationStatus, ViewProps, PackageDef, User, GlobalConfig } from '../types';

interface DashboardProps extends ViewProps {
  requests: VerificationRequest[];
  allUsers?: User[];
  packages?: PackageDef[];
  globalConfig?: GlobalConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ requests, navigate, user, allUsers = [], packages = [], globalConfig }) => {
  // Calculated stats
  const total = requests.length;
  const verified = requests.filter(r => r.status === VerificationStatus.Verified).length;
  const pending = requests.filter(r => 
    r.status === VerificationStatus.Pending || 
    r.status === VerificationStatus.Processing ||
    r.status === VerificationStatus.ReviewRequired
  ).length;

  const isAdmin = user?.role === 'ADMIN';

  // State for Revenue Date Filter
  const [revenueFilter, setRevenueFilter] = useState<'7d' | '30d' | 'ytd'>('30d');

  const currencySymbol = globalConfig?.currency === 'GHS' ? '₵' : '$';

  // --- REVENUE CALCULATION MOCK LOGIC ---
  // Since we don't have a transaction table, we simulate revenue based on users having a subscription plan.
  // We randomly assign a "purchase date" to each user with a plan for the sake of the chart.
  const revenueData = useMemo(() => {
      if (!isAdmin) return [];

      const today = new Date();
      const data: { name: string; revenue: number }[] = [];
      const periodMap = { '7d': 7, '30d': 30, 'ytd': 365 };
      const days = periodMap[revenueFilter];

      // Initialize chart buckets (days)
      for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const label = days > 60 
            ? d.toLocaleDateString(undefined, { month: 'short' }) // Group by month for YTD (simplified here to daily for demo)
            : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
          
          // Simplified: In a real YTD, we'd aggregate by month, but keeping it simple for now.
          if (days > 90 && i % 30 !== 0) continue; // Skip days for long periods to clean up axis

          data.push({ name: label, revenue: 0 });
      }

      // Simulate transactions
      allUsers.forEach((u, idx) => {
          if (u.role === 'CLIENT' && u.subscriptionPlan) {
              const pkg = packages.find(p => p.id === u.subscriptionPlan);
              if (pkg) {
                  // Deterministically fake a date based on user ID char code so it doesn't change on render
                  const fakeDayOffset = (u.id.charCodeAt(u.id.length - 1) * idx) % days; 
                  const d = new Date(today);
                  d.setDate(d.getDate() - fakeDayOffset);
                  
                  // Find bucket
                  const label = days > 60 
                     ? d.toLocaleDateString(undefined, { month: 'short' })
                     : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
                     
                  const bucket = data.find(item => item.name === label); // Simple find, real world uses better matching
                  if (bucket) {
                      bucket.revenue += pkg.price;
                  } else if(data.length > 0) {
                      // fallback for YTD simplification logic above
                      data[Math.floor(Math.random() * data.length)].revenue += pkg.price;
                  }
              }
          }
      });
      return data;
  }, [allUsers, packages, revenueFilter, isAdmin]);

  const totalRevenue = useMemo(() => revenueData.reduce((acc, curr) => acc + curr.revenue, 0), [revenueData]);

  // --- CLIENT SUBSCRIPTION STATS ---
  const clientSubStats = useMemo(() => {
      if (!isAdmin) return [];
      const stats = packages.map(pkg => {
          const count = allUsers.filter(u => u.role === 'CLIENT' && u.subscriptionPlan === pkg.id).length;
          return { name: pkg.name, value: count };
      });
      // Add 'No Plan' or 'Pay As You Go' (users with credits but no subscription ID matches or ID is not in package list)
      const payg = allUsers.filter(u => u.role === 'CLIENT' && (!u.subscriptionPlan || !packages.find(p => p.id === u.subscriptionPlan))).length;
      if (payg > 0) stats.push({ name: 'Pay As You Go', value: payg });
      return stats;
  }, [allUsers, packages, isAdmin]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const chartData = [
    { name: 'Mon', verifications: 4 },
    { name: 'Tue', verifications: 7 },
    { name: 'Wed', verifications: 5 },
    { name: 'Thu', verifications: 12 },
    { name: 'Fri', verifications: 9 },
    { name: 'Sat', verifications: 3 },
    { name: 'Sun', verifications: 2 },
  ];

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.Verified:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1"/> Verified</span>;
      case VerificationStatus.Processing:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1 animate-spin"/> Processing</span>;
      case VerificationStatus.Pending:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1"/> Pending</span>;
      case VerificationStatus.ReviewRequired:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Review</span>;
      case VerificationStatus.Rejected:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Draft</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isAdmin ? 'Admin Dashboard' : 'Client Dashboard'}
          </h1>
          <p className="text-slate-500 mt-2">
            {isAdmin 
              ? 'Overview of all verification activities across the platform.' 
              : 'Overview of your verification requests and activities.'}
          </p>
        </div>
        <button 
          onClick={() => navigate('new-request')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          New Verification
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">{isAdmin ? 'Global Requests' : 'Your Requests'}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{total}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <ExternalLink className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span className="font-medium">+12%</span>
            <span className="text-slate-400 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Actions</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{pending}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500">
            <span>Requires attention</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Verified Candidates</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{verified}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">98.5%</span>
            <span className="text-slate-400 ml-1">accuracy rate</span>
          </div>
        </div>
      </div>
    
      {/* ADMIN ONLY REVENUE SECTION */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Subscription Revenue</h2>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">{currencySymbol}{totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                        <button onClick={() => setRevenueFilter('7d')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${revenueFilter === '7d' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>7 Days</button>
                        <button onClick={() => setRevenueFilter('30d')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${revenueFilter === '30d' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>30 Days</button>
                        <button onClick={() => setRevenueFilter('ytd')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${revenueFilter === 'ytd' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>YTD</button>
                    </div>
                </div>
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value) => [`${currencySymbol}${value}`, 'Revenue']} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Clients by Subscription</h2>
                <div className="flex-1 min-h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={clientSubStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {clientSubStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Requests</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-48"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  {isAdmin && <th className="px-6 py-4">Client</th>}
                  <th className="px-6 py-4">Institution</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr 
                    key={request.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => navigate('request-detail', request.id)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{request.candidateName}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-indigo-600 font-medium text-xs">
                        {request.clientName}
                      </td>
                    )}
                    <td className="px-6 py-4 text-slate-600">{request.institution}</td>
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(request.submissionDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <MoreHorizontal className="w-5 h-5 text-slate-300 group-hover:text-slate-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Activity Volume</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar 
                  dataKey="verifications" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;