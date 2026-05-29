import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { Loan } from '../models/Loan';
import { Payment } from '../models/Payment';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const seedUsers = [
  {
    name: 'System Admin',
    email: 'admin@credisea.com',
    password: 'Admin@123',
    role: 'Admin',
  },
  {
    name: 'Sarah Sales',
    email: 'sales@credisea.com',
    password: 'Sales@123',
    role: 'Sales',
  },
  {
    name: 'Samuel Sanction',
    email: 'sanction@credisea.com',
    password: 'Sanction@123',
    role: 'Sanction',
  },
  {
    name: 'Daniel Disbursement',
    email: 'disburse@credisea.com',
    password: 'Disburse@123',
    role: 'Disbursement',
  },
  {
    name: 'Colin Collection',
    email: 'collect@credisea.com',
    password: 'Collect@123',
    role: 'Collection',
  },
  {
    name: 'Bobby Borrower',
    email: 'borrower@credisea.com',
    password: 'Borrower@123',
    role: 'Borrower',
  },
];

export const seedIfEmpty = async (): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[Seeder] Database already contains ${userCount} users. Skipping automatic seeding.`);
      return;
    }

    console.log('[Seeder] Database is empty. Seeding default accounts...');
    
    // Clear loans and payments just in case
    await Loan.deleteMany({});
    await Payment.deleteMany({});

    for (const u of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);

      const user = new User({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        applicationStatus: 'Not_Started',
      });

      await user.save();
      console.log(`[Seeder] Created User: ${user.name} [Role: ${user.role}]`);
    }

    console.log('[Seeder] Database seeded successfully!');
  } catch (error) {
    console.error('[Seeder] Automatic seeding failed:', error);
  }
};

// Standalone execution script
const runSeeder = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/credisea';
    console.log(`[Seeder] Standalone: Connecting to database at ${connUri}...`);
    await mongoose.connect(connUri);

    console.log('[Seeder] Standalone: Purging database...');
    await User.deleteMany({});
    await Loan.deleteMany({});
    await Payment.deleteMany({});

    for (const u of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);

      const user = new User({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        applicationStatus: 'Not_Started',
      });

      await user.save();
      console.log(`[Seeder] Created User: ${user.name} [Role: ${user.role}]`);
    }

    console.log('[Seeder] Standalone: Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Standalone failed:', error);
    process.exit(1);
  }
};

// Only run standalone if executed directly via ts-node
if (require.main === module) {
  runSeeder();
}
