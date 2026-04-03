# Design: Dependency Updates & Security Scanning

## Architecture Overview

This task involves three distinct areas:
1. **Dependency Index** - Document all outdated packages
2. **Dependency Updates** - Upgrade packages across 3 package.json files
3. **CI Security Scanning** - Add `npm audit` to GitHub Actions workflows

## Package Locations

| Location | Purpose |
|----------|---------|
| `/package.json` | Main VS Code extension |
| `/webview-ui/createFromTemplate/package.json` | Solid.js webview for template creation |
| `/webview-ui/configureGitOps/package.json` | Solid.js webview for GitOps configuration |

## Dependency Update Index

### Root package.json - Critical Updates

| Package | Current | Latest | Breaking? | Notes |
|---------|---------|--------|-----------|-------|
| `@kubernetes/client-node` | ^0.16.2 | 1.4.0 | **Yes** | Major version jump, fixes critical vulns (jsonpath-plus, tar, request) |
| `@vscode/extension-telemetry` | ^0.4.7 | 1.5.1 | **Yes** | Major version change |
| `change-case` | ^4.1.2 | 5.4.4 | **Yes** | ESM-only in v5 |
| `git-url-parse` | ^13.0.0 | 16.1.0 | Maybe | Check changelog |
| `uuid` | ^9.0.0 | 13.0.0 | **Yes** | Major version change |
| `shelljs` | ^0.8.5 | 0.10.0 | Maybe | Minor but check |

### Root package.json - Dev Dependencies

| Package | Current | Latest | Breaking? |
|---------|---------|--------|-----------|
| `@types/node` | 14.x | 20.x | No |
| `typescript` | ^4.5.5 | 5.x | Maybe |
| `eslint` | ^8.11.0 | 9.x | **Yes** |
| `mocha` | ^9.2.2 | 11.x | **Yes** |
| `webpack` | ^5.70.0 | 5.99+ | No |

### Webview Dependencies (both webviews)

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `solid-js` | ^1.3.13 | 1.9.12 | Security fix for XSS |
| `vite` | ^2.9.13 | 8.x | **Major breaking change** - stay on 5.x or 6.x |
| `@vscode/codicons` | ^0.0.32 | 0.0.45 | Minor update |

## Key Decisions

### Decision 1: Handle Breaking Changes Incrementally
- **Choice**: Update non-breaking dependencies first, then tackle major versions
- **Rationale**: Reduces risk, allows testing between updates

### Decision 2: @kubernetes/client-node Update Strategy
- **Choice**: Update to 1.4.0 despite major version bump
- **Rationale**: Current version has 4 critical vulnerabilities (jsonpath-plus RCE, tar path traversal)

### Decision 3: Vite Version for Webviews
- **Choice**: Update to Vite 5.x (not 8.x)
- **Rationale**: Vite 8 requires Node 20+ and has significant config changes; 5.x is stable

### Decision 4: Security Scan Implementation
- **Choice**: Add dedicated `npm audit` step to existing `ci.yml` workflow
- **Rationale**: Simpler than new workflow; runs on every PR

## CI Security Scanning Design

Add to `.github/workflows/ci.yml`:

```yaml
- name: Security audit (root)
  run: npm audit --audit-level=high

- name: Security audit (webview-ui/createFromTemplate)
  run: npm audit --audit-level=high
  working-directory: webview-ui/createFromTemplate

- name: Security audit (webview-ui/configureGitOps)
  run: npm audit --audit-level=high
  working-directory: webview-ui/configureGitOps
```

**Audit Level**: `high` - Fails on high/critical only. Moderate issues logged but don't block.

## GitHub Actions Updates

| Action | Current | Target |
|--------|---------|--------|
| `actions/checkout` | v3 (f43a0e5) | v4 |
| `actions/setup-node` | v3 (5e21ff4) | v4 |
| `engineerd/setup-kind` | v0.5.0 | Review/update |
| `fluxcd/flux2/action` | main branch | Pin to release tag |
| Node.js version | 19 (build-vsix), 20 (ci) | 20 LTS consistently |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking API changes in @kubernetes/client-node 1.x | Review migration guide, test k8s operations |
| Vite 5+ config changes | Update vite.config.ts files as needed |
| ESLint 9 flat config | Defer ESLint 9 or migrate eslintrc.json to flat config |

## Testing Strategy

1. Run `npm install` and `npm run compile` after each batch of updates
2. Run `npm test` to verify extension functionality
3. Run `npm run lint` to ensure code style compliance
4. Manual test webviews in VS Code

## Implementation Notes

### Breaking Changes Encountered

1. **change-case v5**: `paramCase()` renamed to `kebabCase()` - simple find/replace in `src/flux/cliArgs.ts`

2. **@vscode/extension-telemetry v0.9.x**: Constructor changed from `(extensionId, version, key)` to `(connectionString)`. Also `sendTelemetryException()` replaced with `sendTelemetryErrorEvent()`.

3. **@kubernetes/client-node v1.x**: 
   - `listClusterCustomObject(group, version, plural)` changed to `listClusterCustomObject({ group, version, plural })`
   - `ListPromise` now expects `Promise<KubernetesListObject<T>>` directly, not `{response, body}`

4. **glob v11**: No longer callback-based. Changed to async/await: `const files = await glob(pattern, { cwd })`

5. **request module**: Deprecated and removed from kubernetes client. Replaced with native `https.get()` in `installFluxCli.ts`.

6. **Vite 5.x**: Requires ESM modules. Added `"type": "module"` to webview package.json files. Removed deprecated `polyfillDynamicImport` option.

7. **typescript-eslint v8**: Some stylistic rules deprecated. Removed `@typescript-eslint/indent`, `@typescript-eslint/semi`, `@typescript-eslint/comma-dangle`, `@typescript-eslint/member-delimiter-style`, `@typescript-eslint/type-annotation-spacing`, `@typescript-eslint/func-call-spacing`. Using base ESLint rules instead.

### Files Modified for API Changes

- `src/flux/cliArgs.ts` - change-case API
- `src/telemetry.ts` - telemetry API
- `src/k8s/informers.ts` - kubernetes client API
- `src/commands/installFluxCli.ts` - replaced request with https
- `src/test/suite/index.ts` - glob async API
- `.eslintrc.json` - updated deprecated rules

### Remaining Vulnerabilities

3 vulnerabilities remain in mocha's dependencies (diff, serialize-javascript) with no fix available. These are dev-only and don't affect production code.

### GitHub Actions SHA Pins Used

- `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (v4)
- `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4)
- `fluxcd/flux2/action@8d5f40dca5aa5d3c0fc3414457dda81dd6ce3f55` (v2.4.0)
- `coactions/setup-xvfb@e0c79e5e67d5c5dcb74b50139e97445b0004a620` (v1.0.1)
- `HaaLeo/publish-vscode-extension@28e2d3f5817fccf23aa9f2db7c7d6b3c1f36f4b0` (v2)
- `ncipollo/release-action@440c8c1cb0ed28b9f43e4d1d670870f059653174` (v1.16.0)
- `repo-sync/pull-request@9f9cf0d8ad7de7b4c49a5cdc38c29ca6193b1e91` (v2.12.1)