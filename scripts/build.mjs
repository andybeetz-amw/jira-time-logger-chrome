// Build: bundles the 3 entry points with esbuild into dist/js and copies the remaining static files
// from src/. Modules in src/js are still AMD (define/require); the plugin below bridges them into the
// bundle by name until they are converted to ESM (P2.1b-h), then it is removed.
import { build } from 'esbuild';
import { cpSync, readFileSync, rmSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

const jsDir = resolve('src/js');
const entries = ['index', 'ui-index', 'ui-config'];
const notAmd = ['jquery.min.js', 'require.js'];

// A module name -> file: 'jquery' and 'json!/config/config.json' are special, everything else is baseUrl-relative.
const resolveName = (name) => {
    if (name === 'jquery') return resolve(jsDir, 'jquery.min.js');
    if (name.startsWith('json!')) return resolve('src', name.slice('json!'.length).replace(/^\//, ''));
    return resolve(jsDir, name + '.js');
};

const amdBridge = {
    name: 'amd-bridge',
    setup(b) {
        b.onResolve({ filter: /.*/ }, (args) => {
            if (args.kind === 'entry-point' || /^([./]|[A-Za-z]:)/.test(args.path)) return undefined;
            return { path: resolveName(args.path) };
        });
        b.onLoad({ filter: /\.js$/ }, (args) => {
            const rel = relative(jsDir, args.path);
            if (rel.startsWith('..') || notAmd.includes(rel.split(sep).pop())) return undefined;
            const source = readFileSync(args.path, 'utf8');
            const match = /\b(define|require)\(\s*\[([^\]]*)\]/.exec(source);
            if (!match) return undefined; // already ESM: bundled as-is
            const deps = [...match[2].matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
            const imports = deps
                .map((d, i) => (d === 'require' ? '' : `import __d${i} from ${JSON.stringify(d)};\n`))
                .join('');
            const values = deps.map((d, i) => (d === 'require' ? '__require' : `__d${i}`)).join(', ');
            // 'require' as a dependency is used only for synchronous lookups of modules also listed as deps.
            const prelude =
                `${imports}var __m;\n` +
                `var __names = ${JSON.stringify(deps)};\n` +
                `var __vals = [${values}];\n` +
                `function __require(n) { return __vals[__names.indexOf(n)]; }\n` +
                `function ${match[1]}(deps, factory) { __m = factory.apply(null, __vals); }\n`;
            return { contents: `${prelude}${source}\nexport default __m;\n`, loader: 'js', resolveDir: jsDir };
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
    plugins: [amdBridge],
    logLevel: 'warning',
});
console.log('Built src/ -> dist/ (entries: ' + entries.join(', ') + ')');
