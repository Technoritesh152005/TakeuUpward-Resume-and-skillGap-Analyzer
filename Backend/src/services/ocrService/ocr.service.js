import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import logger from '../../utils/logs.js';

// length of the text to maintain to use this fallback
const MINIMUM_NATIVE_TEXT_THRESHOLD_LENGTH = 300;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// keep script lookup stable regardless of whether the backend starts from repo root or Backend/
const OCR_SCRIPT_PATH = path.resolve(__dirname, '../../scripts/ocr_resume.py');

// cleans text
const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

class OcrService {

    constructor() {
        // OCR ON/OFF using env and allow overriding the Python executable path.
        this.isEnabled = String(process.env.OCR_FALLBACK_ENABLED).toLowerCase() === 'true';
        this.pythonPath = process.env.PYTHON_PATH || 'python';
    }

    // OCR should also run when native extraction returns noisy garbage, not only short text.
    shouldUseOcrFallback(text) {
        const normalizedText = normalizeText(text);

        if (!normalizedText) {
            return true;
        }

        if (normalizedText.length < MINIMUM_NATIVE_TEXT_THRESHOLD_LENGTH) {
            return true;
        }

        const readableWordCount = (normalizedText.match(/[A-Za-z]{2,}/g) || []).length;
        const alphaCharacters = (normalizedText.match(/[A-Za-z]/g) || []).length;
        const alphaRatio = alphaCharacters / normalizedText.length;

        if (readableWordCount < 40) {
            return true;
        }

        if (alphaRatio < 0.45) {
            return true;
        }

        return false;
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
