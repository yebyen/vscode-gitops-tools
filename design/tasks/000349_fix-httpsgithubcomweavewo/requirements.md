# Requirements: HelmRelease Values IntelliSense Support

## Overview

Add IntelliSense (code completion and validation) for the `values` field in HelmRelease resource definitions, using JSON schemas bundled with Helm charts.

## User Stories

### US1: Values Auto-completion
**As a** GitOps user editing HelmRelease YAML files  
**I want** auto-completion suggestions for the `values` field  
**So that** I can quickly and correctly configure Helm chart values without referring to documentation

### US2: Values Validation
**As a** GitOps user editing HelmRelease YAML files  
**I want** inline validation/linting of my `values` configuration  
**So that** I catch configuration errors before deploying

## Acceptance Criteria

1. **Schema Detection**
   - Extension detects HelmRelease resources in YAML files
   - Extension identifies the referenced Helm chart from `spec.chart.spec.chart` and `spec.chart.spec.sourceRef`

2. **Schema Retrieval**
   - Extension fetches the `values.schema.json` from the referenced Helm chart
   - Schemas are cached to avoid repeated fetches

3. **IntelliSense Integration**
   - Code completion appears when editing inside `spec.values`
   - Hover documentation shows property descriptions from schema
   - Validation errors appear for invalid values

4. **Graceful Degradation**
   - No errors if chart doesn't have a schema
   - Feature works offline with cached schemas
   - Does not break existing extension functionality

## Out of Scope

- Creating schemas for charts that don't have them
- Supporting Kustomization patch overlays on HelmRelease values
- Real-time chart repository syncing