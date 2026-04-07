class AdzunaService {
    constructor() {
        this.baseUrl = 'https://api.adzuna.com/v1/api/jobs'
        this.appId = process.env.ADZUNA_APP_ID
        this.apiKey = process.env.ADZUNA_API_KEY
        this.country = (process.env.ADZUNA_COUNTRY || 'in').toLowerCase()
    }

    isConfigured() {
        return Boolean(this.appId && this.apiKey && this.country)
    }

    buildSearchUrl({ roleTitle, location, page = 1, pageSize = 10 }) {
        const normalizedPage = Math.max(1, Number(page) || 1)
        const normalizedPageSize = Math.max(1, Math.min(20, Number(pageSize) || 10))

        const params = new URLSearchParams({
            app_id: this.appId,
            app_key: this.apiKey,
            results_per_page: String(normalizedPageSize),
            what: String(roleTitle || '').trim(),
            'content-type': 'application/json',
        })

        if (location) {
            params.set('where', String(location).trim())
        }

        return `${this.baseUrl}/${this.country}/search/${normalizedPage}?${params.toString()}`
    }

    normalizeJob(job = {}) {
        return {
            source: 'adzuna',
            externalId: job?.id ? String(job.id) : null,
            title: job?.title || 'Untitled role',
            company: job?.company?.display_name || 'Unknown company',
            location: job?.location?.display_name || 'Location not specified',
            contractType: job?.contract_type || null,
            contractTime: job?.contract_time || null,
            salaryMin: Number.isFinite(job?.salary_min) ? job.salary_min : null,
            salaryMax: Number.isFinite(job?.salary_max) ? job.salary_max : null,
            created: job?.created || null,
            redirectUrl: job?.redirect_url || null,
            description: job?.description || '',
            category: job?.category?.label || null,
        }
    }

    async searchJobs({ roleTitle, location, page = 1, pageSize = 10 }) {
        if (!this.isConfigured()) {
            throw new Error('Adzuna is not configured. Missing APP ID or API key.')
        }

        if (!roleTitle || !String(roleTitle).trim()) {
            throw new Error('Role title is required for Adzuna search.')
        }

        const url = this.buildSearchUrl({ roleTitle, location, page, pageSize })
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            const safeUrl = url
                .replace(`app_id=${this.appId}`, 'app_id=***')
                .replace(`app_key=${this.apiKey}`, 'app_key=***')
            throw new Error(`Adzuna search failed with status ${response.status} for ${safeUrl}: ${errorText}`)
        }

        const payload = await response.json()
        const results = Array.isArray(payload?.results) ? payload.results : []

        return {
            source: 'adzuna',
            totalResults: Number(payload?.count) || results.length,
            page: Math.max(1, Number(page) || 1),
            pageSize: Math.max(1, Math.min(20, Number(pageSize) || 10)),
            jobs: results.map((job) => this.normalizeJob(job)),
        }
    }
}

const adzunaService = new AdzunaService()
export default adzunaService
