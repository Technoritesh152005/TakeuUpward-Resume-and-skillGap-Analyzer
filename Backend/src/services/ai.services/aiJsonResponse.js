import { generateContentWithFallback } from '../../config/gemini.js';
import logger from '../../utils/logs.js';

const buildDebugPreview = (value, limit = 600) =>
    String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, limit);

const extractJsonBlock = (content) => {
    const source = String(content ?? '');
    const startIndex = source.search(/[\[{]/);

    if (startIndex === -1) {
        return source.trim();
    }

    const opening = source[startIndex];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = startIndex; index < source.length; index += 1) {
        const char = source[index];

        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === opening) {
            depth += 1;
        } else if (char === closing) {
            depth -= 1;
            if (depth === 0) {
                return source.slice(startIndex, index + 1).trim();
            }
        }
    }

    return source.slice(startIndex).trim();
};

const escapeControlCharactersInStrings = (content) => {
    let escapedContent = '';
    let inString = false;
    let escaped = false;

    for (const char of String(content ?? '')) {
        if (inString) {
            if (escaped) {
                escapedContent += char;
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escapedContent += char;
                escaped = true;
                continue;
            }

            if (char === '"') {
                escapedContent += char;
                inString = false;
                continue;
            }

            if (char === '\n') {
                escapedContent += '\\n';
                continue;
            }

            if (char === '\r') {
                escapedContent += '\\r';
                continue;
            }

            if (char === '\t') {
                escapedContent += '\\t';
                continue;
            }

            escapedContent += char;
            continue;
        }

        if (char === '"') {
            inString = true;
        }

        escapedContent += char;
    }

    return escapedContent;
};

const normalizeJsonString = (content) =>
    String(content ?? '')
        .replace(/^\uFEFF/, '')
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â]/g, '"')
        .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/,\s*([}\]])/g, '$1')
        .trim();

const quoteSingleQuotedKeys = (content) =>
    String(content ?? '').replace(/([{,]\s*)'([^'\\]+?)'\s*:/g, '$1"$2":');

const quoteBareKeys = (content) =>
    String(content ?? '').replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');

const normalizeSingleQuotedValues = (content) => String(content ?? '')
    .replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, value) => `: "${value.replace(/"/g, '\\"')}"`)
    .replace(/([\[,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'(?=\s*[,}\]])/g, (_, prefix, value) => `${prefix}"${value.replace(/"/g, '\\"')}"`);

const insertMissingCommas = (content) =>
    String(content ?? '')
        .replace(/"\s*\n\s*"/g, '","')
        .replace(/([}\]])\s*\n\s*([{\["])/g, '$1,$2');

const applyHeuristicRepairs = (content) => {
    const normalized = normalizeJsonString(content);
    const extracted = extractJsonBlock(normalized);

    return insertMissingCommas(
        normalizeSingleQuotedValues(
            quoteBareKeys(
                quoteSingleQuotedKeys(extracted)
            )
        )
    );
};

const buildJsonCandidates = (rawContent) => {
    const normalized = normalizeJsonString(rawContent);
    const extracted = extractJsonBlock(normalized);
    const heuristic = applyHeuristicRepairs(rawContent);

    return [...new Set([
        normalized,
        extracted,
        escapeControlCharactersInStrings(extracted),
        heuristic,
        escapeControlCharactersInStrings(heuristic),
        escapeControlCharactersInStrings(normalized),
    ].filter(Boolean))];
};

const tryParseJsonCandidates = (rawContent) => {
    const candidates = buildJsonCandidates(rawContent);
    let lastError = null;

    for (const candidate of candidates) {
        try {
            return {
                data: JSON.parse(candidate),
                candidate,
            };
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Unable to parse AI JSON response');
};

const repairJsonWithGemini = async ({ label, invalidJson, parseError }) => {
    const repairPrompt = `
You repair malformed JSON returned by another LLM.
Return ONLY valid JSON.
Preserve the original structure and fields as much as possible.
Use double-quoted keys and strings.
Do not add commentary or markdown.

CONTEXT:
- Payload type: ${label}
- Original parse error: ${parseError || 'unknown'}

MALFORMED JSON:
${invalidJson}
`;

    const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0,
            maxOutputTokens: 3200,
        },
    });

    const response = await result.response;
    return normalizeJsonString(response.text());
};

const buildGenerationMeta = ({
    mode,
    label,
    parseError = '',
    repairError = '',
    repairAttempted = false,
    usedRepair = false,
    usedFallback = false,
    fallbackReason = '',
}) => ({
    label,
    provider: 'gemini',
    mode,
    usedRepair,
    usedFallback,
    repairAttempted,
    parseError,
    repairError,
    fallbackReason,
});

const parseAiJsonResponse = async ({
    label,
    rawContent,
    allowRepair = true,
}) => {
    const normalized = normalizeJsonString(rawContent);
    const extracted = extractJsonBlock(normalized);

    try {
        const { data } = tryParseJsonCandidates(rawContent);
        return {
            data,
            meta: buildGenerationMeta({
                label,
                mode: 'ai',
            }),
        };
    } catch (parseError) {
        logger.warn(`Primary ${label.toLowerCase()} JSON parse failed${allowRepair ? ', attempting Gemini repair' : ''}: ${parseError.message}`);
        logger.warn(`${label} AI raw preview: ${buildDebugPreview(rawContent)}`);
        logger.warn(`${label} AI extracted preview: ${buildDebugPreview(extracted)}`);

        if (!allowRepair) {
            return {
                data: null,
                meta: buildGenerationMeta({
                    label,
                    mode: 'fallback',
                    usedFallback: true,
                    parseError: parseError.message,
                    fallbackReason: `${label} AI response JSON was invalid.`,
                }),
            };
        }

        try {
            const repaired = await repairJsonWithGemini({
                label,
                invalidJson: extracted,
                parseError: parseError.message,
            });

            logger.warn(`${label} AI repaired preview: ${buildDebugPreview(repaired)}`);

            const { data } = tryParseJsonCandidates(repaired);

            return {
                data,
                meta: buildGenerationMeta({
                    label,
                    mode: 'ai_repaired',
                    parseError: parseError.message,
                    repairAttempted: true,
                    usedRepair: true,
                }),
            };
        } catch (repairError) {
            logger.warn(`Falling back to deterministic ${label.toLowerCase()} due to unrecoverable AI JSON: ${repairError.message}`);

            return {
                data: null,
                meta: buildGenerationMeta({
                    label,
                    mode: 'fallback',
                    usedFallback: true,
                    parseError: parseError.message,
                    repairError: repairError.message,
                    repairAttempted: true,
                    fallbackReason: `${label} AI response JSON was invalid and could not be repaired.`,
                }),
            };
        }
    }
};

export {
    buildDebugPreview,
    buildGenerationMeta,
    escapeControlCharactersInStrings,
    extractJsonBlock,
    normalizeJsonString,
    parseAiJsonResponse,
    repairJsonWithGemini,
    tryParseJsonCandidates,
};
