import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Robust Multi-Environment Configuration Loader
 * 
 * Determines which .env file to load based on NODE_ENV with the following priority:
 * 1. .env.${NODE_ENV}.local
 * 2. .env.${NODE_ENV} (e.g. .env.dev, .env.prod, .env.local)
 * 3. Aliases (e.g. development -> .env.dev, production -> .env.prod)
 * 4. .env.local
 * 5. .env
 */
export function loadEnv(): void {
  const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
  const candidates: string[] = [];

  if (nodeEnv) {
    candidates.push(`.env.${nodeEnv}.local`);
    candidates.push(`.env.${nodeEnv}`);
    if (nodeEnv === 'development') candidates.push('.env.dev');
    if (nodeEnv === 'dev') candidates.push('.env.development');
    if (nodeEnv === 'production') candidates.push('.env.prod');
    if (nodeEnv === 'prod') candidates.push('.env.production');
  }

  candidates.push('.env.local');
  candidates.push('.env');

  for (const file of candidates) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: true });
      if (!process.env.__ENV_LOADED) {
        console.log(`⚙️  Loaded environment config from: ${file} (NODE_ENV: ${nodeEnv || 'local/default'})`);
        process.env.__ENV_LOADED = file;
      }
      return;
    }
  }

  // Fallback to default dotenv
  dotenv.config();
}

// Automatically load on import
loadEnv();
