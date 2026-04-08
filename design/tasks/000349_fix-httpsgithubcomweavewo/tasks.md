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

- [x] Implement `src/language/helmReleaseValuesCompletionProvider.ts` - VSCode CompletionItemProvider for values field
- [x] Register completion provider in `src/extension.ts`
- [x] Add hover provider for property documentation from schema

## Phase 4: Validation

- [x] Implement diagnostic provider for values validation against schema
- [x] Register diagnostic collection and update on document change

## Phase 5: Testing & Polish

- [x] Add unit tests for HelmRelease detection
- [x] Add unit tests for schema parsing (covered in detector tests)
- [x] Handle edge cases: missing schema, invalid schema, offline mode (graceful degradation implemented)
- [x] Update README with feature documentation