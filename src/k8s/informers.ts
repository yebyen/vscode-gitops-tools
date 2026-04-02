import * as k8s from '@kubernetes/client-node';
import { KubernetesObject } from '@kubernetes/client-node';
import * as http from 'http';
import { k8sCustomApi } from './client';
import { output } from '../output';
import { refreshSourcesTreeView, refreshWorkloadsTreeView } from '../views/treeViews';

/**
 * Flux Source resource kinds with their API details
 */
const FluxSourceAPIs = [
	{ kind: 'GitRepository', group: 'source.toolkit.fluxcd.io', version: 'v1', plural: 'gitrepositories' },
	{ kind: 'OCIRepository', group: 'source.toolkit.fluxcd.io', version: 'v1beta2', plural: 'ocirepositories' },
	{ kind: 'HelmRepository', group: 'source.toolkit.fluxcd.io', version: 'v1', plural: 'helmrepositories' },
	{ kind: 'Bucket', group: 'source.toolkit.fluxcd.io', version: 'v1beta2', plural: 'buckets' },
];

/**
 * Flux Workload resource kinds with their API details
 */
const FluxWorkloadAPIs = [
	{ kind: 'Kustomization', group: 'kustomize.toolkit.fluxcd.io', version: 'v1', plural: 'kustomizations' },
	{ kind: 'HelmRelease', group: 'helm.toolkit.fluxcd.io', version: 'v2', plural: 'helmreleases' },
];

interface APIParams {
	kind: string;
	group: string;
	version: string;
	plural: string;
}

let informers: k8s.Informer<KubernetesObject>[] = [];

// Debounce state for tree view refreshes
let sourcesRefreshPending = false;
let workloadsRefreshPending = false;
let sourcesRefreshTimeout: NodeJS.Timeout | undefined;
let workloadsRefreshTimeout: NodeJS.Timeout | undefined;

const DEBOUNCE_MS = 150; // Debounce delay in milliseconds

/**
 * Schedule a debounced refresh for sources tree view.
 * Multiple rapid events will be batched into a single refresh.
 */
function scheduleSourcesRefresh(): void {
	if (sourcesRefreshPending) {
		return; // Already scheduled
	}
	sourcesRefreshPending = true;
	
	if (sourcesRefreshTimeout) {
		clearTimeout(sourcesRefreshTimeout);
	}
	
	sourcesRefreshTimeout = setTimeout(() => {
		sourcesRefreshPending = false;
		sourcesRefreshTimeout = undefined;
		refreshSourcesTreeView();
	}, DEBOUNCE_MS);
}

/**
 * Schedule a debounced refresh for workloads tree view.
 * Multiple rapid events will be batched into a single refresh.
 */
function scheduleWorkloadsRefresh(): void {
	if (workloadsRefreshPending) {
		return; // Already scheduled
	}
	workloadsRefreshPending = true;
	
	if (workloadsRefreshTimeout) {
		clearTimeout(workloadsRefreshTimeout);
	}
	
	workloadsRefreshTimeout = setTimeout(() => {
		workloadsRefreshPending = false;
		workloadsRefreshTimeout = undefined;
		refreshWorkloadsTreeView();
	}, DEBOUNCE_MS);
}

/**
 * Create informers for all Flux resources to enable real-time updates.
 * @param kc The KubeConfig to use for connecting to the cluster
 */
export function createInformers(kc: k8s.KubeConfig): void {
	// Create informers for source resources
	FluxSourceAPIs.forEach(api => {
		createInformer(kc, api, 'source');
	});

	// Create informers for workload resources
	FluxWorkloadAPIs.forEach(api => {
		createInformer(kc, api, 'workload');
	});

	output.send(`Created ${informers.length} Flux resource informers`, { revealOutputView: false });
}

/**
 * Stop all informers and clean up.
 */
export function destroyInformers(): void {
	// Clear any pending refresh timeouts
	if (sourcesRefreshTimeout) {
		clearTimeout(sourcesRefreshTimeout);
		sourcesRefreshTimeout = undefined;
	}
	if (workloadsRefreshTimeout) {
		clearTimeout(workloadsRefreshTimeout);
		workloadsRefreshTimeout = undefined;
	}
	sourcesRefreshPending = false;
	workloadsRefreshPending = false;

	// Stop all informers
	informers.forEach(informer => {
		try {
			informer.stop();
		} catch (e) {
			// Ignore errors during cleanup
		}
	});

	informers = [];
}

/**
 * Create a single informer for a Flux resource type.
 */
async function createInformer(
	kc: k8s.KubeConfig,
	api: APIParams,
	type: 'source' | 'workload'
): Promise<void> {
	if (!k8sCustomApi) {
		return;
	}

	const path = `/apis/${api.group}/${api.version}/${api.plural}`;

	const listFn = async (): Promise<{
		response: http.IncomingMessage;
		body: k8s.KubernetesListObject<KubernetesObject>;
	}> => {
		try {
			const result = await k8sCustomApi!.listClusterCustomObject(
				api.group,
				api.version,
				api.plural
			);
			return {
				response: result.response as http.IncomingMessage,
				body: result.body as k8s.KubernetesListObject<KubernetesObject>,
			};
		} catch (error) {
			throw error;
		}
	};

	const informer = k8s.makeInformer(kc, path, listFn);

	// Register event handlers with debounced refresh
	const scheduleRefresh = type === 'source' ? scheduleSourcesRefresh : scheduleWorkloadsRefresh;

	informer.on('add', (obj: KubernetesObject) => {
		output.send(`[Informer] ${api.kind} added: ${obj.metadata?.name}`, { revealOutputView: false });
		scheduleRefresh();
	});

	informer.on('update', (obj: KubernetesObject) => {
		output.send(`[Informer] ${api.kind} updated: ${obj.metadata?.name}`, { revealOutputView: false });
		scheduleRefresh();
	});

	informer.on('delete', (obj: KubernetesObject) => {
		output.send(`[Informer] ${api.kind} deleted: ${obj.metadata?.name}`, { revealOutputView: false });
		scheduleRefresh();
	});

	informer.on('error', (err: unknown) => {
		const errorMessage = err instanceof Error ? err.message : String(err);
		output.send(`[Informer] ${api.kind} error: ${errorMessage}`, { revealOutputView: false });
		// Don't destroy all informers on a single error - just let this one fail
		// The keep-alive mechanism will restart the proxy if needed
	});

	try {
		await informer.start();
		informers.push(informer);
	} catch (error) {
		output.send(`Failed to start informer for ${api.kind}: ${error}`, { revealOutputView: false });
		// Don't fail completely - other informers might work
	}
}

/**
 * Check if informers are currently running.
 */
export function hasInformers(): boolean {
	return informers.length > 0;
}