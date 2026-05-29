import { Router } from 'express';
import {
  getSalesLeads,
  getAppliedLoans,
  reviewLoan,
  getSanctionedLoans,
  disburseLoan,
  getDisbursedLoans,
  recordPayment,
  getLoanPayments,
  getAdminStats,
} from '../controllers/operationsController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Sales module: Lead tracking
router.get('/leads', authenticate, authorize('Sales', 'Admin'), getSalesLeads);

// Sanction module: Review applied loans
router.get('/applied', authenticate, authorize('Sanction', 'Admin'), getAppliedLoans);
router.post('/review', authenticate, authorize('Sanction', 'Admin'), reviewLoan);

// Disbursement module: Disburse sanctioned loans
router.get('/sanctioned', authenticate, authorize('Disbursement', 'Admin'), getSanctionedLoans);
router.post('/disburse', authenticate, authorize('Disbursement', 'Admin'), disburseLoan);

// Collection module: Collect payments
router.get('/disbursed', authenticate, authorize('Collection', 'Admin'), getDisbursedLoans);
router.post('/record-payment', authenticate, authorize('Collection', 'Admin'), recordPayment);
router.get('/payments/:loanId', authenticate, authorize('Collection', 'Admin', 'Borrower'), getLoanPayments);

// Admin general analytics stats
router.get('/stats', authenticate, authorize('Admin'), getAdminStats);

export default router;
