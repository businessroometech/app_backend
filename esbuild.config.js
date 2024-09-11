const { build } = require('esbuild');
const { dependencies } = require('./package.json');

const externalDependencies = Object.keys(dependencies || {});

build({
  entryPoints: ["src/**/*"],  // Main entry point, imports will be followed
  bundle: true,
  platform: 'node', 
  external: externalDependencies,  // Avoid bundling external dependencies
  outdir: 'dist',                  // Output directory
  sourcemap: true,
  minify: false,                    // Set to true for production
  target: ['es2020'],               // JavaScript target
  tsconfig: './tsconfig.json',      // TypeScript config
  format: 'cjs',                    // CommonJS format
}).then(() => {
  console.log('Build finished');
}).catch(() => process.exit(1));
