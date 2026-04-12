import jobRolesData from '../data/jobRoleData.js'
import jobRoleModel from '../models/jobrole.model.js'
import logger from '../utils/logs.js'

const makeSlug = (value = '') =>
    String(value)
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()

const normalizeJobRole = (role) => ({
    ...role,
    title: String(role?.title || '').trim(),
    slug: makeSlug(role?.title || ''),
    category: String(role?.category || '').trim(),
    experienceLevel: String(role?.experienceLevel || '').trim(),
    description: String(role?.description || '').trim(),
    responsibilities: Array.isArray(role?.responsibilities) ? role.responsibilities : [],
    requiredSkills: {
        critical: Array.isArray(role?.requiredSkills?.critical) ? role.requiredSkills.critical : [],
        important: Array.isArray(role?.requiredSkills?.important) ? role.requiredSkills.important : [],
        niceToHave: Array.isArray(role?.requiredSkills?.niceToHave) ? role.requiredSkills.niceToHave : [],
    },
    salaryRange: {
        min: Number(role?.salaryRange?.min) || 0,
        max: Number(role?.salaryRange?.max) || 0,
        currency: String(role?.salaryRange?.currency || 'USD').trim(),
        period: String(role?.salaryRange?.period || 'yearly').trim(),
    },
})

 const jobseed = async()=>{

    try{

        logger.info('Try to delete the job roles')
        await jobRoleModel.deleteMany({})
        logger.info('Successfully deleted existing job roles')

        const normalizedRoles = jobRolesData.map(normalizeJobRole)
        const inserted = await jobRoleModel.insertMany(normalizedRoles)
        logger.info(`Succesfully inserted ${inserted.length} job roles`)

        console.log('Grouping job roles by category')
       const categories = await jobRoleModel.aggregate([
            // groups all the jobrole in samecategory and count their count
        { $group:{ _id:'$category' , count : { $sum: 1}}},
        // sort them in more count wise
        {$sort:{count:-1}}
        ])
        categories.forEach((cat) => {
            console.log(`   ${cat._id}: ${cat.count} roles`);
          });
         
        return inserted
    }catch(error){
        logger.error(`Failed to seed job roles: ${error.message}`);
    throw error;
    }
    
}
export default jobseed
