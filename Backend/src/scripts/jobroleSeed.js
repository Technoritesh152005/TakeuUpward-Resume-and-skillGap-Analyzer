import jobRolesData from '../data/jobRoleData.js'
import jobRoleModel from '../models/jobrole.model.js'
import logger from '../utils/logs.js'
import mongoose from 'mongoose'
import { connectDb } from '../db/db.connect.js'
import dotenv from 'dotenv'
import path from 'path'

// Ensure env vars are loaded when running this script directly
dotenv.config({ path: path.join(process.cwd(), '.env') })
 const jobseed = async()=>{

    try{
        await connectDb()

        logger.info('Try to delete the job roles')
        await jobRoleModel.deleteMany({})
        logger.info('Successfully deleted existing job roles')

        // `insertMany` doesn't reliably trigger `pre('save')` hooks, so we must generate `slug` here.
        const toSlug = (title = '') =>
            title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');

        const payload = jobRolesData.map((r) => ({
            ...r,
            slug: r.slug || toSlug(r.title),
        }));

        const inserted = await jobRoleModel.insertMany(payload)
        logger.info(`Succesfully inserted ${inserted.length} job roles`)

        console.log('Grouping job roles by category')
       const categories = await jobRoleModel.aggregate(
            // groups all the jobrole in same category and counts them
            [
                { $group: { _id: '$category', count: { $sum: 1 } } },
                // sort them in more count wise
                { $sort: { count: -1 } }
            ]
        )
        categories.forEach((cat) => {
            console.log(`   ${cat._id}: ${cat.count} roles`);
          });

        return inserted
    }catch(error){
        logger.error(`Failed to seed job roles: ${error.message}`);
        // Also print to console so the seed script output shows the reason
        console.error('Failed to seed job roles:', error);
        throw error;
    } finally {
        // Best effort close so the script can terminate
        try {
            await mongoose.connection.close(false)
        } catch {}
    }
    
}
export default jobseed

// Execute when run via `node src/scripts/jobroleSeed.js`
jobseed().catch((err) => {
  logger.error(`Failed to seed job roles (script entry): ${err.message}`);
  console.error('Seed script entry failed:', err);
  process.exit(1);
});