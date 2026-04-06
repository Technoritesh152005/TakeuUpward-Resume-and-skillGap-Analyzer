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

const pushVariant = (set, value) => {
    const normalized = normalizeValue(value);
    if (normalized) {
        set.add(normalized);
    }
};

const buildCompositeParts = (value) => {
    const normalized = normalizeValue(value);
    if (!normalized) return [];

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

const extractCandidateSkillSet = (resumeData = {}) => {
    const skillSet = new Set();
    const addValue = (value) => {
        expandSkillVariants(value).forEach((variant) => skillSet.add(variant));
    };

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

const matchRoleSkill = (candidateSkillSet, rawSkill) => {
    const variants = expandSkillVariants(rawSkill);
    return variants.some((variant) => candidateSkillSet.has(variant));
};

export {
    expandSkillVariants,
    extractCandidateSkillSet,
    matchRoleSkill,
};
