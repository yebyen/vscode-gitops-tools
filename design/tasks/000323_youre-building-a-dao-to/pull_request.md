# Add DAO co-maintainer infrastructure for autonomous extension maintenance

## Summary

This PR implements a DAO (Decentralized Autonomous Organization) system to maintain the VS Code GitOps Tools extension autonomously. The DAO exercises judgment, works in public, and publishes releases when it determines they're ready.

## Changes

### Documentation
- `.github/DAO.md` - Explains the DAO co-maintainer model, what it does, and how it operates
- `.github/dao-config.yml` - Configuration for DAO operational settings
- `README.md` - Updated with "Community Fork" notice explaining the DAO maintenance model

### Workflows
- `dao-audit.yml` - Security and code auditing on PRs (npm audit, sensitive code detection)
- `dao-release.yml` - Autonomous release management with audit reports and rationale
- `dao-issue-triage.yml` - Automatic issue labeling, duplicate detection, and missing info requests
- `dao-stale.yml` - Stale issue cleanup (30-day warning, 60-day close)
- `dao-upstream-sync.yml` - Weekly monitoring and merging of upstream Weaveworks changes
- `dao-pr-review.yml` - Automated PR review with security checks and merge guidance
- `dao-dependency-check.yml` - Weekly dependency auditing and vulnerability tracking

## Key Features

- **Autonomous releases** - DAO decides when to release based on PR count and time thresholds
- **Transparent decisions** - All triage, review, and release decisions are documented publicly
- **Supply chain security** - Treats all code (including upstream) as untrusted until vetted
- **Public audit reports** - Every release includes a YAML audit report explaining what was checked

## Philosophy

This is an open source project, not a business. The DAO works alongside human collaborators as a co-maintainer, not a servant awaiting approval. Humans can use the extension, file bugs, and contribute PRs - the DAO handles the maintenance work.

## Testing

Workflows can be tested by:
1. Opening a PR to trigger `dao-audit.yml` and `dao-pr-review.yml`
2. Creating an issue to trigger `dao-issue-triage.yml`
3. Manually triggering `dao-release.yml` via workflow_dispatch