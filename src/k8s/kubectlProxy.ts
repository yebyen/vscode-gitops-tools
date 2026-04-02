import { KubeConfig } from '@kubernetes/client-node';
import { ChildProcess, spawn } from 'child_process';
import { createK8sClients, destroyK8sClients } from './client';
import { createProxyConfig } from './createKubeProxyConfig';
import { output } from '../output';

export let proxyProc: ChildProcess | undefined;
export let kubeProxyConfig: KubeConfig | undefined;

let keepAliveInterval: NodeJS.Timeout | undefined;
let isExtensionActive = true;

/**
 * Start the keep-alive mechanism for kubectl proxy.
 * If the proxy dies or errors out, it will be restarted by the interval.
 */
export function kubeProxyKeepAlive() {
	if (keepAliveInterval) {
		return; // Already running
	}

	keepAliveInterval = setInterval(async () => {
		if (!proxyProc && isExtensionActive) {
			destroyK8sClients();
			await startKubeProxy();
		}
	}, 2000);
}

/**
 * Stop the keep-alive mechanism.
 */
export function stopKubeProxyKeepAlive() {
	if (keepAliveInterval) {
		clearInterval(keepAliveInterval);
		keepAliveInterval = undefined;
	}
}

/**
 * Start kubectl proxy process on a random available port.
 */
export async function startKubeProxy(): Promise<void> {
	if (proxyProc) {
		await stopKubeProxy();
	}

	try {
		// Spawn kubectl proxy on a random port (port 0)
		proxyProc = spawn('kubectl', ['proxy', '-p', '0'], {
			stdio: ['ignore', 'pipe', 'pipe'],
			detached: false,
		});

		setupProxyListeners(proxyProc);
	} catch (error) {
		output.send(`Failed to start kubectl proxy: ${error}`, { revealOutputView: false });
		proxyProc = undefined;
	}
}

/**
 * Set up event listeners on the proxy process.
 */
function setupProxyListeners(proc: ChildProcess) {
	proc.on('exit', (code) => {
		if (proxyProc?.pid === proc.pid) {
			output.send(`kubectl proxy exited with code ${code}`, { revealOutputView: false });
			proxyProc = undefined;
			kubeProxyConfig = undefined;
			destroyK8sClients();
		}
	});

	proc.on('error', (err) => {
		output.send(`kubectl proxy error: ${err.message}`, { revealOutputView: false });
		if (!proc.killed) {
			proc.kill();
		}
	});

	proc.stdout?.on('data', (data: Buffer) => {
		const message = data.toString();
		// kubectl proxy outputs: "Starting to serve on 127.0.0.1:PORT"
		if (message.includes('Starting to serve on')) {
			const match = message.match(/:(\d+)/);
			if (match) {
				const port = parseInt(match[1], 10);
				output.send(`kubectl proxy started on port ${port}`, { revealOutputView: false });
				kubeProxyConfig = createProxyConfig(port);
				createK8sClients();
			}
		}
	});

	proc.stderr?.on('data', (data: Buffer) => {
		const message = data.toString();
		output.send(`kubectl proxy stderr: ${message}`, { revealOutputView: false });
		// Kill the process on stderr as it indicates an error
		if (!proc.killed) {
			proc.kill();
		}
	});
}

/**
 * Stop the kubectl proxy process.
 */
export async function stopKubeProxy(): Promise<void> {
	if (proxyProc) {
		if (!proxyProc.killed) {
			proxyProc.kill('SIGTERM');
			// Give it a moment to terminate gracefully
			await new Promise(resolve => setTimeout(resolve, 100));
			if (!proxyProc.killed) {
				proxyProc.kill('SIGKILL');
			}
		}
		proxyProc = undefined;
		kubeProxyConfig = undefined;
		destroyK8sClients();
	}
}

/**
 * Restart kubectl proxy (used on context switches).
 */
export async function restartKubeProxy(): Promise<void> {
	await stopKubeProxy();
	await startKubeProxy();
}

/**
 * Set extension active state. When inactive, proxy won't be restarted.
 */
export function setExtensionActive(active: boolean): void {
	isExtensionActive = active;
}

/**
 * Clean up all proxy resources. Call on extension deactivation.
 */
export async function disposeKubeProxy(): Promise<void> {
	setExtensionActive(false);
	stopKubeProxyKeepAlive();
	await stopKubeProxy();
}

/**
 * Check if the proxy is currently running and connected.
 */
export function isProxyRunning(): boolean {
	return proxyProc !== undefined && !proxyProc.killed && kubeProxyConfig !== undefined;
}