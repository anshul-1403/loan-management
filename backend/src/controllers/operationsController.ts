import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Loan, ILoan } from '../models/Loan';
import { Payment } from '../models/Payment';

// 1. Sales Module - Lead tracking (registered borrowers who have not applied or been rejected)
export const getSalesLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leads = await User.find({
      role: 'Borrower',
      applicationStatus: { $in: ['Not_Started', 'Details_Completed', 'Slip_Uploaded'] },
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({ leads });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales leads.', error: (error as Error).message });
  }
};

// 2. Sanction Module - Fetch loans with status 'APPLIED'
export const getAppliedLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'APPLIED' })
      .populate('borrower', 'name email pan dob monthlySalary employmentMode salarySlipPath')
      .sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch applied loans.', error: (error as Error).message });
  }
};

// Sanction action - Approve or Reject loan application
export const reviewLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId, action, reason } = req.body; // action: 'APPROVE' or 'REJECT'

    if (!loanId || !action) {
      res.status(400).json({ message: "Loan ID and Action ('APPROVE'/'REJECT') are required." });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan application not found.' });
      return;
    }

    if (loan.status !== 'APPLIED') {
      res.status(400).json({ message: `Loan is already in "${loan.status}" status and cannot be reviewed.` });
      return;
    }

    if (action === 'APPROVE') {
      loan.status = 'SANCTIONED';
    } else if (action === 'REJECT') {
      if (!reason) {
        res.status(400).json({ message: 'Rejection reason is required when rejecting a loan.' });
        return;
      }
      loan.status = 'REJECTED';
      loan.rejectionReason = reason;

      // Update borrower status as well
      await User.findByIdAndUpdate(loan.borrower, { applicationStatus: 'Rejected' });
    } else {
      res.status(400).json({ message: 'Invalid action. Must be "APPROVE" or "REJECT".' });
      return;
    }

    await loan.save();

    res.status(200).json({
      message: `Loan application successfully ${loan.status.toLowerCase()}.`,
      loan,
    });
  } catch (error) {
    res.status(500).json({ message: 'Review processing failed.', error: (error as Error).message });
  }
};

// 3. Disbursement Module - Fetch loans with status 'SANCTIONED'
export const getSanctionedLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'SANCTIONED' })
      .populate('borrower', 'name email pan dob monthlySalary employmentMode')
      .sort({ updatedAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sanctioned loans.', error: (error as Error).message });
  }
};

// Disbursement action - Release funds
export const disburseLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.body;

    if (!loanId) {
      res.status(400).json({ message: 'Loan ID is required.' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'SANCTIONED') {
      res.status(400).json({ message: `Loan is in "${loan.status}" status. Only sanctioned loans can be disbursed.` });
      return;
    }

    loan.status = 'DISBURSED';
    loan.disbursedAt = new Date();
    loan.outstandingBalance = loan.totalRepayment; // Set initial balance to full repayment value
    await loan.save();

    res.status(200).json({
      message: 'Loan disbursed successfully. Funds have been released.',
      loan,
    });
  } catch (error) {
    res.status(500).json({ message: 'Disbursement failed.', error: (error as Error).message });
  }
};

// 4. Collection Module - Fetch active disbursed loans
export const getDisbursedLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'DISBURSED' })
      .populate('borrower', 'name email pan monthlySalary')
      .sort({ updatedAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active loans.', error: (error as Error).message });
  }
};

// Collection action - Record a borrower payment
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId, utrNumber, amount, paymentDate } = req.body;

    if (!loanId || !utrNumber || !amount || !paymentDate) {
      res.status(400).json({ message: 'Loan ID, UTR Number, Amount, and Payment Date are all required.' });
      return;
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400).json({ message: 'Payment amount must be a positive number.' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'DISBURSED') {
      res.status(400).json({ message: 'Payments can only be recorded on active DISBURSED loans.' });
      return;
    }

    // Validation: UTR must be unique
    const existingPayment = await Payment.findOne({ utrNumber: utrNumber.trim() });
    if (existingPayment) {
      res.status(400).json({ message: 'A payment with this UTR number already exists. UTR must be unique.' });
      return;
    }

    // Validation: Amount must not exceed outstanding balance
    if (paymentAmount > loan.outstandingBalance) {
      res.status(400).json({
        message: `Payment amount (₹${paymentAmount.toLocaleString()}) cannot exceed the outstanding balance (₹${loan.outstandingBalance.toLocaleString()}).`,
      });
      return;
    }

    // Create the payment record
    const payment = new Payment({
      loan: loan._id,
      utrNumber: utrNumber.trim(),
      amount: paymentAmount,
      paymentDate: new Date(paymentDate),
    });

    await payment.save();

    // Deduct from outstanding balance
    loan.outstandingBalance = Math.max(0, loan.outstandingBalance - paymentAmount);

    // If outstanding balance is 0, auto-close the loan
    if (loan.outstandingBalance === 0) {
      loan.status = 'CLOSED';
      loan.closedAt = new Date();

      // Reset borrower user application status to Not_Started, allowing them to apply again
      await User.findByIdAndUpdate(loan.borrower, { applicationStatus: 'Not_Started' });
    }

    await loan.save();

    res.status(201).json({
      message: loan.status === 'CLOSED'
        ? 'Payment recorded. Loan has been fully repaid and CLOSED.'
        : `Payment of ₹${paymentAmount.toLocaleString()} recorded. Outstanding balance is now ₹${loan.outstandingBalance.toLocaleString()}.`,
      payment,
      loan,
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment recording failed.', error: (error as Error).message });
  }
};

// Retrieve payments history for a specific loan
export const getLoanPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const payments = await Payment.find({ loan: loanId }).sort({ paymentDate: -1 });
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loan payments.', error: (error as Error).message });
  }
};

// General - Fetch overview stats for Admin
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({ role: 'Borrower' });
    const leadsCount = await User.countDocuments({
      role: 'Borrower',
      applicationStatus: { $in: ['Not_Started', 'Details_Completed', 'Slip_Uploaded'] },
    });
    const appliedCount = await Loan.countDocuments({ status: 'APPLIED' });
    const sanctionedCount = await Loan.countDocuments({ status: 'SANCTIONED' });
    const activeLoansCount = await Loan.countDocuments({ status: 'DISBURSED' });
    const closedCount = await Loan.countDocuments({ status: 'CLOSED' });

    // Aggregate monetary values
    const disbursedLoans = await Loan.find({ status: { $in: ['DISBURSED', 'CLOSED'] } });
    const totalDisbursedAmt = disbursedLoans.reduce((sum, l) => sum + l.amount, 0);
    const totalOutstandingAmt = disbursedLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);
    
    res.status(200).json({
      totalUsers,
      leadsCount,
      appliedCount,
      sanctionedCount,
      activeLoansCount,
      closedCount,
      totalDisbursedAmt,
      totalOutstandingAmt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin stats.', error: (error as Error).message });
  }
};
