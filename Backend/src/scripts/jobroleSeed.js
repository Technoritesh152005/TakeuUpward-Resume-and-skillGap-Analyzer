import jobRolesData from '../data/jobRoleData.js'
import jobRoleModel from '../models/jobrole.model.js'
import logger from '../utils/logs.js'
 const jobseed = async()=>{

    try{

        logger.info('Try to delete the job roles')
        await jobRoleModel.deleteMany({})
        logger.info('Successfully deleted existing job roles')

        const inserted = await jobRoleModel.insertMany(jobRolesData)
        logger.info(`Succesfully inserted ${inserted.length} job roles`)

        console.log('Grouping job roles by category')
       const categories = await jobRoleModel.aggregate(
            // groups all the jobrole in samecategory and count their count
        { $group:{ _id:'$category' , count : { $sum: 1}}},
        // sort them in more count wise
        {$sort:{count:-1}}
        )
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