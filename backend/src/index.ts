import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB, dbError } from './config/db';
import { seedIfEmpty } from './utils/seeder';
import authRoutes from './routes/authRoutes';
import loanRoutes from './routes/loanRoutes';
import operationsRoutes from './routes/operationsRoutes';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for testing/evaluator purposes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'CrediSea Backend is running smoothly.' });
});

// Debug DB connection endpoint
app.get('/api/debug-db', (req: Request, res: Response) => {
  const isInMemory = !process.env.MONGODB_URI || mongoose.connection.host.includes('127.0.0.1') || mongoose.connection.host.includes('localhost');
  res.status(200).json({
    status: 'OK',
    connected: mongoose.connection.readyState === 1,
    host: mongoose.connection.host,
    dbName: mongoose.connection.db?.databaseName || 'unknown',
    hasEnvUri: !!process.env.MONGODB_URI,
    isInMemoryFallback: isInMemory,
    connectionError: dbError
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/operations', operationsRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({
    message: 'An internal server error occurred.',
    error: err.message || 'Unknown error',
  });
});

// Start Server Wrapper
const startServer = async () => {
  try {
    // Connect to database (with automatic in-memory fallback)
    await connectDB();
    
    // Seed default credentials if empty
    await seedIfEmpty();
    
    // Listen to Port
    app.listen(PORT, () => {
      console.log(`[Server] Running successfully on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Critical boot failure:', error);
    process.exit(1);
  }
};

startServer();
