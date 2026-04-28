# Requirements: OCI Helm Repositories Status Display Fix

## Issue Reference
https://github.com/weaveworks/vscode-gitops-tools/issues/511

## Problem Statement
OCI-type Helm Repositories are always displayed with a failure icon (red X) even when there is no error. This happens because OCI registries don't return status conditions like traditional Helm repositories - they are accessed on-demand and don't fetch an index.

## User Stories

### US-1: View OCI Helm Repository Status
**As a** GitOps user  
**I want** OCI Helm Repositories to show a green checkmark when there's no error  
**So that** I can quickly distinguish between healthy and failed sources

## Acceptance Criteria

### AC-1: OCI HelmRepository with no status shows success
- **Given** a HelmRepository with `spec.type: oci`
- **And** the repository has no status conditions (empty or undefined)
- **And** the repository is not suspended
- **When** viewing the Sources tree view
- **Then** the repository displays a green checkmark icon

### AC-2: OCI HelmRepository with error status shows failure
- **Given** a HelmRepository with `spec.type: oci`
- **And** the repository has status conditions with `status: False`
- **When** viewing the Sources tree view
- **Then** the repository displays a red error icon

### AC-3: Traditional HelmRepository behavior unchanged
- **Given** a HelmRepository with `spec.type: default` (or no type specified)
- **When** viewing the Sources tree view
- **Then** the status icon logic remains unchanged (success if Ready=True, error otherwise)

### AC-4: Suspended OCI HelmRepository displays correctly
- **Given** a HelmRepository with `spec.type: oci` and `spec.suspend: true`
- **When** viewing the Sources tree view
- **Then** the pause icon (⏸) appears in the description as expected