import api from '../communication/api.js'

export const createAnalysis = async (data) => {
    const response = await api.post('/analysis/create-analysis', data)
    return response.data

}

export const compareMultipleRoles = async (data) => {
    const response = await api.post('/analysis/compare-roles', data)
    return response.data
}

export const getMyAnalysis = async (params = {}) => {
    const response = await api.get('/analysis/all-analysis', { params })
    return response.data
}

export const getAnalysisById = async (id) => {
    const response = await api.get(`/analysis/${id}`)
    return response.data
}
export const regenerateAnalysis = async (id, data) => {
    const response = await api.put(`/analysis/${id}`, data)
    return response.data

}
export const deleteAnalysis = async (id) => {
    const response = await api.delete(`/analysis/${id}`)
    return response.data
}

// analysis takes time so we check every 2 sec whether its status is completed
export const pollAnalysisStatus = async (id, maxAteempts = 60, interval = 2000) => {

    let attempts = 0;

    return new Promise((resolve, reject) => {
        const poll = setInterval(async () => {


            try {
                attempts++
                const response = await getAnalysisById(id)
                const result = response.data
                console.log(result)
                if (result.status === 'completed') {
                    clearInterval(poll)
                    resolve(result)
                }
                else if(result.status === 'failed'){
                    clearInterval(poll)
                    reject(new Error(result.error || 'analysis Failed during this is checked it in pollanalysis status'))
                }
                else if(attempts >= maxAteempts){
                    clearInterval(poll)
                    reject(new Error('Analysi took to time - ANALYSIS TIMED OUT!'))
                }
            }
            catch(error){
                clearInterval(poll);
                reject(error);
            }
        },interval)
    })
}

export default {
    pollAnalysisStatus,
    createAnalysis,
    compareMultipleRoles,
    getMyAnalysis,
    getAnalysisById,
    regenerateAnalysis,
    deleteAnalysis
}