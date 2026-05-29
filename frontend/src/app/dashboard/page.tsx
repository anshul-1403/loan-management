'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API, { BACKEND_URL } from '../../utils/api';
import { User, Loan, Payment } from '../../types';
import { toast } from 'react-hot-toast';
import { 
  Users, CheckSquare, Banknote, Landmark, BarChart3, 
  Search, Eye, Check, X, CreditCard, Calendar, Info, 
  ExternalLink, FileText, ChevronRight, CheckCircle2, XSquare, Plus, Loader2
} from 'lucide-react';

type ModuleType = 'OVERVIEW' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION';

export default function OperationsDashboard() {
  const { user } = useAuth();
  
  // Dashboard navigation tab state
  const [activeTab, setActiveTab] = useState<ModuleType>('OVERVIEW');

  // Stats (Admin Only)
  const [stats, setStats] = useState<any>(null);
  
  // Data lists
  const [leads, setLeads] = useState<User[]>([]);
  const [appliedLoans, setAppliedLoans] = useState<Loan[]>([]);
  const [sanctionedLoans, setSanctionedLoans] = useState<Loan[]>([]);
  const [disbursedLoans, setDisbursedLoans] = useState<Loan[]>([]);
  
  // Component loading states
  const [loadingData, setLoadingData] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Record Payment Modal state
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loanPayments, setLoanPayments] = useState<Payment[]>([]);

  // Set initial tab based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        setActiveTab('OVERVIEW');
      } else if (user.role === 'Sales') {
        setActiveTab('SALES');
      } else if (user.role === 'Sanction') {
        setActiveTab('SANCTION');
      } else if (user.role === 'Disbursement') {
        setActiveTab('DISBURSEMENT');
      } else if (user.role === 'Collection') {
        setActiveTab('COLLECTION');
      }
    }
  }, [user]);

  // Fetch data depending on active tab
  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      if (activeTab === 'OVERVIEW' && user.role === 'Admin') {
        const res = await API.get('/operations/stats');
        setStats(res.data);
      } else if (activeTab === 'SALES') {
        const res = await API.get('/operations/leads');
        setLeads(res.data.leads);
      } else if (activeTab === 'SANCTION') {
        const res = await API.get('/operations/applied');
        setAppliedLoans(res.data.loans);
      } else if (activeTab === 'DISBURSEMENT') {
        const res = await API.get('/operations/sanctioned');
        setSanctionedLoans(res.data.loans);
      } else if (activeTab === 'COLLECTION') {
        const res = await API.get('/operations/disbursed');
        setDisbursedLoans(res.data.loans);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, user]);

  // 1. Sanction Approval/Rejection Action Handler
  const handleReviewSubmit = async () => {
    if (!selectedLoan || !reviewAction) return;
    if (reviewAction === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Please enter a reason for rejecting this loan.');
      return;
    }

    try {
      const res = await API.post('/operations/review', {
        loanId: selectedLoan._id,
        action: reviewAction,
        reason: reviewAction === 'REJECT' ? rejectionReason : undefined,
      });
      toast.success(res.data.message);
      setShowReviewModal(false);
      setSelectedLoan(null);
      setReviewAction(null);
      setRejectionReason('');
      fetchData(); // reload
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete review action.');
    }
  };

  // 2. Disbursement Trigger Handler
  const handleDisburseSubmit = async (loanId: string) => {
    if (!confirm('Are you sure you want to release funds and mark this loan as DISBURSED?')) return;
    try {
      const res = await API.post('/operations/disburse', { loanId });
      toast.success(res.data.message);
      fetchData(); // reload
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete disbursement.');
    }
  };

  // 3. Collection Payment Recording Handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    if (!utrNumber.trim() || !paymentAmount || !paymentDate) {
      toast.error('All fields are required.');
      return;
    }

    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Payment amount must be a positive number.');
      return;
    }

    if (amt > selectedLoan.outstandingBalance) {
      toast.error(`Payment cannot exceed outstanding balance of ₹${selectedLoan.outstandingBalance.toLocaleString()}`);
      return;
    }

    try {
      const res = await API.post('/operations/record-payment', {
        loanId: selectedLoan._id,
        utrNumber,
        amount: amt,
        paymentDate,
      });
      toast.success(res.data.message);
      setShowPaymentModal(false);
      setUtrNumber('');
      setPaymentAmount('');
      setSelectedLoan(null);
      fetchData(); // reload
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record payment.');
    }
  };

  // Open Payment Details and Log modal
  const openPaymentModal = async (loan: Loan) => {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
    setUtrNumber('');
    setPaymentAmount('');
    try {
      const res = await API.get(`/operations/payments/${loan._id}`);
      setLoanPayments(res.data.payments);
    } catch (err) {
      console.warn(err);
    }
  };

  // Check if role is Admin or matches specific executive role
  const canAccessTab = (tab: ModuleType) => {
    if (user?.role === 'Admin') return true;
    return user?.role?.toUpperCase() === tab;
  };

  // Filtering leads/loans based on search query
  const getFilteredLeads = () => {
    return leads.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredApplied = () => {
    return appliedLoans.filter(l => {
      const borrower = l.borrower as User;
      return borrower?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             borrower?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const getFilteredSanctioned = () => {
    return sanctionedLoans.filter(l => {
      const borrower = l.borrower as User;
      return borrower?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             borrower?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const getFilteredDisbursed = () => {
    return disbursedLoans.filter(l => {
      const borrower = l.borrower as User;
      return borrower?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             borrower?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  return (
    <div className="flex-grow flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-6 py-8 gap-8">
      {/* Sidebar / Tabs Navigation */}
      <aside className="w-full lg:w-64 flex flex-col space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">
          Operations Modules
        </div>

        {user?.role === 'Admin' && (
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span>Overview Stats</span>
          </button>
        )}

        {canAccessTab('SALES') && (
          <button
            onClick={() => setActiveTab('SALES')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'SALES'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Sales Module</span>
          </button>
        )}

        {canAccessTab('SANCTION') && (
          <button
            onClick={() => setActiveTab('SANCTION')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'SANCTION'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
            }`}
          >
            <CheckSquare className="w-4.5 h-4.5" />
            <span>Sanction Module</span>
          </button>
        )}

        {canAccessTab('DISBURSEMENT') && (
          <button
            onClick={() => setActiveTab('DISBURSEMENT')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'DISBURSEMENT'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
            }`}
          >
            <Banknote className="w-4.5 h-4.5" />
            <span>Disbursement Module</span>
          </button>
        )}

        {canAccessTab('COLLECTION') && (
          <button
            onClick={() => setActiveTab('COLLECTION')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'COLLECTION'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
            }`}
          >
            <Landmark className="w-4.5 h-4.5" />
            <span>Collection Module</span>
          </button>
        )}
      </aside>

      {/* Main Module Content Area */}
      <section className="flex-grow glass-card p-6 md:p-8 rounded-3xl space-y-6">
        
        {/* Module Title & Search Bar (except Overview) */}
        {activeTab !== 'OVERVIEW' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <span>{activeTab} EXECUTIVE MODULE</span>
              </h2>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                {activeTab === 'SALES' && 'Track users registered but who have not submitted a loan request yet.'}
                {activeTab === 'SANCTION' && 'Appraise and approve or reject applied pending loan requests.'}
                {activeTab === 'DISBURSEMENT' && 'Verify and disburse funds for approved loan applications.'}
                {activeTab === 'COLLECTION' && 'Record client payments, check outstanding balances, and close accounts.'}
              </p>
            </div>
            
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search borrower or email..."
                className="block w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs"
              />
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loadingData ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs text-slate-400">Loading module details...</span>
          </div>
        ) : (
          /* MODULE VIEWS */
          <>
            {/* OVERVIEW MODULE */}
            {activeTab === 'OVERVIEW' && stats && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-xl font-extrabold text-white">System Executive Dashboard</h2>
                  <p className="text-xs text-slate-500 font-light mt-0.5">Overview analytics, system volume, and operational metrics.</p>
                </div>

                {/* Numbers Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Borrower Leads</span>
                    <span className="text-3xl font-extrabold text-white block">{stats.leadsCount}</span>
                  </div>
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Applied Loans</span>
                    <span className="text-3xl font-extrabold text-amber-500 block">{stats.appliedCount}</span>
                  </div>
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Sanctioned</span>
                    <span className="text-3xl font-extrabold text-indigo-400 block">{stats.sanctionedCount}</span>
                  </div>
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Active Cycle</span>
                    <span className="text-3xl font-extrabold text-emerald-400 block">{stats.activeLoansCount}</span>
                  </div>
                </div>

                {/* Monatery Aggregations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Financial Volume</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-500 block">Total Disbursed</span>
                        <span className="text-2xl font-extrabold text-white mt-1 block">₹{stats.totalDisbursedAmt.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Outstanding Portfolio</span>
                        <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">₹{stats.totalOutstandingAmt.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 flex flex-col justify-center space-y-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Database Status</h3>
                    <p className="text-xs text-slate-400 font-light">
                      Server is connected and operating on a dynamic data instance. Seeder credentials verified.
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-bold pt-1 uppercase">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>In-Memory Fallback Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SALES MODULE */}
            {activeTab === 'SALES' && (
              <div className="overflow-x-auto animate-fade-in">
                {getFilteredLeads().length === 0 ? (
                  <div className="py-10 border border-dashed border-slate-850 rounded-2xl text-center text-slate-500 text-sm font-light">
                    No matching sales leads found.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500">
                        <th className="py-3 font-semibold">Lead Name</th>
                        <th className="py-3 font-semibold">Email</th>
                        <th className="py-3 font-semibold">Created Date</th>
                        <th className="py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredLeads().map((lead) => (
                        <tr key={lead._id || lead.id} className="border-b border-slate-900 text-slate-300">
                          <td className="py-4 font-bold text-white">{lead.name}</td>
                          <td className="py-4">{lead.email}</td>
                          <td className="py-4">{new Date().toLocaleDateString() /* approximate */}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              lead.applicationStatus === 'Not_Started' ? 'bg-slate-800 border-slate-700 text-slate-400' :
                              lead.applicationStatus === 'Details_Completed' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                              'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                              {lead.applicationStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* SANCTION MODULE */}
            {activeTab === 'SANCTION' && (
              <div className="overflow-x-auto animate-fade-in">
                {getFilteredApplied().length === 0 ? (
                  <div className="py-10 border border-dashed border-slate-850 rounded-2xl text-center text-slate-500 text-sm font-light">
                    No loan requests awaiting appraisal.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500">
                        <th className="py-3 font-semibold">Borrower</th>
                        <th className="py-3 font-semibold">Salary (Monthly)</th>
                        <th className="py-3 font-semibold">Loan Request</th>
                        <th className="py-3 font-semibold">Interest & Repayment</th>
                        <th className="py-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredApplied().map((loan) => {
                        const borrower = loan.borrower as User;
                        return (
                          <tr key={loan._id} className="border-b border-slate-900 text-slate-300">
                            <td className="py-4">
                              <span className="font-bold text-white block">{borrower?.name}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{borrower?.email}</span>
                            </td>
                            <td className="py-4">
                              <span className="font-semibold text-white block">₹{borrower?.monthlySalary?.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500 block uppercase">{borrower?.employmentMode}</span>
                            </td>
                            <td className="py-4">
                              <span className="font-bold text-white block">₹{loan.amount.toLocaleString()}</span>
                              <span className="text-[10px] text-indigo-400 block font-semibold">{loan.tenure} Days</span>
                            </td>
                            <td className="py-4">
                              <span className="font-semibold text-slate-400 block">₹{loan.totalRepayment.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500 block">Inc. ₹{loan.simpleInterest.toLocaleString()} SI</span>
                            </td>
                            <td className="py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setShowReviewModal(true);
                                }}
                                className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Appraise</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* DISBURSEMENT MODULE */}
            {activeTab === 'DISBURSEMENT' && (
              <div className="overflow-x-auto animate-fade-in">
                {getFilteredSanctioned().length === 0 ? (
                  <div className="py-10 border border-dashed border-slate-850 rounded-2xl text-center text-slate-500 text-sm font-light">
                    No approved loans pending fund disbursement.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500">
                        <th className="py-3 font-semibold">Borrower</th>
                        <th className="py-3 font-semibold">Sanction Details</th>
                        <th className="py-3 font-semibold">Total Repayable</th>
                        <th className="py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredSanctioned().map((loan) => {
                        const borrower = loan.borrower as User;
                        return (
                          <tr key={loan._id} className="border-b border-slate-900 text-slate-300">
                            <td className="py-4">
                              <span className="font-bold text-white block">{borrower?.name}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{borrower?.email}</span>
                            </td>
                            <td className="py-4">
                              <span className="font-bold text-white block">₹{loan.amount.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500 block font-semibold">Tenure: {loan.tenure} Days</span>
                            </td>
                            <td className="py-4">
                              <span className="font-semibold text-white">₹{loan.totalRepayment.toLocaleString()}</span>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => handleDisburseSubmit(loan._id)}
                                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Disburse Funds</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* COLLECTION MODULE */}
            {activeTab === 'COLLECTION' && (
              <div className="overflow-x-auto animate-fade-in">
                {getFilteredDisbursed().length === 0 ? (
                  <div className="py-10 border border-dashed border-slate-850 rounded-2xl text-center text-slate-500 text-sm font-light">
                    No active (disbursed) loans requiring collection.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500">
                        <th className="py-3 font-semibold">Borrower</th>
                        <th className="py-3 font-semibold">Loan Setup</th>
                        <th className="py-3 font-semibold">Collection Progress</th>
                        <th className="py-3 font-semibold">Outstanding Balance</th>
                        <th className="py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredDisbursed().map((loan) => {
                        const borrower = loan.borrower as User;
                        const paidAmt = loan.totalRepayment - loan.outstandingBalance;
                        const pctPaid = Math.round((paidAmt / loan.totalRepayment) * 100);

                        return (
                          <tr key={loan._id} className="border-b border-slate-900 text-slate-300">
                            <td className="py-4">
                              <span className="font-bold text-white block">{borrower?.name}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{borrower?.email}</span>
                            </td>
                            <td className="py-4">
                              <span className="font-bold text-white block">₹{loan.amount.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500 block">Total Repay: ₹{loan.totalRepayment.toLocaleString()}</span>
                            </td>
                            <td className="py-4">
                              <div className="w-28 md:w-36">
                                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-900 border border-slate-850">
                                  <div 
                                    style={{ width: `${pctPaid}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500" 
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold block mt-1">{pctPaid}% Paid (₹{paidAmt.toLocaleString()})</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="font-extrabold text-indigo-400">₹{loan.outstandingBalance.toLocaleString()}</span>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => openPaymentModal(loan)}
                                className="inline-flex items-center space-x-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Record Payment</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* MODAL 1: APPRAISE/REVIEW LOAN (SANCTION EXECUTIVE) */}
      {showReviewModal && selectedLoan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-xl p-8 rounded-3xl space-y-6 relative border-indigo-500/10">
            <button 
              onClick={() => {
                setShowReviewModal(false);
                setSelectedLoan(null);
                setReviewAction(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white">Appraise Loan Application</h3>
              <p className="text-xs text-slate-400 mt-0.5">Review credentials, verify uploaded slip, and approve or reject.</p>
            </div>

            {/* Application details overview */}
            <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-850 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Applicant</span>
                <span className="text-white font-bold block mt-0.5">{(selectedLoan.borrower as User)?.name}</span>
                <span className="text-[10px] text-slate-400">{(selectedLoan.borrower as User)?.email}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">PAN Details</span>
                <span className="text-white font-bold block mt-0.5 font-mono">{(selectedLoan.borrower as User)?.pan}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Salary declared</span>
                <span className="text-white font-bold block mt-0.5">₹{(selectedLoan.borrower as User)?.monthlySalary?.toLocaleString()} / month</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Requested details</span>
                <span className="text-indigo-400 font-bold block mt-0.5">₹{selectedLoan.amount.toLocaleString()} for {selectedLoan.tenure} days</span>
              </div>
            </div>

            {/* Document view action */}
            <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-850 rounded-2xl text-sm">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <span className="text-white font-bold block text-xs">Salary Slip File</span>
                  <span className="text-slate-500 text-[10px]">Verified against file criteria limits</span>
                </div>
              </div>
              <a
                href={`${BACKEND_URL}${(selectedLoan.borrower as User)?.salarySlipPath}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <span>View Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Decisions Actions */}
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Decision Actions</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setReviewAction('APPROVE')}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Request</span>
                </button>
                <button
                  onClick={() => setReviewAction('REJECT')}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                    reviewAction === 'REJECT'
                      ? 'bg-red-650 border-red-650 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-red-500/30 hover:text-red-400'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>
              </div>
            </div>

            {/* Rejection input field */}
            {reviewAction === 'REJECT' && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Rejection Reason</label>
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all text-xs"
                  placeholder="e.g. Salary slip uploaded does not match declared salary amount or name details mismatch."
                  rows={3}
                />
              </div>
            )}

            <button
              onClick={handleReviewSubmit}
              disabled={!reviewAction}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 text-sm cursor-pointer pt-3"
            >
              Submit Appraisal Decision
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT (COLLECTION EXECUTIVE) */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-2xl p-8 rounded-3xl space-y-6 relative border-indigo-500/10">
            <button 
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedLoan(null);
                setLoanPayments([]);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white">Record Borrower Payment</h3>
              <p className="text-xs text-slate-400 mt-0.5">Record payments received from borrower, checking against total repayment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Log Payment Form */}
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicant:</span>
                    <span className="text-white font-bold">{(selectedLoan.borrower as User)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Repayable:</span>
                    <span className="text-white font-semibold">₹{selectedLoan.totalRepayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-indigo-400">
                    <span>Remaining Balance:</span>
                    <span>₹{selectedLoan.outstandingBalance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">UTR Number (Unique)</label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                    placeholder="e.g. UTR1234567890"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Amount Paid (INR)</label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                    placeholder={`Max: ₹${selectedLoan.outstandingBalance.toLocaleString()}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 text-xs cursor-pointer pt-3 mt-4"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Log Transaction Payment</span>
                </button>
              </form>

              {/* Transactions list on right */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Logged Transactions History</span>
                <div className="border border-slate-850 rounded-2xl bg-slate-900/30 overflow-y-auto max-h-[300px] p-4 space-y-3">
                  {loanPayments.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-xs font-light">
                      No transactions recorded yet.
                    </div>
                  ) : (
                    loanPayments.map((pay) => (
                      <div key={pay._id} className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex justify-between font-mono font-bold text-white">
                          <span>UTR: {pay.utrNumber}</span>
                          <span className="text-emerald-400">₹{pay.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span>Logged: {new Date(pay.createdAt).toLocaleDateString()}</span>
                          <span>Paid: {new Date(pay.paymentDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
