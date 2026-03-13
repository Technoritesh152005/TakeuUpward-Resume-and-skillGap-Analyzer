// npm install mammoth
// mammoth is best for extracting text from .docx files.
import mammoth from "mammoth";
import logger from '../../utils/logs.js'

// we first extract text from docx where formating or texture is not maintained but if we convert it to html it maintains structure everything and formatting
// mammoth requires object
class docxParser {

    async docxTextParser(buffer) {

        try {
            const docxtext = await mammoth.extractRawText({ buffer })

            return {
                // gives actual content
                text: docxtext.value,
                // gives warning messages
                messages: docxtext.messages
            }
        } catch (err) {
            logger.error(`Faced difficulty to extract text from docx : ${err.message}`)
            throw new Error("Docx parser failed")
        }
    }

    async docxHtmlConvert (buffer){
        
        try{
            const htmldocxdata = await mammoth.convertToHtml({buffer})

        return {
            html:htmldocxdata.value,
            messages:htmldocxdata.messages,
        }
        }catch(err){
            logger.error(`Faced difficulty to convert text to html : ${err.message}`)
            throw new Error("Docx html converter failed")
        }
    }
}

const docxInstance = new docxParser()
export {docxInstance}