import { CodingAgentAdapter } from './types';
import { GoogleAntigravityAdapter } from './antigravity';

export * from './types';
export * from './workspace';
export * from './antigravity';

export function getAgentAdapter(provider: string = 'GOOGLE_ANTIGRAVITY'): CodingAgentAdapter {
  switch (provider.toUpperCase()) {
    case 'GOOGLE_ANTIGRAVITY':
    default:
      return new GoogleAntigravityAdapter();
  }
}
