import api from '../communication/api.js'

const extractPayload = (response) => {
    const raw = response?.data
    if (!raw) return null

    if (raw?.data !== undefined) return raw.data
    if (raw?.result !== undefined) return raw.result
    return raw
}

const resumeService = {

    uploadResume:async(formData)=>{
        const response = await api.post('/resumes/upload',formData,{
            headers:{
                'Content-Type': 'multipart/form-data',
            }
        })
        return extractPayload(response)
    },

    getMyResume:async(page = 1 , limit = 10)=>{
        const response = await api.get(`/resumes?page=${page}&limit=${limit}`)
        return extractPayload(response);
    },

    getResumeById:async(id)=>{
        const response = await api.get(`/resumes/${id}`)
        return extractPayload(response)
    },

    getResumeSkills:async(id)=>{
        const response = await api.get(`/resumes/${id}/summary-skills`)
        return extractPayload(response)
    },

    deleteResume:async(id)=>{
        const response = await api.delete(`/resumes/${id}`)
        return extractPayload(response)
    },

    reparseResume: async (id) => {
        const response = await api.put(`/resumes/${id}/resume-reparse`)
        return extractPayload(response)
    },
}
export default resumeService
