import ANTHROPIC from '@anthropic-ai/sdk'

// claude is a model which helps us to speak with claude
const claude = new ANTHROPIC(
    {
         apiKey:process.env.ANTHROPIC_API_KEY,
    }
)

const CLAUDE_CONFIG = {
    model:process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    maxTokens:parseInt(process.env.CLAUDE_MAX_TOKENS,10) || 4096,
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.3,
}
export {claude,CLAUDE_CONFIG}