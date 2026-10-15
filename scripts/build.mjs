// Build: bundles the 3 ESM entry points with esbuild into dist/js and copies the remaining static files
// from src/.
import { build } from 'esbuild';
import { cpSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const jsDir = resolve('src/js');
const entries = ['index', 'ui-index', 'ui-config'];

// package.json is "type": "module", so esbuild would treat the vendored jQuery as ESM and find no export.
// Wrap it so it gets a CommonJS-style `module` (it sets module.exports when present) and a default export.
const jqueryFile = resolve(jsDir, 'jquery.min.js');
const jquery = {
    name: 'jquery',
    setup(b) {
        b.onLoad({ filter: /jquery\.min\.js$/ }, (args) => {
            if (args.path !== jqueryFile) return undefined;
            const source = readFileSync(args.path, 'utf8');
            return {
                contents: `var module = { exports: {} };
${source}
export default module.exports;
`,
                loader: 'js',
                resolveDir: jsDir,
            };
        });
    },
};

rmSync('dist', { recursive: true, force: true });
cpSync('src', 'dist', { recursive: true, filter: (p) => resolve(p) !== jsDir });
await build({
    entryPoints: entries.map((e) => resolve(jsDir, e + '.js')),
    outdir: 'dist/js',
    bundle: true,
    format: 'iife',
    target: 'chrome100',
    loader: { '.json': 'json' },
    alias: { jquery: jqueryFile },
    plugins: [jquery],
    logLevel: 'warning',
});
console.log('Built src/ -> dist/ (entries: ' + entries.join(', ') + ')');
