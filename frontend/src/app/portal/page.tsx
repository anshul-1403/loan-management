'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import API, { BACKEND_URL } from '../../utils/api';
import { Loan, Payment } from '../../types';
import { toast } from 'react-hot-toast';
import { 
  FileText, UploadCloud, Sliders, CheckCircle2, XCircle, 
  Loader2, LogOut, DollarSign, Calendar, Landmark, 
  HelpCircle, User as UserIcon, AlertCircle, RefreshCw, FileCheck
} from 'lucide-react';

export default function BorrowerPortal() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Application workflow states
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fetchingLoan, setFetchingLoan] = useState(true);

  // Form states - Step 2 (Details)
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [salary, setSalary] = useState('');
  const [employment, setEmployment] = useState<'Salaried' | 'Self-Employed' | 'Unemployed'>('Salaried');
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [submittingDetails, setSubmittingDetails] = useState(false);

  // Form states - Step 3 (Salary Slip)
  const [file, setFile] = useState<File | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  // Form states - Step 4 (Loan Config)
  const [loanAmount, setLoanAmount] = useState(100000); // default ₹1,00,000
  const [tenure, setTenure] = useState(90); // default 90 days
  const [submittingLoan, setSubmittingLoan] = useState(false);

  // Protect route
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'Borrower') {
        router.push('/dashboard');
      } else {
        setFullName(user.name || '');
        setPan(user.pan || '');
        if (user.dob) {
          setDob(new Date(user.dob).toISOString().split('T')[0]);
        }
        setSalary(user.monthlySalary?.toString() || '');
        setEmployment(user.employmentMode || 'Salaried');
      }
    }
  }, [user, loading, router]);

  // Fetch active loan and payments
  const fetchActiveLoan = async () => {
    try {
      setFetchingLoan(true);
      const response = await API.get('/loans/my-loan');
      if (response.data.loan) {
        const loanData = response.data.loan;
        setActiveLoan(loanData);
        
        // If loan is disbursed or closed, fetch payments
        if (loanData.status === 'DISBURSED' || loanData.status === 'CLOSED') {
          const paymentsResponse = await API.get(`/operations/payments/${loanData._id}`);
          setPayments(paymentsResponse.data.payments);
        }
      } else {
        setActiveLoan(null);
      }
    } catch (error) {
      console.warn('Error fetching active loan details:', error);
    } finally {
      setFetchingLoan(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Borrower') {
      fetchActiveLoan();
    }
  }, [user]);

  if (loading || fetchingLoan) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-medium text-slate-400">Loading Borrower Portal...</span>
      </div>
    );
  }

  // Helper age calculator
  const getAge = (birthDateString: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Step 2 Submission (Details + Client BRE Check)
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreErrors([]);

    const age = getAge(dob);
    const monthlySalary = Number(salary);
    const errors: string[] = [];

    // Client-side BRE checks for immediate user validation
    if (age < 23 || age > 50) {
      errors.push(`Age must be between 23 and 50. (Your age: ${isNaN(age) ? 'Invalid Date' : age})`);
    }
    if (monthlySalary < 25000) {
      errors.push('Monthly salary must be at least ₹25,000.');
    }
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) {
      errors.push('Invalid PAN format. PAN must be 10 characters (e.g. ABCDE1234F).');
    }
    if (employment === 'Unemployed') {
      errors.push('Employment mode cannot be Unemployed.');
    }

    if (errors.length > 0) {
      setBreErrors(errors);
      toast.error('Eligibility check failed! Correct the details.');
      return;
    }

    setSubmittingDetails(true);
    try {
      const response = await API.post('/loans/submit-details', {
        name: fullName,
        pan,
        dob,
        monthlySalary,
        employmentMode: employment,
      });
      toast.success(response.data.message);
      await refreshUser();
    } catch (error: any) {
      const serverErrors = error.response?.data?.errors || [error.response?.data?.message || 'Details submission failed.'];
      setBreErrors(serverErrors);
      toast.error('Details rejected by automated scoring engine.');
      await refreshUser(); // sync status
    } finally {
      setSubmittingDetails(false);
    }
  };

  // Step 3 Submission (File Upload)
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    setUploadingSlip(true);
    const formData = new FormData();
    formData.append('salarySlip', file);

    try {
      const response = await API.post('/loans/upload-slip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(response.data.message);
      await refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'File upload failed.');
    } finally {
      setUploadingSlip(false);
    }
  };

  // Step 4 Submission (Loan Application)
  const handleLoanApply = async () => {
    setSubmittingLoan(true);
    try {
      const response = await API.post('/loans/apply', {
        amount: loanAmount,
        tenure,
      });
      toast.success(response.data.message);
      await refreshUser();
      await fetchActiveLoan();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit loan application.');
    } finally {
      setSubmittingLoan(false);
    }
  };

  // Reset Application
  const handleResetApplication = async () => {
    try {
      const response = await API.post('/loans/reset-application');
      toast.success(response.data.message);
      setActiveLoan(null);
      setFile(null);
      setBreErrors([]);
      await refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset application.');
    }
  };

  // Simple Interest Maths
  const interestRate = 12; // 12% p.a.
  const simpleInterest = Math.round((loanAmount * interestRate * tenure) / (365 * 100));
  const totalRepayment = loanAmount + simpleInterest;

  // Determine current active step
  const getStepNumber = () => {
    if (!user) return 1;
    switch (user.applicationStatus) {
      case 'Not_Started':
        return 1;
      case 'Details_Completed':
        return 2;
      case 'Slip_Uploaded':
        return 3;
      case 'Applied':
        return 4;
      case 'Rejected':
        return 1;
      default:
        return 1;
    }
  };

  const stepNumber = getStepNumber();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-900 glass sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 p-2 rounded-xl text-white font-bold tracking-wider">
              CS
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CrediSea Portal
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-indigo-400 font-medium">Borrower Portal</p>
            </div>
            <button 
              onClick={logout}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-300 hover:text-red-400 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-grow">
        {user?.applicationStatus === 'Rejected' ? (
          /* REJECTED STATE SCREEN */
          <div className="glass-card max-w-xl mx-auto p-10 rounded-3xl text-center space-y-6 border-red-500/30 glow-indigo">
            <div className="inline-flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Application Blocked</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Unfortunately, your profile did not satisfy our credit score eligibility rules. Our Business Rule Engine (BRE) automatically rejected your details.
            </p>
            {activeLoan?.rejectionReason && (
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-left">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executive rejection reason:</span>
                <p className="text-sm text-red-400 mt-1 font-medium">{activeLoan.rejectionReason}</p>
              </div>
            )}
            <button
              onClick={handleResetApplication}
              className="flex items-center justify-center space-x-2 mx-auto bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-red-500/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Apply Again</span>
            </button>
          </div>
        ) : user?.applicationStatus === 'Applied' && activeLoan ? (
          /* ACTIVE LOAN DASHBOARD */
          <div className="space-y-8 animate-fade-in">
            {/* Status Summary Banner */}
            <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-slate-800">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Active Application</span>
                <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2">
                  <span>Loan Ref: #{activeLoan._id.substring(activeLoan._id.length - 8).toUpperCase()}</span>
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs font-semibold text-slate-400">Current Status:</span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  activeLoan.status === 'APPLIED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' :
                  activeLoan.status === 'SANCTIONED' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                  activeLoan.status === 'DISBURSED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  activeLoan.status === 'CLOSED' ? 'bg-slate-800 border-slate-700 text-slate-400' :
                  'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {activeLoan.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Loan Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card p-6 rounded-2xl space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Landmark className="w-5 h-5 text-indigo-400" />
                    <span>Loan Structure & Repayment</span>
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                      <span className="text-xs text-slate-500 font-semibold uppercase block">Principal Amount</span>
                      <span className="text-xl font-extrabold text-white mt-1 block">₹{activeLoan.amount.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                      <span className="text-xs text-slate-500 font-semibold uppercase block">Tenure</span>
                      <span className="text-xl font-extrabold text-white mt-1 block">{activeLoan.tenure} Days</span>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                      <span className="text-xs text-slate-500 font-semibold uppercase block">Interest Rate</span>
                      <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{activeLoan.interestRate}% p.a.</span>
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                      <span className="text-xs text-slate-500 font-semibold uppercase block">Total Payable</span>
                      <span className="text-xl font-extrabold text-indigo-400 mt-1 block">₹{activeLoan.totalRepayment.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-850 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase block">Outstanding Balance</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-3xl font-extrabold text-white">₹{activeLoan.outstandingBalance.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">remaining</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-slate-500 font-semibold uppercase block">Progress Paid</span>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-900 border border-slate-850">
                          <div 
                            style={{ width: `${((activeLoan.totalRepayment - activeLoan.outstandingBalance) / activeLoan.totalRepayment) * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" 
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1 font-semibold">
                          <span>₹{(activeLoan.totalRepayment - activeLoan.outstandingBalance).toLocaleString()} Paid</span>
                          <span>{Math.round(((activeLoan.totalRepayment - activeLoan.outstandingBalance) / activeLoan.totalRepayment) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payments Log */}
                {activeLoan.status === 'DISBURSED' || activeLoan.status === 'CLOSED' ? (
                  <div className="glass-card p-6 rounded-2xl space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <span>Payment Transactions</span>
                    </h3>

                    {payments.length === 0 ? (
                      <div className="p-8 border border-dashed border-slate-850 rounded-xl text-center text-slate-500 text-sm font-light">
                        No payments recorded yet. Standard collection rules apply.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-500">
                              <th className="py-3 font-semibold">UTR Number</th>
                              <th className="py-3 font-semibold">Date</th>
                              <th className="py-3 font-semibold text-right">Amount Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((pay) => (
                              <tr key={pay._id} className="border-b border-slate-900 text-slate-300">
                                <td className="py-3 font-mono text-xs">{pay.utrNumber}</td>
                                <td className="py-3">{new Date(pay.paymentDate).toLocaleDateString()}</td>
                                <td className="py-3 text-right font-semibold text-white">₹{pay.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Action button if closed */}
                {activeLoan.status === 'CLOSED' && (
                  <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-emerald-500/30">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white">Congratulations!</h4>
                      <p className="text-slate-400 text-sm font-light">Your loan has been fully closed and outstanding settled.</p>
                    </div>
                    <button
                      onClick={handleResetApplication}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
                    >
                      Apply For New Loan
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Lifeycle Progress Info */}
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h3 className="text-base font-bold text-white">Loan Lifecycle Progress</h3>
                  <div className="relative pl-6 border-l border-slate-800 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500" />
                      <h4 className="text-sm font-bold text-white">Applied</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Application successfully verified and queued for sanction.</p>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 ${
                        ['SANCTIONED', 'DISBURSED', 'CLOSED'].includes(activeLoan.status)
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-700 bg-slate-900'
                      }`} />
                      <h4 className={`text-sm font-bold ${
                        ['SANCTIONED', 'DISBURSED', 'CLOSED'].includes(activeLoan.status) ? 'text-white' : 'text-slate-500'
                      }`}>Sanctioned</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Credit executives appraise and approve loan details.</p>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 ${
                        ['DISBURSED', 'CLOSED'].includes(activeLoan.status)
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-700 bg-slate-900'
                      }`} />
                      <h4 className={`text-sm font-bold ${
                        ['DISBURSED', 'CLOSED'].includes(activeLoan.status) ? 'text-white' : 'text-slate-500'
                      }`}>Disbursed</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Funds released and active repayment cycle started.</p>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 ${
                        activeLoan.status === 'CLOSED'
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-700 bg-slate-900'
                      }`} />
                      <h4 className={`text-sm font-bold ${
                        activeLoan.status === 'CLOSED' ? 'text-white' : 'text-slate-500'
                      }`}>Closed</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Loan balance cleared and auto-closure executed.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP BY STEP PORTAL APPLICATION FORM */
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Step Progress Header */}
            <div className="glass-card p-6 rounded-2xl border-slate-900">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span className="text-indigo-400">Application Steps</span>
                <span>Step {stepNumber} of 4</span>
              </div>
              <div className="relative mt-4 flex items-center justify-between">
                {/* Connection bars */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-900 -translate-y-1/2 z-0" />
                <div 
                  style={{ width: `${((stepNumber - 1) / 3) * 100}%` }}
                  className="absolute left-0 top-1/2 h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500" 
                />

                {/* Step Circles */}
                {[
                  { num: 1, label: 'Register', icon: UserIcon },
                  { num: 2, label: 'Eligibility', icon: FileText },
                  { num: 3, label: 'Upload Slip', icon: UploadCloud },
                  { num: 4, label: 'Calculate & Apply', icon: Sliders },
                ].map((s) => {
                  const Icon = s.icon;
                  const isActive = stepNumber === s.num;
                  const isCompleted = stepNumber > s.num;
                  
                  return (
                    <div key={s.num} className="relative z-10 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-sm transition-all ${
                        isCompleted ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' :
                        isActive ? 'bg-slate-950 border-indigo-500 text-indigo-400 pulse-glow' :
                        'bg-slate-950 border-slate-900 text-slate-600'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider hidden sm:block ${
                        isActive ? 'text-indigo-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: DETAILS FORM */}
            {stepNumber === 1 && (
              <div className="glass-card p-8 rounded-3xl space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-white">Personal Details & Eligibility Check</h2>
                  <p className="text-xs text-slate-400 font-light">Input your details. Our automated rules validation will assess eligibility.</p>
                </div>

                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                  {breErrors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Eligibility Rejection Criteria Triggered:</span>
                      </div>
                      <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1 font-light">
                        {breErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full px-4 py-3 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">PAN (10-Digit Alpha-Numeric)</label>
                      <input
                        type="text"
                        required
                        value={pan}
                        onChange={(e) => setPan(e.target.value)}
                        className="block w-full px-4 py-3 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm uppercase"
                        placeholder="ABCDE1234F"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="block w-full px-4 py-3 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Monthly Income (INR)</label>
                      <input
                        type="number"
                        required
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        className="block w-full px-4 py-3 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                        placeholder="35000"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Employment Mode</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Salaried', 'Self-Employed', 'Unemployed'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setEmployment(mode as any)}
                            className={`py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                              employment === mode
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingDetails}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 text-sm cursor-pointer pt-3"
                  >
                    {submittingDetails ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Evaluating details with BRE...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-5 h-5" />
                        <span>Submit & Verify Eligibility</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: UPLOAD SALARY SLIP */}
            {stepNumber === 2 && (
              <div className="glass-card p-8 rounded-3xl space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-white">Upload Salary Slip</h2>
                  <p className="text-xs text-slate-400 font-light">Provide official proof of employment. Max size 5 MB. Formats allowed: PDF, JPG, JPEG, PNG.</p>
                </div>

                <form onSubmit={handleFileUpload} className="space-y-6">
                  <div className="border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/30 hover:bg-slate-900/50 rounded-2xl p-10 flex flex-col items-center justify-center space-y-4 transition-all duration-300">
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="text-center space-y-1">
                      <label className="block text-sm font-semibold text-white cursor-pointer hover:text-indigo-400 transition-colors">
                        <span>Click to upload file</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="sr-only"
                        />
                      </label>
                      <p className="text-xs text-slate-500 font-light">or drag and drop your salary document here</p>
                    </div>
                    {file && (
                      <div className="bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl flex items-center space-x-2 text-xs font-semibold text-slate-300">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <span className="text-[10px] text-slate-500">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleResetApplication}
                      className="w-1/3 py-3 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingSlip || !file}
                      className="w-2/3 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 text-sm cursor-pointer"
                    >
                      {uploadingSlip ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Uploading Document...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Upload & Proceed</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4: LOAN CONFIGURATION & MATHS */}
            {stepNumber === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Config Panel */}
                <div className="lg:col-span-2 glass-card p-8 rounded-3xl space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">Configure Loan Details</h2>
                    <p className="text-xs text-slate-400 font-light">Set your requested principal amount and tenure using the sliders below.</p>
                  </div>

                  <div className="space-y-8 pt-4">
                    {/* Amount Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loan Principal</span>
                        <span className="text-2xl font-extrabold text-white">₹{loanAmount.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="500000"
                        step="5000"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-850"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                        <span>Min ₹50,000</span>
                        <span>Max ₹5,00,000</span>
                      </div>
                    </div>

                    {/* Tenure Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenure Days</span>
                        <span className="text-2xl font-extrabold text-white">{tenure} Days</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="365"
                        step="1"
                        value={tenure}
                        onChange={(e) => setTenure(Number(e.target.value))}
                        className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-850"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                        <span>Min 30 Days</span>
                        <span>Max 365 Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={handleResetApplication}
                      className="w-1/3 py-3 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Reset Form
                    </button>
                    <button
                      type="button"
                      onClick={handleLoanApply}
                      disabled={submittingLoan}
                      className="w-2/3 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 text-sm cursor-pointer"
                    >
                      {submittingLoan ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Submit Loan Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Calculations Panel */}
                <div className="glass-card p-6 rounded-3xl bg-gradient-to-b from-indigo-950/20 to-slate-900/60 border-indigo-500/10 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">Live Calculation</span>
                    
                    <div className="space-y-4 border-b border-slate-850 pb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Principal</span>
                        <span className="text-white font-semibold">₹{loanAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Tenure</span>
                        <span className="text-white font-semibold">{tenure} Days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Interest Rate</span>
                        <span className="text-emerald-400 font-bold">{interestRate}% p.a.</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline text-sm">
                        <span className="text-slate-400">Simple Interest (SI)</span>
                        <span className="text-white font-semibold">₹{simpleInterest.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-light leading-normal">
                        Calculated as (P × R × T) / (365 × 100) using actual days.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl mt-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Repayment Amount</span>
                    <span className="text-3xl font-extrabold text-indigo-400 mt-1 block">₹{totalRepayment.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-slate-500 text-xs tracking-wider">
        <p>&copy; {new Date().getFullYear()} CrediSea. Built securely with automated BRE rules validation.</p>
      </footer>
    </div>
  );
}
