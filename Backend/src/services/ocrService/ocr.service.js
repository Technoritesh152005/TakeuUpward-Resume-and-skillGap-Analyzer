import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import logger from '../../utils/logs.js';

// length of the text to maintain to use this fallback
const MINIMUM_NATIVE_TEXT_THRESHOLD_LENGTH = 300;
// path to ur python ocr script
const OCR_SCRIPT_PATH = path.resolve(process.cwd(), 'Backend/src/scripts/ocr_resume.py');

// cleans text
const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

class OcrService {

    constructor() {
        Controls:

// OCR ON/OFF using env
// Which Python to use
        this.isEnabled = String(process.env.OCR_FALLBACK_ENABLED).toLowerCase() === 'true';
        this.pythonPath = process.env.PYTHON_PATH || 'python';
    }

    // if the text is under that limit it return true and if true we start ocr
    shouldUseOcrFallback(text) {
        const normalizedText = normalizeText(text);
        return normalizedText.length > 0 && normalizedText.length < MINIMUM_NATIVE_TEXT_THRESHOLD_LENGTH;
    }

    async extractTextWithTesseract(fileBuffer) {
        if (!this.isEnabled) {
            return {
                text: '',
                used: false,
                status: 'not_needed',
            };
        }

        // creates temp file which store pdf temp
        const tempFilePath = path.join(os.tmpdir(), `resume-ocr-${Date.now()}.pdf`);

        try {
            await fs.writeFile(tempFilePath, fileBuffer);
            // call python
            const result = await this.runPythonOcr(tempFilePath);

            return {
                text: normalizeText(result.text),
                used: Boolean(result.text),
                status: result.success ? 'completed' : 'failed',
            };
        } catch (error) {
            logger.error(`OCR fallback failed: ${error.message}`);
            return {
                text: '',
                used: false,
                status: 'failed',
            };
        } finally {
            // delete temp file
            await fs.unlink(tempFilePath).catch(() => {});
        }
    }

    runPythonOcr(filePath) {
        return new Promise((resolve, reject) => {
            const child = spawn(this.pythonPath, [OCR_SCRIPT_PATH, filePath], {
                env: process.env,
                windowsHide: true,
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (chunk) => {
                stdout += chunk.toString();
            });

            child.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });

            child.on('error', (error) => {
                reject(error);
            });

            child.on('close', (code) => {
                try {
                    const parsed = JSON.parse(stdout || '{}');

                    if (code !== 0 || !parsed.success) {
                        return reject(new Error(parsed.error || stderr || 'Python OCR process failed'));
                    }

                    resolve(parsed);
                } catch (error) {
                    reject(new Error(stderr || `Invalid OCR response: ${error.message}`));
                }
            });
        });
    }
}

const ocrServiceInstance = new OcrService();
export default ocrServiceInstance;
