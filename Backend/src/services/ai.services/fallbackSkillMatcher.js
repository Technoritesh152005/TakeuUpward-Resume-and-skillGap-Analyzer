const SKILL_ALIAS_MAP = {
    javascript: ['js', 'javascript', 'ecmascript'],
    typescript: ['ts', 'typescript'],
    'node.js': ['node.js', 'nodejs', 'node'],
    react: ['react', 'react.js', 'reactjs'],
    vue: ['vue', 'vue.js', 'vuejs'],
    angular: ['angular', 'angularjs'],
    git: ['git', 'github', 'git version control'],
    sql: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'sql database'],
    nosql: ['nosql', 'mongodb', 'mongo', 'document database'],
    'rest api': ['rest api', 'rest apis', 'restful api', 'rest api development', 'api development'],
    cloud: ['cloud', 'aws', 'gcp', 'azure', 'cloud basics'],
    docker: ['docker', 'containers', 'containerization'],
    cicd: ['ci/cd', 'ci cd', 'continuous integration', 'continuous deployment'],
    graphql: ['graphql'],
    testing: ['testing', 'jest', 'mocha', 'cypress', 'testing frameworks', 'unit testing'],
};

const normalizeValue = (value = '') => String(value)
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[.+]/g, ' ')
    .replace(/[^a-z0-9/&\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toDisplayValue = (value = '') => String(value)
    .replace(/\s+/g, ' ')
    .trim();

const pushVariant = (set, value) => {
    const normalized = normalizeValue(value);
    if (normalized) {
        set.add(normalized);
    }
};

const buildCompositeParts = (value) => {
    const normalized = normalizeValue(value);
    if (!normalized) return [];

    // Split phrases like "Node.js / Express" or "React and Redux" so each part can match independently.
    return normalized
        .split(/\s*(?:\/|&|\bor\b|\band\b|,)\s*/g)
        .map((part) => normalizeValue(part))
        .filter(Boolean);
};

const expandSkillVariants = (value) => {
    const variants = new Set();
    const normalized = normalizeValue(value);

    if (!normalized) return [];

    pushVariant(variants, normalized);

    const compositeParts = buildCompositeParts(normalized);
    compositeParts.forEach((part) => pushVariant(variants, part));

    for (const [canonical, aliases] of Object.entries(SKILL_ALIAS_MAP)) {
        const canonicalVariants = [canonical, ...aliases].map(normalizeValue);
        // If any known alias is present, add the full alias family so matching works across naming differences
        // like "node", "nodejs", and "node.js".
        const matchesKnownVariant = canonicalVariants.some((entry) =>
            normalized.includes(entry) || compositeParts.includes(entry)
        );

        if (matchesKnownVariant) {
            canonicalVariants.forEach((entry) => pushVariant(variants, entry));
        }
    }

    return Array.from(variants);
};

const collectArrayValues = (items, collector) => {
    if (!Array.isArray(items)) return;

    items.forEach((item) => {
        if (typeof item === 'string') {
            collector(item);
            return;
        }

        collector(item?.title);
        collector(item?.skill);
        collector(item?.name);
        collector(item?.description);
        collector(item?.summary);
        collector(item?.relevance);
        collector(item?.uniqueAdvantage);
    });
};

const collectStructuredSkillValues = (items, collector) => {
    if (!Array.isArray(items)) return;

    items.forEach((item) => {
        if (typeof item === 'string') {
            collector(item);
            return;
        }

        collector(item?.title);
        collector(item?.skill);
        collector(item?.name);
    });
};

const extractCandidateSkillSet = (resumeData = {}) => {
    const skillSet = new Set();
    const addValue = (value) => {
        expandSkillVariants(value).forEach((variant) => skillSet.add(variant));
    };

    // Build one normalized skill universe from explicit skills plus resume evidence text.
    // ATS and fallback analyses use this to answer "does the resume show evidence for X?"
    [
        resumeData?.summary,
        resumeData?.personal?.headline,
    ].forEach(addValue);

    collectArrayValues(resumeData?.skills?.technical, addValue);
    collectArrayValues(resumeData?.skills?.tools, addValue);
    collectArrayValues(resumeData?.skills?.frameworks, addValue);
    collectArrayValues(resumeData?.skills?.language, addValue);
    collectArrayValues(resumeData?.skills?.languages, addValue);
    collectArrayValues(resumeData?.skills?.database, addValue);
    collectArrayValues(resumeData?.skills?.databases, addValue);
    collectArrayValues(resumeData?.skills?.others, addValue);

    (resumeData?.experience || []).forEach((item) => {
        addValue(item?.title);
        addValue(item?.description);
        collectArrayValues(item?.responsibilities, addValue);
        collectArrayValues(item?.achievements, addValue);
        collectArrayValues(item?.highlights, addValue);
        collectArrayValues(item?.technologies, addValue);
        collectArrayValues(item?.skillsUsed, addValue);
    });

    (resumeData?.project || resumeData?.projects || []).forEach((item) => {
        addValue(item?.title);
        addValue(item?.description);
        collectArrayValues(item?.technologies, addValue);
        collectArrayValues(item?.highlights, addValue);
        collectArrayValues(item?.bulletPoints, addValue);
    });

    return skillSet;
};

const extractStructuredResumeSkills = (resumeData = {}) => {
    const skillSet = new Set();
    const addValue = (value) => {
        const displayValue = toDisplayValue(value);
        if (displayValue) {
            skillSet.add(displayValue);
        }
    };

    collectStructuredSkillValues(resumeData?.skills?.technical, addValue);
    collectStructuredSkillValues(resumeData?.skills?.tools, addValue);
    collectStructuredSkillValues(resumeData?.skills?.frameworks, addValue);
    collectStructuredSkillValues(resumeData?.skills?.language, addValue);
    collectStructuredSkillValues(resumeData?.skills?.languages, addValue);
    collectStructuredSkillValues(resumeData?.skills?.database, addValue);
    collectStructuredSkillValues(resumeData?.skills?.databases, addValue);
    collectStructuredSkillValues(resumeData?.skills?.others, addValue);

    (resumeData?.experience || []).forEach((item) => {
        collectStructuredSkillValues(item?.technologies, addValue);
        collectStructuredSkillValues(item?.skillsUsed, addValue);
    });

    (resumeData?.project || resumeData?.projects || []).forEach((item) => {
        collectStructuredSkillValues(item?.technologies, addValue);
    });

    return Array.from(skillSet);
};

const getRoleSkillList = (jobRole = {}) => {
    const orderedSkills = [];
    const seen = new Set();
    const addSkill = (value) => {
        const displayValue = toDisplayValue(value);
        const normalized = normalizeValue(displayValue);

        if (!displayValue || seen.has(normalized)) {
            return;
        }

        // Preserve role skill order so critical skills stay ahead of important/nice-to-have in downstream output.
        seen.add(normalized);
        orderedSkills.push(displayValue);
    };

    [
        ...(jobRole?.requiredSkills?.critical || []),
        ...(jobRole?.requiredSkills?.important || []),
        ...(jobRole?.requiredSkills?.niceToHave || []),
    ].forEach((item) => {
        addSkill(item?.title || item?.skill || item?.name);
    });

    return orderedSkills;
};

const matchRoleSkill = (candidateSkillSet, rawSkill) => {
    const variants = expandSkillVariants(rawSkill);
    return variants.some((variant) => candidateSkillSet.has(variant));
};

const skillsOverlap = (leftSkill, rightSkill) => {
    // Overlap is alias-aware, so "CI/CD" and "continuous integration" count as the same concept.
    const leftVariants = expandSkillVariants(leftSkill);
    const rightVariants = new Set(expandSkillVariants(rightSkill));

    return leftVariants.some((variant) => rightVariants.has(variant));
};

export {
    expandSkillVariants,
    extractCandidateSkillSet,
    extractStructuredResumeSkills,
    getRoleSkillList,
    matchRoleSkill,
    skillsOverlap,
};
