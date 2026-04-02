import * as k8s from '@kubernetes/client-node';

/**
 * Create a KubeConfig that points to the local kubectl proxy.
 * This bypasses certificate issues by connecting through the proxy.
 * 
 * @param port The port where kubectl proxy is listening
 * @returns A KubeConfig configured to use the local proxy
 */
export function createProxyConfig(port: number): k8s.KubeConfig {
	// Load the default kubeconfig to get context info
	const defaultKc = new k8s.KubeConfig();
	defaultKc.loadFromDefault();

	const currentCluster = defaultKc.getCurrentCluster();
	const currentUser = defaultKc.getCurrentUser();
	const currentContext = defaultKc.getCurrentContext();

	// Create a cluster config pointing to the local proxy
	const cluster = {
		name: currentCluster?.name || 'proxy-cluster',
		server: `http://127.0.0.1:${port}`,
		// No TLS needed - proxy handles authentication
	};

	// Copy user but remove exec-based auth (proxy handles it)
	const user: k8s.User = {
		name: currentUser?.name || 'proxy-user',
	};

	// Create context linking cluster and user
	const context = {
		name: currentContext || 'proxy-context',
		user: user.name,
		cluster: cluster.name,
	};

	// Build the new KubeConfig for proxy connection
	const proxyKc = new k8s.KubeConfig();
	proxyKc.loadFromOptions({
		clusters: [cluster],
		users: [user],
		contexts: [context],
		currentContext: context.name,
	});

	return proxyKc;
}