import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jobseed from './jobroleSeed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedJobRoles = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in Backend/.env');
  }

  await mongoose.connect(process.env.DATABASE_URL);

  try {
    const inserted = await jobseed();
  } finally {
    await mongoose.disconnect();
  }
};

seedJobRoles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
