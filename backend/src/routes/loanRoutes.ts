import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { submitDetails, uploadSalarySlip, applyLoan, getMyActiveLoan, resetApplication } from '../controllers/loanController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = (req as AuthRequest).user?._id || 'temp';
    cb(null, `${userId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

// Middleware helper to catch Multer errors and return clean responses
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('salarySlip')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed.' });
    }
    next();
  });
};

// Routes
router.post('/submit-details', authenticate, authorize('Borrower'), submitDetails);
router.post('/upload-slip', authenticate, authorize('Borrower'), handleUpload, uploadSalarySlip);
router.post('/apply', authenticate, authorize('Borrower'), applyLoan);
router.get('/my-loan', authenticate, authorize('Borrower'), getMyActiveLoan);
router.post('/reset-application', authenticate, authorize('Borrower'), resetApplication);

export default router;
