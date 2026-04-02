# Restore streaming/live-update feature with VS Code 1.85+ compatibility

## Summary

This PR restores the real-time streaming feature that was rolled back in v0.27.0 due to VS Code 1.85 compatibility issues. The original implementation caused UI glitches (overlapping elements, unresponsive menus) when VS Code introduced "Sticky Scroll in tree views."

The fix implements **debounced informer updates** that batch rapid Kubernetes API events before refreshing tree views, preventing the race conditions that caused the UI issues.

## Changes

- Add `src/k8s/kubectlProxy.ts` - Manages kubectl proxy lifecycle with proper cleanup
- Add `src/k8s/createKubeProxyConfig.ts` - Creates KubeConfig pointing to local proxy
- Add `src/k8s/client.ts` - K8s API client initialization using proxy
- Add `src/k8s/informers.ts` - Kubernetes informers with 150ms debounced refresh
- Update `src/extension.ts` - Initialize proxy on activation, cleanup on deactivation
- Update `src/views/treeViews.ts` - Restart proxy on context/kubeconfig changes
- Update `package.json` - Require VS Code ^1.85.0
- Update `CHANGELOG.md` - Document v0.28.0 changes

## Key Technical Decisions

1. **150ms debounce delay**: Batches rapid informer events (add/update/delete) into single tree view refreshes
2. **Standard TreeView refresh**: Uses VS Code's native `refresh()` which preserves expand/collapse state
3. **Graceful error handling**: Informer errors are logged but don't crash the extension; keep-alive mechanism auto-reconnects
4. **Proper cleanup**: Proxy processes are killed on deactivation to prevent zombies

## Testing

- Compiles without errors
- Lint passes with `--fix`
- E2E tests require a live Kubernetes cluster (CI will validate)

## Related Issues

- Fixes #503 (The extension is broken since December)
- Supersedes rollback in #504, #505