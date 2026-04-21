import { extractPdfText } from '../../services/parser/pdf.parser.js';
import { docxInstance } from '../../services/parser/docx.parser.js';
import logger from '../../utils/logs.js';

class TextExtractor {

    async textExtractorFromDifferentTypes(file, mime) {

        try {
            switch (mime) {
                // if its pdf this case will handle
                case 'application/pdf':

                    const pdfresult = await extractPdfText(file)
                    
                    return {
                       text : pdfresult.text,
                       count :this.countWords(pdfresult.text),
                       pages:pdfresult.pages
                    }
                // if its docx this case will handle\
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':

                    const docxresult = await docxInstance.docxTextParser(file)

                    return {
                        text:docxresult.text,
                        messages:docxresult.messages,
                        wordcount:this.countWords(docxresult.text)
                    }


                default:
                    throw new Error(`Failed to parse wrong multimedia Types`)
            }
        } catch (error) {
            logger.error(`Failed to parse wrong multimedia Types`)
        }
    }

    // function to count words
    countWords(text) {
        if (!text) {
            return 0
        }
        //it breaks string into arrays
        return text.split(" ").length
    }

    cleanText(text) {
        if (!text) {
            return 0
        }
        return text
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines
            .trim();
    }

    extractEmailText(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
        // it compares the email format in text and return it
        return text.match(emailRegex) || []

    }

    extractPhone(text){
        const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        return text.match(phoneRegex) || []
    }

    extractUrls(text){
        const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
    }
}

// means we cant access class method without creating object?we can use it only if its static?
const textextractor = new TextExtractor()
export default textextractor
