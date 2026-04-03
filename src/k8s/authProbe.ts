import { window } from 'vscode';
import { kubernetesTools } from '../kubernetes/kubernetesTools';
import { output } from '../output';

/**
 * Authentication state tracking for the current session.
 * This prevents multiple parallel kubectl calls from each triggering
 * device code authentication prompts when tokens are expired.
 */

/** Whether we've confirmed authentication works for current context */
let isAuthenticated = false;

/** Promise for in-flight authentication check (prevents parallel probes) */
let authCheckInProgress: Promise<boolean> | null = null;

/** Track if we've already shown an auth error notification this session */
let authErrorShown = false;

/**
 * Patterns that indicate Azure device code authentication is required.
 * When these appear in stderr, we know the user needs to complete
 * interactive authentication before kubectl commands will work.
 */
const DEVICE_CODE_PATTERNS = [
	'login.microsoft.com/device',
	'login.microsoftonline.com/device',
	'DeviceCodeCredential',
	'To sign in, use a web browser',
	'kubelogin failed with exit code 1',
	'failed to get token',
	'context deadline exceeded',
];

/**
 * Check if an error message indicates device code authentication is needed.
 */
function isDeviceCodeAuthError(stderr: string): boolean {
	if (!stderr) {
		return false;
	}
	return DEVICE_CODE_PATTERNS.some(pattern => stderr.includes(pattern));
}

/**
 * Extract the device code URL from stderr if present.
 */
function extractDeviceCodeUrl(stderr: string): string | undefined {
	const match = stderr.match(/https:\/\/\S*microsoft\S*\/device\S*/i);
	return match ? match[0] : undefined;
}

/**
 * Show a user-friendly notification when authentication is required.
 */
async function showAuthRequiredNotification(stderr: string): Promise<void> {
	if (authErrorShown) {
		return; // Don't spam notifications
	}
	authErrorShown = true;

	const deviceUrl = extractDeviceCodeUrl(stderr);
	const message = 'Kubernetes authentication required. Please complete device code login in your terminal or browser.';
	
	if (deviceUrl) {
		const action = await window.showWarningMessage(
			message,
			'Open Login Page',
			'Dismiss',
		);
		if (action === 'Open Login Page') {
			const { env } = await import('vscode');
			env.openExternal(await import('vscode').then(v => v.Uri.parse(deviceUrl)));
		}
	} else {
		window.showWarningMessage(message);
	}
}

/**
 * Perform the actual authentication probe.
 * Uses a lightweight kubectl command to test if authentication works.
 */
async function checkAuth(): Promise<boolean> {
	output.send('Checking cluster authentication...', { 
		revealOutputView: false,
		newline: 'single',
	});

	// Use 'kubectl version' as a lightweight probe - it contacts the server
	// but doesn't require any specific permissions
	const result = await kubernetesTools.invokeKubectlCommand('version --client=false');
	
	if (result?.code === 0) {
		output.send('Cluster authentication successful', { 
			revealOutputView: false,
			newline: 'single',
		});
		isAuthenticated = true;
		authErrorShown = false; // Reset so future auth errors can show
		return true;
	}

	const stderr = result?.stderr || '';
	output.send(`Authentication probe failed: ${stderr}`, { 
		revealOutputView: false,
		logLevel: 'warn',
		newline: 'single',
	});

	// Check if this is a device code auth requirement
	if (isDeviceCodeAuthError(stderr)) {
		await showAuthRequiredNotification(stderr);
	}

	return false;
}

/**
 * Ensure the user is authenticated before making parallel kubectl calls.
 * 
 * This function should be called before any Promise.all that makes
 * multiple kubectl API calls. It ensures that:
 * 1. Only one authentication probe runs at a time
 * 2. Authentication state is cached for the session
 * 3. Users see a single clear error instead of multiple timeout errors
 * 
 * @returns true if authenticated, false if authentication failed/required
 */
export async function ensureAuthenticated(): Promise<boolean> {
	// Already authenticated this session
	if (isAuthenticated) {
		return true;
	}

	// Another check is in progress - wait for it
	if (authCheckInProgress) {
		return authCheckInProgress;
	}

	// Start new auth check
	authCheckInProgress = checkAuth();
	
	try {
		const result = await authCheckInProgress;
		return result;
	} finally {
		authCheckInProgress = null;
	}
}

/**
 * Reset authentication state. Call this when:
 * - Kubernetes context changes
 * - Kubeconfig path changes  
 * - kubectl proxy restarts
 */
export function resetAuthState(): void {
	output.send('Resetting authentication state', { 
		revealOutputView: false,
		newline: 'single',
	});
	isAuthenticated = false;
	authCheckInProgress = null;
	authErrorShown = false;
}

/**
 * Check if we're currently authenticated (without probing).
 * Useful for UI state decisions.
 */
export function isCurrentlyAuthenticated(): boolean {
	return isAuthenticated;
}
