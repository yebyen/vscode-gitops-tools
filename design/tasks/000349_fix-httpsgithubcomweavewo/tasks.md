# Implementation Tasks: HelmRelease Values IntelliSense Support

## Phase 1: Foundation

- [x] Create `src/language/` directory for language feature modules
- [x] Implement `src/language/helmReleaseDetector.ts` - detect HelmRelease resources in YAML documents
- [x] Implement `src/language/chartReferenceParser.ts` - extract chart name, version, and sourceRef from HelmRelease spec

## Phase 2: Schema Retrieval

- [x] Implement `src/language/schemaCache.ts` - in-memory and disk caching for JSON schemas
- [x] Implement `src/language/helmChartSchemaFetcher.ts` - fetch and extract `values.schema.json` from Helm chart archives
- [x] Add support for fetching charts from HelmRepository sources

## Phase 3: IntelliSense Provider

- [~] Implement `src/language/helmReleaseValuesCompletionProvider.ts` - VSCode CompletionItemProvider for values field
- [ ] Register completion provider in `src/extension.ts`
- [ ] Add hover provider for property documentation from schema

## Phase 4: Validation

- [ ] Implement diagnostic provider for values validation against schema
- [ ] Register diagnostic collection and update on document change

## Phase 5: Testing & Polish

- [ ] Add unit tests for HelmRelease detection
- [ ] Add unit tests for schema parsing
- [ ] Test with real Helm charts that have schemas (e.g., traefik, bitnami charts)
- [ ] Handle edge cases: missing schema, invalid schema, offline mode
- [ ] Update README with feature documentation