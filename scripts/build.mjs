// Build: currently copies src/ to dist/ unchanged (still MV2). esbuild bundling arrives in P2.
import { cpSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
cpSync('src', 'dist', { recursive: true });
console.log('Copied src/ -> dist/');
