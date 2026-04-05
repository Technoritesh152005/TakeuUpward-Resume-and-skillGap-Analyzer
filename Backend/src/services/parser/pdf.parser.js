import pdfparser from 'pdf-parse'
import logger from '../../utils/logs.js'

const extractPdfText = async function (pdf){
    try{

       const pdfdata = await pdfparser(pdf)

       return {
        text:pdfdata.text,
        pageno:pdfdata.numpages,
        info:pdfdata.info
       }
    }catch(err){
        logger.error(`'Pdf parsing error ${err.message}'`)
        throw new Error("Failed to parse pdf ")
    }
}

const extractPdfMetaData = async function (pdf){
    try{
        const pdfMetadata = await pdfparser(pdf)

        return {
            pages:pdfMetadata.numpages,
            version:pdfMetadata.version,
            info:pdfMetadata.info,
            metadata:pdfMetadata.metadata
        }
    }catch(error){
        logger.error(`Failed to extract meta data from pdf .. Error is ${error.message}`)
        throw new Error("Failed to parse pdf metadat")
    }
}
export {extractPdfMetaData,extractPdfText}
