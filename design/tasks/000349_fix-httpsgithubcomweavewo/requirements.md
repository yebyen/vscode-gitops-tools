# Requirements: HelmRelease Values IntelliSense Support

## Background

### What is Helm?

**Helm** is the most popular package manager for Kubernetes - similar to `apt` for Ubuntu or `npm` for Node.js, but for Kubernetes applications. A Helm "chart" is a package containing all the Kubernetes resource definitions needed to deploy an application (like Traefik, PostgreSQL, or Grafana).

### What is Flux and HelmRelease?

**Flux** is a GitOps tool that automates Kubernetes deployments. Instead of manually running `helm install`, you declare what you want in a YAML file stored in Git, and Flux continuously ensures your cluster matches that desired state.

A **HelmRelease** is a Flux custom resource that tells Flux: "Install this Helm chart with these settings." Example:

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: traefik
spec:
  chart:
    spec:
      chart: traefik           # Which Helm chart to install
      sourceRef:
        kind: HelmRepository
        name: traefik-repo
  values:                       # <-- Configuration for the chart
    dashboard:
      enabled: true
    ports:
      web:
        port: 8080
```

### The Problem

The `values` field is where users configure the application. Each Helm chart has different configuration options - Traefik has `dashboard.enabled`, PostgreSQL has `auth.password`, etc. These can be deeply nested with hundreds of options.

Currently, users type these values blind, often making typos or using wrong types, only discovering errors after deployment fails.

### The Solution

Some Helm charts include a `values.schema.json` file that describes all valid configuration options (types, defaults, descriptions). This feature would use that schema to provide auto-completion and validation as users edit HelmRelease files in VS Code.

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