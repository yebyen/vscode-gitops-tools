# Implementation Tasks

## Phase 1: Security Audit & Documentation

- [x] Run `npm audit` on all three package locations and document baseline
- [x] Create backup branch before making changes

## Phase 2: Non-Breaking Dependency Updates

- [x] Update root package.json patch/minor versions via `npm update`
- [~] Update `semver` to ^7.7.4 (fixes ReDoS vulnerability)
- [~] Update `jose` to latest (security fix)
- [ ] Update `@types/node` to 20.x
- [ ] Update webview dependencies: `solid-js` to ^1.9.12 (XSS fix)
- [ ] Update webview dependencies: `@vscode/codicons` to ^0.0.45
- [ ] Run `npm install` and verify build compiles
- [ ] Run tests to verify no regressions

## Phase 3: Breaking Dependency Updates

- [ ] Update `@kubernetes/client-node` from ^0.16.2 to ^1.4.0
- [ ] Review and fix any API changes in kubernetes client usage
- [ ] Update `@vscode/extension-telemetry` to ^1.5.1
- [ ] Update `uuid` to latest compatible version
- [ ] Update `vite` in webviews to ^5.x (not 8.x)
- [ ] Update `vite-plugin-solid` to compatible version
- [ ] Run full test suite after each major update

## Phase 4: Dev Dependency Updates

- [ ] Update `typescript` to ^5.x
- [ ] Update `webpack` and `webpack-cli` to latest 5.x
- [ ] Update `ts-loader` to latest
- [ ] Update `mocha` to ^11.x (or latest compatible)
- [ ] Update `@vscode/test-electron` to latest
- [ ] Defer ESLint 9 update (requires flat config migration)

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