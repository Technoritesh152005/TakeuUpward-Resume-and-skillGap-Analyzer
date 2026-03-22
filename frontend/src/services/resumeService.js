import api from '../communication/api.js'

const resumeService = {

    uploadResume:async(formData)=>{
        const response = await api.post('/resumes/upload',formData,{
            headers:{
                'Content-Type': 'multipart/form-data',
            }
        })
        console.log(response)
        return response.data
    },

    getMyResume:async(page = 1 , limit = 10)=>{
        const response = await api.get(`/resumes?page=${page}&limit=${limit}`)
        return response.data;
    },

    getResumeById:async(id)=>{
        const response = await api.get(`/resumes/${id}`)
        return response.data
    },

    getResumeSkills:async(id)=>{
        const response = await api.get(`/resumes/${id}/summary-skills`)
        return response.data
    },

    deleteResume:async(id)=>{
        const response = await api.delete(`/resumes/${id}`)
        return response.data
    },

    reparseResume:async(id)=>{
        const response = api.post(`/resumes/${id}/reparse-resume`)
        return response.data
    }
}
export default resumeService