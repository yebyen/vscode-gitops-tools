# Update dependencies to latest versions and add security scanning

## Summary

This PR modernizes all NPM dependencies to their latest secure versions and implements automated security scanning in the CI pipeline. The update addresses 30+ vulnerabilities including 4 critical and 11 high severity issues.

## Changes

### Security Fixes
- **@kubernetes/client-node**: Updated from 0.16.x to 1.0.0 (fixes jsonpath-plus RCE, tar path traversal)
- **solid-js**: Updated to 1.9.3 (fixes XSS vulnerability)
- **semver**: Updated to 7.7.1 (fixes ReDoS)
- **jose**: Updated to 5.10.0 (security fix)
- Replaced deprecated `request` module with native `https`

### Dependency Updates
- TypeScript 4.5.5 → 5.8.3
- webpack 5.70.0 → 5.99.9
- Vite 2.9.13 → 5.4.19 (webviews)
- mocha 9.2.2 → 11.1.0
- glob 7.2.0 → 11.0.2

### CI/CD Improvements
- Added `npm audit --audit-level=high` security scanning job
- Updated GitHub Actions: checkout v3→v4, setup-node v3→v4
- Standardized Node.js version to 20 across all workflows
- Pinned `fluxcd/flux2/action` to v2.4.0 (was `main`)

### Breaking Change Migrations
- `change-case`: `paramCase()` → `kebabCase()`
- `@vscode/extension-telemetry`: New constructor API (connection string)
- `@kubernetes/client-node`: Object parameter style for API calls
- `glob`: Async/await API instead of callbacks

## Testing

- [x] `npm run compile` - builds successfully
- [x] `npm run lint` - passes
- [x] `npm audit` - 0 high/critical vulnerabilities in production deps
- [x] Webview builds (`createFromTemplate`, `configureGitOps`) - successful

## Remaining Vulnerabilities

3 low/moderate vulnerabilities remain in `mocha` dev dependencies (diff, serialize-javascript). These only affect the test framework, not production code, and have no fix available yet.