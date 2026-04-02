import * as k8s from '@kubernetes/client-node';
import { createInformers, destroyInformers } from './informers';
import { kubeProxyConfig } from './kubectlProxy';

export let k8sCoreApi: k8s.CoreV1Api | undefined;
export let k8sCustomApi: k8s.CustomObjectsApi | undefined;

/**
 * Create Kubernetes API clients using the proxy configuration.
 * Also initializes informers for real-time updates.
 */
export function createK8sClients(): void {
	destroyK8sClients();

	if (kubeProxyConfig) {
		k8sCoreApi = kubeProxyConfig.makeApiClient(k8s.CoreV1Api);
		k8sCustomApi = kubeProxyConfig.makeApiClient(k8s.CustomObjectsApi);

		// Start informers for real-time updates
		createInformers(kubeProxyConfig);
	}
}

/**
 * Destroy Kubernetes API clients and stop informers.
 */
export function destroyK8sClients(): void {
	destroyInformers();

	k8sCoreApi = undefined;
	k8sCustomApi = undefined;
}

/**
 * Check if K8s clients are currently available.
 */
export function hasK8sClients(): boolean {
	return k8sCoreApi !== undefined && k8sCustomApi !== undefined;
}
