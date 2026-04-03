# Requirements: Dependency Updates & Security Scanning

## Overview

Update all outdated dependencies in the vscode-gitops-tools repository to their latest versions and implement automated NPM security scanning in the CI/CD pipeline.

## User Stories

### US1: Dependency Audit
**As a** maintainer  
**I want** a complete index of all outdated dependencies across all package.json files  
**So that** I can track and prioritize updates systematically

**Acceptance Criteria:**
- [ ] Index covers root `package.json`
- [ ] Index covers `webview-ui/createFromTemplate/package.json`
- [ ] Index covers `webview-ui/configureGitOps/package.json`
- [ ] Each entry shows current version, wanted version, and latest version

### US2: Security Vulnerability Remediation
**As a** security-conscious maintainer  
**I want** all known vulnerabilities in NPM dependencies fixed  
**So that** users are not exposed to security risks

**Acceptance Criteria:**
- [ ] All critical vulnerabilities resolved (currently 4)
- [ ] All high severity vulnerabilities resolved (currently 11)
- [ ] All moderate vulnerabilities resolved where possible (currently 10)
- [ ] Breaking changes documented with migration notes

### US3: Automated Security Scanning
**As a** maintainer  
**I want** `npm audit` to run automatically on PRs and pushes  
**So that** new vulnerabilities are caught before merge

**Acceptance Criteria:**
- [ ] `npm audit` runs in CI workflow
- [ ] Build fails on critical/high vulnerabilities
- [ ] Audit results visible in PR checks
- [ ] All three package.json locations are scanned

### US4: GitHub Actions Updates
**As a** maintainer  
**I want** all GitHub Actions pinned to latest stable versions  
**So that** CI uses current, secure, and performant tooling

**Acceptance Criteria:**
- [ ] `actions/checkout` updated to v4
- [ ] `actions/setup-node` updated to v4
- [ ] Node.js version consistent (20 LTS) across workflows
- [ ] All other actions reviewed and updated

## Out of Scope

- Container image scanning (no Docker files in this repo)
- SAST/DAST tooling beyond npm audit
- License compliance scanning