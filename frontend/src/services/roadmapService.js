import api from '../communication/api.js'


const extractPayload = (payload)=>{

  const data = payload?.data 
  if(!data) return null

  if(data?.data !== undefined) return data.data
  if(data?.result !== undefined) return data.result

  return data
}

const asArray = (value , fallbackkey = 'roadmap') =>{

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.[fallbackkey])) return value[fallbackkey];
  return [];
}

const buildQueryString = (query)=>{

  const params = new URLSearchParams()

  Object.entries(query).map(([key,value]) =>{
    if(value !== undefined && value !== null && value !==''){
      params.set(key,value)
    }
  })
  const queries = params.toString()
  return queries? `?${queries}` : ``
}


const roadmapServices = ()=>{

  creatRoadmap= async(analysisId , userPreferences )=>{
    const response = await api.post('/roadmap',{
      analysisId,
      ...(userPreferences ? {userPreferences} : {}),
    })
    return extractPayload(response)
  }

  getMyRoadmaps = async(query = {})=>{

    const response = api.get(`roadmap${buildQueryString(query)}`)
    const payload = extractPayload(response)
    return {
      raw : payload,
      docs : asArray(payload, 'roadmaps'),
      pagination : payload?.pagination || null
    }
  }

  getRoadmapById = async(id)=>{
    const response = api.get(`/roadmap/${id}`)
    return extractPayload(response)
  }

  getRoadmapByAnalysis = async(analysisId)=>{
    const response = api.get(`/roadmap/analysis/${analysisId}`)
    return extractPayload(response)
  }

  getRoadmapProgress = async(roadmapid)=>{
    const response = api.get(`/roadmap/${roadmapid}/progress`)
    return extractPayload(response)
  }
  markItemComplete = async({roadmapId , phaseIndex , weekIndex , itemIndex})=>{

    const response = api.get(`/roadmap/${roadmapId}/mark-item-complete` , {
      phaseIndex,
      weekIndex,
      itemIndex
    })
    return extractPayload(response)
  }

  updatePreference: async ({ roadmapId, hoursPerWeek, budget, learningStyle }) => {
    const response = await api.put(`/roadmap/${roadmapId}/update-preference`, {
      ...(hoursPerWeek !== undefined ? { hoursPerWeek } : {}),
      ...(budget ? { budget } : {}),
      ...(learningStyle ? { learningStyle } : {}),
    });
    return extractPayload(response);
  }
}
export default roadmapServices