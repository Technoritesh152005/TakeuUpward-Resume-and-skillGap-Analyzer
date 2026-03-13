import logger from '../../utils/logs.js';
import textextractor from './text_extractor.parser.js';
import { resumeStructureInstance } from '../ai.services/analyze_resume_structure.js';

class resumeParser {

    async parseResume(buffer, mimetype) {
        try {

            // taking text from resume providing their meme type
            logger.info(`Fetching text from resume : ${buffer}`)
            // we get all text from parser
            const textdata = await textextractor.textExtractorFromDifferentTypes(buffer, mimetype)
            console.log(textdata)
            if (!textdata) {
                logger.error(`Failed to fetch text from resume`)  
                throw new Error("Failed to extract text from resume")  
            }

            // we pass this text to ai claude service where he will give it in structured format
            logger.info(`Fetching structure data from claude ai ....`);
            const aiStructuredData = await resumeStructureInstance.analyzeResumeStructure(
              textdata.text
            );

            // additional checks for extracting email , urls and phonenumber cause ai can make mistakes while extracting this
            const emails = textextractor.extractEmailText(textdata.text)
            const phone = textextractor.extractPhone(textdata.text)
            const urls = textextractor.extractUrls(textdata.text)

            const parsedData = {
                personal: {
                    ...aiStructuredData.personal,
                    emails: emails[0] || aiStructuredData.personal?.email || null,
                    phone: phone[0] || aiStructuredData.personal?.phone || null,

                },
                summary: aiStructuredData.summary,
                eduaction: aiStructuredData.education || [],
                experience: aiStructuredData.experience || [],
                skills: aiStructuredData.skills || {},
                projects: aiStructuredData.projects || [],
                certifications: aiStructuredData.certifications || [],
                achievements: aiStructuredData.achievements || [],

            }

            const wordCount = textextractor.countWords(textdata.text)
            const rawText = textextractor.cleanText(textdata.text)
            const pageCount = textdata.pages || null

            return {
                parsedData,
                wordCount,
                rawText,
                pageCount,
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