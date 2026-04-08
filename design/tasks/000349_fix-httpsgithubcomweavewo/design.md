# Design: HelmRelease Values IntelliSense Support

## Overview

This feature adds IntelliSense (auto-completion, hover docs, validation) for the `values` field in Flux HelmRelease resources by leveraging JSON schemas that Helm charts can include (`values.schema.json`).

## Architecture

### Component Flow

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  YAML Document      │────▶│ HelmRelease      │────▶│ Schema Provider │
│  (HelmRelease)      │     │ Detector         │     │                 │
└─────────────────────┘     └──────────────────┘     └────────┬────────┘
                                                              │
                                    ┌─────────────────────────┘
                                    ▼
                            ┌───────────────────┐
                            │ Schema Cache      │
                            │ (in-memory/disk)  │
                            └───────────────────┘
                                    │
                                    ▼
                            ┌───────────────────┐
                            │ VSCode Language   │
                            │ Features (YAML)   │
                            └───────────────────┘
```

### Key Components

1. **HelmRelease Detector** - Identifies HelmRelease resources in YAML files
2. **Chart Reference Parser** - Extracts chart name, version, and source from HelmRelease spec
3. **Schema Fetcher** - Retrieves `values.schema.json` from Helm chart archives
4. **Schema Cache** - Caches fetched schemas to avoid repeated network calls
5. **Completion Provider** - Provides VSCode CompletionItem suggestions

## Technical Approach

### Option A: YAML Language Server Integration (Recommended)

Leverage the existing YAML extension's JSON schema support by dynamically associating schemas with HelmRelease `values` blocks.

**Pros:**
- Uses well-tested YAML/JSON schema infrastructure
- Consistent with how other tools handle YAML schemas
- Less code to maintain

**Cons:**
- Requires coordination with YAML extension
- Schema association is at document level, not nested

### Option B: Custom Completion Provider

Register a `vscode.CompletionItemProvider` specifically for HelmRelease values sections.

**Pros:**
- Full control over completion behavior
- Can scope precisely to `spec.values` blocks

**Cons:**
- More implementation work
- Must implement hover, validation separately

### Decision: Option B - Custom Completion Provider

Given the nested nature of the `values` field within HelmRelease and the need for precise scoping, a custom completion provider offers better control.

## Implementation Details

### New Files

- `src/language/helmReleaseValuesProvider.ts` - Main completion provider
- `src/language/schemaCache.ts` - Schema caching logic
- `src/language/helmChartSchemaFetcher.ts` - Fetch schemas from charts

### Schema Retrieval Strategy

1. Parse HelmRelease to find chart reference
2. Look up HelmRepository/GitRepository source
3. Fetch chart archive (or use cached version from Flux)
4. Extract `values.schema.json` if present
5. Cache schema keyed by chart name + version

### Extension Points

Register in `extension.ts`:
```typescript
vscode.languages.registerCompletionItemProvider(
  { language: 'yaml', scheme: 'file' },
  new HelmReleaseValuesCompletionProvider(),
  '.' // Trigger on property access
);
```

### Caching Strategy

- In-memory cache for current session
- Optional disk cache in extension's globalStorage
- Cache key: `{chartName}:{version}`
- TTL: 24 hours for disk cache

## Constraints & Considerations

1. **Performance** - Schema fetching should be async and not block editor
2. **Network** - Must handle offline scenarios gracefully
3. **Compatibility** - Works with existing YAML extension (ms-kubernetes-tools)
4. **Chart Sources** - Initially support HelmRepository; GitRepository is more complex
5. **Schema Format** - Standard JSON Schema draft-07 (Helm's default)

## Dependencies

- Existing: `@kubernetes/client-node` for cluster access
- New: None required (use built-in fetch/https)

## Risks

| Risk | Mitigation |
|------|------------|
| Chart schema not available | Graceful degradation - no completions |
| Large schemas slow editor | Lazy load, cache aggressively |
| Schema format variations | Validate schema before use |