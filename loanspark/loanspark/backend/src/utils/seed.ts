import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loanspark');
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  console.log('Cleared users');

  const users = [
    { name: 'Admin User',        email: 'admin@loanspark.com',        password: 'Admin@123',   role: 'admin' },
    { name: 'Sales Executive',   email: 'sales@loanspark.com',        password: 'Sales@123',   role: 'sales' },
    { name: 'Sanction Officer',  email: 'sanction@loanspark.com',     password: 'Sanct@123',   role: 'sanction' },
    { name: 'Disburse Officer',  email: 'disburse@loanspark.com',     password: 'Disbu@123',   role: 'disbursement' },
    { name: 'Collection Agent',  email: 'collect@loanspark.com',      password: 'Colle@123',   role: 'collection' },
    { name: 'Raj Kumar',         email: 'borrower@loanspark.com',     password: 'Borro@123',   role: 'borrower' },
  ];

  for (const u of users) {
    await User.create(u);
    console.log(`✅ Created: ${u.email} (${u.role})`);
  }

  console.log('\n🌱 Seed complete! Credentials:');
  users.forEach(u => console.log(`  ${u.role.padEnd(15)} ${u.email.padEnd(30)} ${u.password}`));
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
