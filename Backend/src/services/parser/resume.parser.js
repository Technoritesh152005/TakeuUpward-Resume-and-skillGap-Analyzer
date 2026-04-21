import logger from '../../utils/logs.js';
import textextractor from './text_extractor.parser.js';
import resumeStructureInstance from '../ai.services/analyze_resume_structure.js';
import ocrServiceInstance from '../ocrService/ocr.service.js';

const parseFlexibleResumeDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    const raw = String(value).trim();
    if (!raw) return null;

    if (/present|current|now/i.test(raw)) {
        return new Date();
    }

    const monthMap = {
        jan: 0, january: 0,
        feb: 1, february: 1,
        mar: 2, march: 2,
        apr: 3, april: 3,
        may: 4,
        jun: 5, june: 5,
        jul: 6, july: 6,
        aug: 7, august: 7,
        sep: 8, sept: 8, september: 8,
        oct: 9, october: 9,
        nov: 10, november: 10,
        dec: 11, december: 11,
    };

    const normalized = raw
        .replace(/\./g, ' ')
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const numericMonthYearMatch = raw.match(/^\s*(\d{1,2})\s*[-/]\s*(\d{4})\s*$/);
    if (numericMonthYearMatch) {
        const month = Number(numericMonthYearMatch[1]);
        const year = Number(numericMonthYearMatch[2]);

        if (month >= 1 && month <= 12 && Number.isFinite(year)) {
            return new Date(year, month - 1, 1);
        }
    }

    const numericYearMonthMatch = raw.match(/^\s*(\d{4})\s*[-/]\s*(\d{1,2})\s*$/);
    if (numericYearMonthMatch) {
        const year = Number(numericYearMonthMatch[1]);
        const month = Number(numericYearMonthMatch[2]);

        if (month >= 1 && month <= 12 && Number.isFinite(year)) {
            return new Date(year, month - 1, 1);
        }
    }

    const monthYearMatch = normalized.match(/([A-Za-z]+)\s+(\d{4})/);
    if (monthYearMatch) {
        const month = monthMap[monthYearMatch[1].toLowerCase()];
        const year = Number(monthYearMatch[2]);

        if (month !== undefined && Number.isFinite(year)) {
            return new Date(year, month, 1);
        }
    }

    const yearOnlyMatch = normalized.match(/\b(19|20)\d{2}\b/);
    if (yearOnlyMatch) {
        return new Date(Number(yearOnlyMatch[0]), 0, 1);
    }

    const direct = new Date(normalized);
    if (!Number.isNaN(direct.getTime())) {
        return new Date(direct.getFullYear(), direct.getMonth(), 1);
    }

    return null;
};

const normalizeResumeDateFields = (parsedData = {}) => ({
    ...parsedData,
    education: Array.isArray(parsedData.education)
        ? parsedData.education.map((item) => ({
            ...item,
            startDate: parseFlexibleResumeDate(item?.startDate),
            endDate: parseFlexibleResumeDate(item?.endDate),
        }))
        : [],
    experience: Array.isArray(parsedData.experience)
        ? parsedData.experience.map((item) => ({
            ...item,
            startDate: parseFlexibleResumeDate(item?.startDate),
            endDate: item?.current ? null : parseFlexibleResumeDate(item?.endDate),
        }))
        : [],
    project: Array.isArray(parsedData.project)
        ? parsedData.project.map((item) => ({
            ...item,
            startDate: parseFlexibleResumeDate(item?.startDate),
            endDate: parseFlexibleResumeDate(item?.endDate),
        }))
        : [],
    certification: parsedData.certification
        ? {
            ...parsedData.certification,
            issueDate: parseFlexibleResumeDate(parsedData.certification?.issueDate),
            expiryDate: parseFlexibleResumeDate(parsedData.certification?.expiryDate),
        }
        : parsedData.certification,
});

class resumeParser {

    async parseResume(buffer, mimetype) {
        try {

            // taking text from resume providing their meme type
            // this first check whether the native approach is used to extract text properly
            logger.info('Fetching text from resume using native approach')
            // we get all text from parser
            const textdata = await textextractor.textExtractorFromDifferentTypes(buffer, mimetype)
            if (!textdata) {
                logger.error(`Failed to fetch text from resume`)
                throw new Error("Failed to extract text from resume")
            }

            // we atleast got text but we need to check also right that does it have a minimum threshold
            let finalText = textdata.text;
            let ocrText = ''
            let ocrUsed = false
            let ocrStatus = 'not_needed'
            let textExtractionSource = 'native'

            // this tells whther u should use the ocr approach and do u have pdf format only and if no need then u use ur extracted text from native approach
            if (mimetype === 'application/pdf' && ocrServiceInstance.shouldUseOcrFallback(finalText)) {
                const ocrresult = await ocrServiceInstance.extractTextWithTesseract(buffer)

                ocrText = ocrresult.text || ''
                ocrStatus = ocrresult.status
                ocrUsed = ocrresult.used

                // as we r passing final text to caude we need to check whether ocrtext exist and is ocrUsed then we put finaltext to it and textexctractionsource = ocr

                if (ocrresult.used && ocrresult.text) {
                    logger.info('OCR fallback used for this resume upload')
                    finalText = ocrresult.text
                    textExtractionSource = 'ocr'
                }
            }

            // we pass this text to ai claude service where he will give it in structured format
            logger.info(`Fetching structure data from claude ai ....`);
            const aiStructuredData = await resumeStructureInstance.analyzeResumeStructure(
                finalText
            );

            // additional checks for extracting email , urls and phonenumber cause ai can make mistakes while extracting this
            const emails = textextractor.extractEmailText(finalText)
            const phone = textextractor.extractPhone(finalText)
            const urls = textextractor.extractUrls(finalText)

            const parsedData = normalizeResumeDateFields({
                personal: {
                    ...aiStructuredData.personal,
                    email: emails[0] || aiStructuredData.personal?.email || null,
                    phone: phone[0] || aiStructuredData.personal?.phone || null,
                    linkedin: aiStructuredData.personal?.linkedin || null,
                    github: aiStructuredData.personal?.github || null,
                    portfolio: aiStructuredData.personal?.portfolio || null,
                },
                summary: aiStructuredData.summary,
                education: aiStructuredData.education || [],
                experience: aiStructuredData.experience || [],
                skills: {
                    technical: aiStructuredData.skills?.technical || [],
                    tools: aiStructuredData.skills?.tools || [],
                    frameworks: aiStructuredData.skills?.frameworks || [],
                    language: aiStructuredData.skills?.languages || aiStructuredData.skills?.language || [],
                    database: aiStructuredData.skills?.databases || aiStructuredData.skills?.database || [],
                    others: aiStructuredData.skills?.soft || aiStructuredData.skills?.others || [],
                },
                project: aiStructuredData.projects || [],
                // we only take first certificate provided
                certification: Array.isArray(aiStructuredData.certifications)
                    ? aiStructuredData.certifications[0] || {}
                    : aiStructuredData.certifications || {},
                achievments: aiStructuredData.achievements || [],
                language: aiStructuredData.languages || [],
            })

            const wordCount = textextractor.countWords(finalText)
            const rawText = textextractor.cleanText(finalText)
            const pageCount = textdata.pages || null

            return {
                parsedData,
                wordCount,
                rawText,
                pageCount,
                ocrText,
                ocrUsed,
                ocrStatus,
                textExtractionSource,
                extractedContacts: {
                    emails,
                    phone,
                    urls
                }
            }

        } catch (error) {
            logger.error(`Failed to parse resume ${error.message}`)
            throw new Error("Failed to parse resume")
        }


    }

    // quickparse is mostly done to improve user experience by showing necessary details and run resumeparse in bg

    async quickParse(buffer, mime) {

        try {

            const extractedText = await textextractor.textExtractorFromDifferentTypes(buffer, mime)
            if (!extractedText || !extractedText.text) {
                throw new Error("Text extraction failed");
            }

            return {
                wordcount: textextractor.countWords(extractedText.text),
                email: textextractor.extractEmailText(extractedText.text),
                phone: textextractor.extractPhone(extractedText.text),
                urls: textextractor.extractUrls(extractedText.text)
            }
        } catch (error) {
            logger.error(`Quick parser failed : ${error.message}`)
            throw new Error("Quick parser Failed")
        }
    }
}

const resumeParserInstance = new resumeParser();
export default resumeParserInstance
export { normalizeResumeDateFields };
