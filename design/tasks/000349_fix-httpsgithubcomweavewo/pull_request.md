# Add IntelliSense support for HelmRelease values field

## Summary

This PR adds IntelliSense (auto-completion, hover documentation, and validation) for the `values` field in Flux HelmRelease resources. When editing HelmRelease YAML files, users now get intelligent suggestions based on the Helm chart's `values.schema.json`.

## Changes

- Add `src/language/` module with HelmRelease detection and parsing
- Implement schema fetching from HelmRepository sources with caching
- Register VSCode completion provider for values field auto-completion
- Register hover provider for property documentation
- Register diagnostic provider for values validation
- Add unit tests for HelmRelease detection
- Update README with feature documentation

## How it works

1. Extension detects HelmRelease resources in YAML files
2. Parses chart reference (name, version, sourceRef)
3. Fetches `values.schema.json` from the Helm chart archive
4. Provides completions, hover docs, and validation based on schema

## Testing

- Unit tests for HelmRelease detection logic
- Manual testing with Helm charts that have schemas (e.g., Traefik)
- Graceful degradation when schema is unavailable

## Notes

- Only HelmRepository sources supported initially (GitRepository/OCI planned for future)
- Schemas are cached to disk with 24-hour TTL for offline use
- Charts without `values.schema.json` silently skip IntelliSense features

Fixes #512