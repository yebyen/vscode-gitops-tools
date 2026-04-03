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