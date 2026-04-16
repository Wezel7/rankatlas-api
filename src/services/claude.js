import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// System prompts per agent — geladen vanuit ~/.claude/agents/*.md
function loadAgentSystemPrompt(slug) {
  const agentsDir = join(process.env.HOME, '.claude', 'agents');
  const filePath = join(agentsDir, `${slug}.md`);

  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf-8');
  }

  // Fallback: generieke instructie
  return `Je bent een AI marketing agent voor RankAtlas.
Je helpt met taken rondom SEO, content, en digitale marketing voor het project ${process.env.DEFAULT_PROJECT || 'hydrobag.nl'}.
Geef altijd beknopte, actionable antwoorden in het Nederlands.`;
}

/**
 * Voert een agent uit via de Claude API.
 * @param {string} slug  - agent slug bijv. 'technical-seo'
 * @param {string} prompt - gebruikersprompt
 * @param {number} runId  - agent_runs.id voor logging
 * @returns {{ result: string, tokens_in: number, tokens_out: number }}
 */
export async function runAgent(slug, prompt, runId) {
  const systemPrompt = loadAgentSystemPrompt(slug);

  const stream = await client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [
      { role: 'user', content: prompt }
    ],
  });

  const message = await stream.finalMessage();

  const result = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  return {
    result,
    tokens_in:  message.usage.input_tokens,
    tokens_out: message.usage.output_tokens,
  };
}

/**
 * Snelle Claude call zonder agent context — voor interne taken.
 */
export async function quickCall(prompt, systemPrompt = null) {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: systemPrompt || 'Je bent een behulpzame AI assistent voor RankAtlas.',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content.find(b => b.type === 'text')?.text ?? '';
}
