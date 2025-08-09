# npm Publishing Setup

This repository now supports publishing to both JSR (JavaScript Registry) and npm. Here's what was added:

## Files Added/Modified

### Build Scripts
- `scripts/build_npm.ts` - Primary build script using dnt (Deno Node Transform)
- `scripts/build_npm_manual.ts` - Fallback manual build script for network issues

### GitHub Actions
- `.github/workflows/publish.yml` - Updated to publish to both JSR and npm
- `.github/workflows/npm-build-test.yml` - Tests npm build on PRs

### Configuration
- `deno.jsonc` - Added npm build tasks
- `.gitignore` - Added npm/ directory to ignore build artifacts

### Documentation
- `README.md` - Updated with npm installation instructions and dual import examples

## How It Works

1. **Primary Method (dnt)**: Uses Deno Node Transform to automatically convert Deno TypeScript code to npm-compatible JavaScript packages with proper Node.js shims.

2. **Fallback Method (manual)**: Performs basic TypeScript-to-JavaScript conversion by processing files directly. This is used when network issues prevent dnt from downloading dependencies.

3. **Dual Publishing**: GitHub Actions workflow publishes to both JSR and npm when tags are pushed.

## Package Structure

The npm package will include:
- ESM format JavaScript files  
- TypeScript definition files
- All exports from `deno.jsonc` mapped to npm package exports
- Support for both import and require (ESM/CommonJS)
- Node.js compatibility shims for Deno APIs

## For Repository Owner

To enable npm publishing:

1. Create npm account at https://www.npmjs.com/signup
2. Generate automation token at https://www.npmjs.com/settings/tokens  
3. Add token as `NPM_TOKEN` secret in repository settings
4. Push a git tag to trigger publishing to both JSR and npm

The package will be published as `@cosense/std` on npm (same as JSR name).