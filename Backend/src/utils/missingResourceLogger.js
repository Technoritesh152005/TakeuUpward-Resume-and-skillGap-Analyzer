import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Missing resource entry is based in txt file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const logFilePath = path.join(__dirname, '../data/missing-resources.txt')

const sanitizeInline = (value = '') => String(value || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const logMissingResource = ({
    item,
    generatedUrl,
    roadmapId = '',
    analysisId = '',
    userId = '',
    source = 'roadmap_generation',
}) => {
    const title = sanitizeInline(item?.title || 'Learning resource')
    const type = sanitizeInline(item?.type || 'tutorial')
    const skillsCovered = Array.isArray(item?.skillsCovered)
        ? item.skillsCovered.map((skill) => sanitizeInline(skill)).filter(Boolean).join(', ')
        : ''

    const logEntry = [
        `\n[${new Date().toISOString()}]`,
        `source=${sanitizeInline(source)}`,
        `roadmapId=${sanitizeInline(roadmapId)}`,
        `analysisId=${sanitizeInline(analysisId)}`,
        `userId=${sanitizeInline(userId)}`,
        `type=${type}`,
        `title=${title}`,
        `skills=${skillsCovered || 'none'}`,
        `fallbackUrl=${sanitizeInline(generatedUrl || '')}`,
        '---',
    ].join('\n')

    fs.appendFileSync(logFilePath, logEntry, 'utf8')
}

export default logMissingResource
