# Implementation Tasks

## Phase 1: Security Audit & Documentation

- [x] Run `npm audit` on all three package locations and document baseline
- [x] Create backup branch before making changes

## Phase 2: Non-Breaking Dependency Updates

- [x] Update root package.json patch/minor versions via `npm update`
- [x] Update `semver` to ^7.7.1 (fixes ReDoS vulnerability)
- [x] Update `jose` to ^5.10.0 (security fix)
- [x] Update `@types/node` to ^20.17.50
- [ ] Update webview dependencies: `solid-js` to ^1.9.12 (XSS fix)
- [ ] Update webview dependencies: `@vscode/codicons` to ^0.0.45
- [x] Run `npm install` and verify build compiles
- [ ] Run tests to verify no regressions

## Phase 3: Breaking Dependency Updates

- [x] Update `@kubernetes/client-node` from ^0.16.2 to ^1.0.0
- [x] Review and fix any API changes in kubernetes client usage
- [x] Update `@vscode/extension-telemetry` to ^0.9.8
- [x] Update `uuid` to ^11.1.0
- [x] Fix `change-case` API (paramCase -> kebabCase)
- [x] Replace deprecated `request` module with native `https`
- [x] Fix `glob` API for async usage
- [ ] Update `vite` in webviews to ^5.x (not 8.x)
- [ ] Update `vite-plugin-solid` to compatible version
- [ ] Run full test suite after each major update

## Phase 4: Dev Dependency Updates

- [x] Update `typescript` to ^5.8.3
- [x] Update `webpack` to ^5.99.9 and `webpack-cli` to ^6.0.1
- [x] Update `ts-loader` to ^9.5.2
- [x] Update `mocha` to ^11.1.0
- [x] Update `@vscode/test-electron` to ^2.5.2
- [x] Defer ESLint 9 update (requires flat config migration) - kept at ^8.57.1

## Phase 5: GitHub Actions Updates

- [ ] Update `actions/checkout` from v3 to v4
- [ ] Update `actions/setup-node` from v3 to v4
- [ ] Standardize Node.js version to 20 in all workflows
- [ ] Review and update `engineerd/setup-kind` version
- [ ] Pin `fluxcd/flux2/action` to specific release tag instead of main
- [ ] Update `HaaLeo/publish-vscode-extension` to latest
- [ ] Update `ncipollo/release-action` to latest

## Phase 6: Add Security Scanning to CI

- [ ] Add `npm audit --audit-level=high` step to ci.yml for root package
- [ ] Add `npm audit` step for webview-ui/createFromTemplate
- [ ] Add `npm audit` step for webview-ui/configureGitOps
- [ ] Add `npm ci` before audit steps to ensure clean install
- [ ] Test CI workflow on a PR

## Phase 7: Verification & Cleanup

- [ ] Run `npm audit` and verify 0 high/critical vulnerabilities
- [ ] Run full build: `npm run compile`
- [ ] Run tests: `npm test`
- [ ] Run linting: `npm run lint`
- [ ] Build webviews: `npm run build:webview`
- [ ] Test extension manually in VS Code
- [ ] Update package-lock.json files (commit them)
- [ ] Update CHANGELOG.md with security updates