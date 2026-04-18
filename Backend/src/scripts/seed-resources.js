import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import resourcesData from '../data/resource.js';
import resourceModel from '../models/resources.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const normalizeResource = (resource) => ({
  ...resource,
  title: String(resource.title || '').trim(),
  provider: String(resource.provider || '').trim(),
  url: String(resource.url || '').trim(),
  category: String(resource.category || '').trim(),
  difficulty: String(resource.difficulty || '').trim(),
  platform: String(resource.platform || '').trim(),
  language: String(resource.language || 'English').trim(),
  skillsCovered: Array.isArray(resource.skillsCovered) ? resource.skillsCovered : [],
  prerequisites: Array.isArray(resource.prerequisites) ? resource.prerequisites : [],
  learningObjectives: Array.isArray(resource.learningObjectives) ? resource.learningObjectives : [],
  targetAudience: Array.isArray(resource.targetAudience) ? resource.targetAudience : [],
  tags: Array.isArray(resource.tags) ? resource.tags : [],
  keywords: Array.isArray(resource.keywords) ? resource.keywords : [],
  popularity: Number(resource.popularity) || 0,
  reviewcount: Number(resource.reviewcount) || 0,
  estimatedTimeToComplete: Number(resource.estimatedTimeToComplete) || 0,
  rating: Number(resource.rating) || 0,
  isActive: resource.isActive !== false,
  hasFreeVersion: Boolean(resource.hasFreeVersion),
  isPremium: Boolean(resource.isPremium),
});

const seedResources = async () => {

  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in Backend/.env');
  }

  await mongoose.connect(process.env.DATABASE_URL);

  try {
    const normalizedResources = resourcesData.map(normalizeResource);
    let inserted = 0;
    let updated = 0;

    for (const resource of normalizedResources) {
      const existing = await resourceModel.findOne({ url: resource.url }).select('_id');

      if (existing) {
        await resourceModel.updateOne({ _id: existing._id }, { $set: resource });
        updated += 1;
      } else {
        await resourceModel.create(resource);
        inserted += 1;
      }
    }

    const total = await resourceModel.countDocuments();
  } finally {
    await mongoose.disconnect();
  }
};

seedResources()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
