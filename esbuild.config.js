const { build } = require('esbuild');
const { dependencies } = require('./package.json');

// Get all dependencies to mark as external
const externalDependencies = Object.keys(dependencies || {});

build({
  entryPoints: ['./src/index.ts'],  // Set the correct main entry file
  bundle: true,                    // Bundle the app into a single file
  platform: 'node',                // Specify Node.js platform
  target: 'es2020',                // JavaScript version to compile to
  format: 'cjs',                   // Output format (CommonJS)
  outdir: 'dist',                  // Output directory
  sourcemap: true,                 // Generate sourcemaps for debugging
  tsconfig: './tsconfig.json',     // Use your TypeScript config file
  external: [
    ...externalDependencies,       // Exclude all dependencies from the bundle
    'typeorm', 
    'reflect-metadata',
    'swagger-ui-express',          // Additional externals
    './src/swagger_output.json'    // Avoid bundling JSON files
  ],
}).then(() => {
  console.log('Build finished successfully');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
