import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Loan, ILoan } from '../models/Loan';
import { runBRE } from '../utils/bre';

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Step 2: Submit details and run BRE
export const submitDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, pan, dob, monthlySalary, employmentMode } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    if (!name || !pan || !dob || monthlySalary === undefined || !employmentMode) {
      res.status(400).json({ message: 'All personal details fields are required.' });
      return;
    }

    // Run BRE validation
    const breResult = runBRE({ dob, monthlySalary, pan, employmentMode });

    if (!breResult.isValid) {
      // If BRE fails, we block the application and save the status as Rejected
      user.applicationStatus = 'Rejected';
      user.pan = pan;
      user.dob = new Date(dob);
      user.monthlySalary = monthlySalary;
      user.employmentMode = employmentMode;
      user.name = name;
      await user.save();

      res.status(400).json({
        message: 'Eligibility check failed. Application blocked.',
        errors: breResult.errors,
        applicationStatus: user.applicationStatus,
      });
      return;
    }

    // Save details to user and update status
    user.name = name;
    user.pan = pan.toUpperCase();
    user.dob = new Date(dob);
    user.monthlySalary = monthlySalary;
    user.employmentMode = employmentMode;
    user.applicationStatus = 'Details_Completed';
    await user.save();

    res.status(200).json({
      message: 'Personal details verified successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus,
        pan: user.pan,
        dob: user.dob,
        monthlySalary: user.monthlySalary,
        employmentMode: user.employmentMode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Details submission failed.', error: (error as Error).message });
  }
};

// Step 3: Upload Salary Slip
export const uploadSalarySlip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    if (user.applicationStatus !== 'Details_Completed' && user.applicationStatus !== 'Slip_Uploaded') {
      res.status(400).json({ message: 'You must complete your details eligibility check first.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded or file does not meet validation criteria.' });
      return;
    }

    // Store salary slip path
    user.salarySlipPath = `/uploads/${req.file.filename}`;
    user.applicationStatus = 'Slip_Uploaded';
    await user.save();

    res.status(200).json({
      message: 'Salary slip uploaded successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus,
        salarySlipPath: user.salarySlipPath,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'File upload failed.', error: (error as Error).message });
  }
};

// Step 4: Loan Configuration & Apply
export const applyLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    if (user.applicationStatus !== 'Slip_Uploaded' && user.applicationStatus !== 'Applied') {
      res.status(400).json({ message: 'You must upload your salary slip before configuring your loan.' });
      return;
    }

    const { amount, tenure } = req.body;

    if (!amount || !tenure) {
      res.status(400).json({ message: 'Loan amount and tenure are required.' });
      return;
    }

    const loanAmount = Number(amount);
    const loanTenure = Number(tenure);

    if (loanAmount < 50000 || loanAmount > 500000) {
      res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹500,000.' });
      return;
    }

    if (loanTenure < 30 || loanTenure > 365) {
      res.status(400).json({ message: 'Loan tenure must be between 30 and 365 days.' });
      return;
    }

    // Live calculations Math:
    // SI = (P * R * T) / (365 * 100)
    // Total Repayment = P + SI
    const interestRate = 12; // 12% p.a.
    const simpleInterest = Math.round((loanAmount * interestRate * loanTenure) / (365 * 100));
    const totalRepayment = loanAmount + simpleInterest;

    // Check if there is already a loan in applied or active states
    const existingLoan = await Loan.findOne({
      borrower: user._id,
      status: { $in: ['APPLIED', 'SANCTIONED', 'DISBURSED'] },
    });

    if (existingLoan) {
      res.status(400).json({ message: 'You already have a pending or active loan application.' });
      return;
    }

    // Create loan request
    const newLoan = new Loan({
      borrower: user._id,
      amount: loanAmount,
      tenure: loanTenure,
      interestRate,
      simpleInterest,
      totalRepayment,
      outstandingBalance: totalRepayment, // starts as totalRepayment
      status: 'APPLIED',
    });

    await newLoan.save();

    // Update User application status
    user.applicationStatus = 'Applied';
    await user.save();

    res.status(201).json({
      message: 'Loan application submitted successfully.',
      loan: newLoan,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Loan application failed.', error: (error as Error).message });
  }
};

// Retrieve user's loan application details
export const getMyActiveLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const loan = await Loan.findOne({ borrower: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      loan,
      applicationStatus: user.applicationStatus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve active loan.', error: (error as Error).message });
  }
};

// Allow user to reset their application if they were rejected
export const resetApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    if (user.applicationStatus !== 'Rejected') {
      res.status(400).json({ message: 'You can only reset an application that was rejected.' });
      return;
    }

    user.applicationStatus = 'Not_Started';
    user.pan = undefined;
    user.dob = undefined;
    user.monthlySalary = undefined;
    user.employmentMode = undefined;
    user.salarySlipPath = undefined;
    await user.save();

    res.status(200).json({
      message: 'Application reset successfully. You can now apply again.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset application.', error: (error as Error).message });
  }
};
