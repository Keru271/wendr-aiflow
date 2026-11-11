import { CodingAgentAdapter } from './types.js';
import { GoogleAntigravityAdapter } from './antigravity.js';
import { MockAgentAdapter } from './mock.js';

export * from './types.js';
export * from './workspace.js';
export * from './antigravity.js';
export * from './mock.js';

export function getAgentAdapter(provider: string = 'GOOGLE_ANTIGRAVITY'): CodingAgentAdapter {
  if (provider === 'GOOGLE_ANTIGRAVITY') {
    return new GoogleAntigravityAdapter({
      apiKey: process.env.ANTIGRAVITY_API_KEY,
      baseUrl: process.env.ANTIGRAVITY_BASE_URL,
      model: process.env.ANTIGRAVITY_MODEL || 'gemini-3.8-flash'
    });
  }
  return new MockAgentAdapter();
}

