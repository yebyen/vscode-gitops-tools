import * as https from 'https';
import * as http from 'http';
import * as zlib from 'zlib';
import * as tar from 'tar';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ChartReference } from './chartReferenceParser';
import { schemaCache } from './schemaCache';
import { kubernetesTools } from '../kubernetes/kubernetesTools';

/**
 * Helm repository index entry
 */
interface HelmIndexEntry {
	name: string;
	version: string;
	urls: string[];
	digest?: string;
}

/**
 * Helm repository index.yaml structure
 */
interface HelmIndex {
	apiVersion: string;
	entries: { [chartName: string]: HelmIndexEntry[] };
}

/**
 * Fetches JSON schemas from Helm charts
 */
export class HelmChartSchemaFetcher {
	
	/**
	 * Fetch the values.schema.json for a chart reference
	 * Returns undefined if chart doesn't have a schema
	 */
	public async fetchSchema(ref: ChartReference): Promise<object | undefined> {
		// Check cache first
		const cacheKey = `${ref.sourceKind}/${ref.sourceNamespace}/${ref.sourceName}/${ref.chartName}@${ref.chartVersion || 'latest'}`;
		const cached = schemaCache.get(cacheKey);
		if (cached) {
			return cached;
		}

		try {
			// Only support HelmRepository for now
			if (ref.sourceKind !== 'HelmRepository') {
				console.log(`Schema fetching not yet supported for source kind: ${ref.sourceKind}`);
				return undefined;
			}

			// Get the HelmRepository to find the URL
			const repoUrl = await this.getHelmRepositoryUrl(ref.sourceName, ref.sourceNamespace);
			if (!repoUrl) {
				console.log(`Could not find HelmRepository ${ref.sourceNamespace}/${ref.sourceName}`);
				return undefined;
			}

			// Fetch the repository index
			const index = await this.fetchIndex(repoUrl);
			if (!index) {
				return undefined;
			}

			// Find the chart entry
			const chartEntry = this.findChartEntry(index, ref.chartName, ref.chartVersion);
			if (!chartEntry) {
				console.log(`Chart ${ref.chartName}@${ref.chartVersion || 'latest'} not found in index`);
				return undefined;
			}

			// Get the chart URL
			const chartUrl = this.resolveChartUrl(repoUrl, chartEntry);
			if (!chartUrl) {
				return undefined;
			}

			// Download and extract schema
			const schema = await this.downloadAndExtractSchema(chartUrl);
			
			if (schema) {
				// Cache the result
				schemaCache.set(cacheKey, schema);
			}

			return schema;
		} catch (error) {
			console.error(`Failed to fetch schema for ${ref.chartName}:`, error);
			return undefined;
		}
	}

	/**
	 * Get the URL of a HelmRepository from the cluster
	 */
	private async getHelmRepositoryUrl(name: string, namespace: string): Promise<string | undefined> {
		try {
			const result = await kubernetesTools.getHelmRepositories();
			if (!result?.items) {
				return undefined;
			}

			const repo = result.items.find(
				r => r.metadata.name === name && r.metadata.namespace === namespace
			);

			return repo?.spec.url;
		} catch (error) {
			console.error(`Failed to get HelmRepository ${namespace}/${name}:`, error);
			return undefined;
		}
	}

	/**
	 * Fetch and parse the Helm repository index
	 */
	private async fetchIndex(repoUrl: string): Promise<HelmIndex | undefined> {
		const indexUrl = repoUrl.endsWith('/') ? `${repoUrl}index.yaml` : `${repoUrl}/index.yaml`;
		
		try {
			const content = await this.httpGet(indexUrl);
			// Simple YAML parsing for index (it's structured predictably)
			return this.parseYamlIndex(content);
		} catch (error) {
			console.error(`Failed to fetch index from ${indexUrl}:`, error);
			return undefined;
		}
	}

	/**
	 * Simple YAML parser for Helm index (avoids adding yaml dependency)
	 */
	private parseYamlIndex(content: string): HelmIndex | undefined {
		try {
			const index: HelmIndex = {
				apiVersion: 'v1',
				entries: {}
			};

			const lines = content.split('\n');
			let currentChart: string | null = null;
			let currentEntry: Partial<HelmIndexEntry> | null = null;
			let inUrls = false;

			for (const line of lines) {
				// Detect entries section start
				if (line.startsWith('entries:')) {
					continue;
				}

				// Chart name (2 spaces indent)
				const chartMatch = line.match(/^  ([a-zA-Z0-9_-]+):$/);
				if (chartMatch) {
					currentChart = chartMatch[1];
					index.entries[currentChart] = [];
					continue;
				}

				// New entry in chart (4 spaces, starts with -)
				if (line.match(/^  - /)) {
					if (currentEntry && currentChart) {
						index.entries[currentChart].push(currentEntry as HelmIndexEntry);
					}
					currentEntry = {};
					inUrls = false;
					
					// Check if this line has content after the dash
					const inlineMatch = line.match(/^  - ([a-zA-Z]+):\s*(.+)$/);
					if (inlineMatch) {
						(currentEntry as any)[inlineMatch[1]] = inlineMatch[2].replace(/^["']|["']$/g, '');
					}
					continue;
				}

				// Entry properties (4+ spaces)
				if (currentEntry && line.match(/^\s{4,}/)) {
					const propMatch = line.match(/^\s+([a-zA-Z]+):\s*(.*)$/);
					if (propMatch) {
						const key = propMatch[1];
						const value = propMatch[2].replace(/^["']|["']$/g, '');
						
						if (key === 'urls') {
							currentEntry.urls = [];
							inUrls = true;
						} else if (key === 'name' || key === 'version' || key === 'digest') {
							(currentEntry as any)[key] = value;
							inUrls = false;
						} else {
							inUrls = false;
						}
						continue;
					}

					// URL list item
					if (inUrls) {
						const urlMatch = line.match(/^\s+-\s+(.+)$/);
						if (urlMatch) {
							currentEntry.urls = currentEntry.urls || [];
							currentEntry.urls.push(urlMatch[1].replace(/^["']|["']$/g, ''));
						}
					}
				}
			}

			// Don't forget the last entry
			if (currentEntry && currentChart) {
				index.entries[currentChart].push(currentEntry as HelmIndexEntry);
			}

			return index;
		} catch (error) {
			console.error('Failed to parse Helm index:', error);
			return undefined;
		}
	}

	/**
	 * Find a chart entry matching name and version
	 */
	private findChartEntry(
		index: HelmIndex, 
		chartName: string, 
		version?: string
	): HelmIndexEntry | undefined {
		const entries = index.entries[chartName];
		if (!entries || entries.length === 0) {
			return undefined;
		}

		if (!version || version === '*' || version === 'latest') {
			// Return the first (newest) version
			return entries[0];
		}

		// Find exact version match
		const exact = entries.find(e => e.version === version);
		if (exact) {
			return exact;
		}

		// Try to match semver constraint (simplified - just prefix match)
		if (version.startsWith('>=') || version.startsWith('^') || version.startsWith('~')) {
			// For constraints, just return latest
			return entries[0];
		}

		return undefined;
	}

	/**
	 * Resolve the full chart download URL
	 */
	private resolveChartUrl(repoUrl: string, entry: HelmIndexEntry): string | undefined {
		if (!entry.urls || entry.urls.length === 0) {
			return undefined;
		}

		const chartUrl = entry.urls[0];
		
		// Check if it's already absolute
		if (chartUrl.startsWith('http://') || chartUrl.startsWith('https://')) {
			return chartUrl;
		}

		// Relative URL - resolve against repo URL
		const base = repoUrl.endsWith('/') ? repoUrl : `${repoUrl}/`;
		return `${base}${chartUrl}`;
	}

	/**
	 * Download chart archive and extract values.schema.json
	 */
	private async downloadAndExtractSchema(chartUrl: string): Promise<object | undefined> {
		const tempDir = path.join(os.tmpdir(), `helm-schema-${Date.now()}`);
		
		try {
			fs.mkdirSync(tempDir, { recursive: true });
			
			// Download the chart
			const chartData = await this.httpGetBuffer(chartUrl);
			
			// Decompress gzip
			const tarData = zlib.gunzipSync(chartData);
			
			// Write to temp file
			const tarPath = path.join(tempDir, 'chart.tar');
			fs.writeFileSync(tarPath, tarData);
			
			// Extract tar
			await tar.extract({
				file: tarPath,
				cwd: tempDir,
				filter: (filePath) => filePath.endsWith('values.schema.json')
			});

			// Find the schema file
			const schemaPath = this.findSchemaFile(tempDir);
			if (!schemaPath) {
				return undefined;
			}

			// Read and parse schema
			const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
			return JSON.parse(schemaContent);
		} finally {
			// Cleanup temp directory
			this.cleanupDir(tempDir);
		}
	}

	/**
	 * Find values.schema.json in extracted chart
	 */
	private findSchemaFile(dir: string): string | undefined {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			
			if (entry.isDirectory()) {
				const found = this.findSchemaFile(fullPath);
				if (found) {
					return found;
				}
			} else if (entry.name === 'values.schema.json') {
				return fullPath;
			}
		}
		
		return undefined;
	}

	/**
	 * HTTP GET request returning string
	 */
	private httpGet(url: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const client = url.startsWith('https') ? https : http;
			
			client.get(url, { timeout: 30000 }, (res) => {
				if (res.statusCode === 301 || res.statusCode === 302) {
					// Follow redirect
					const location = res.headers.location;
					if (location) {
						this.httpGet(location).then(resolve).catch(reject);
						return;
					}
				}
				
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode}`));
					return;
				}

				let data = '';
				res.on('data', chunk => data += chunk);
				res.on('end', () => resolve(data));
				res.on('error', reject);
			}).on('error', reject);
		});
	}

	/**
	 * HTTP GET request returning Buffer
	 */
	private httpGetBuffer(url: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const client = url.startsWith('https') ? https : http;
			
			client.get(url, { timeout: 60000 }, (res) => {
				if (res.statusCode === 301 || res.statusCode === 302) {
					const location = res.headers.location;
					if (location) {
						this.httpGetBuffer(location).then(resolve).catch(reject);
						return;
					}
				}
				
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode}`));
					return;
				}

				const chunks: Buffer[] = [];
				res.on('data', chunk => chunks.push(chunk));
				res.on('end', () => resolve(Buffer.concat(chunks)));
				res.on('error', reject);
			}).on('error', reject);
		});
	}

	/**
	 * Recursively remove a directory
	 */
	private cleanupDir(dir: string): void {
		try {
			if (fs.existsSync(dir)) {
				fs.rmSync(dir, { recursive: true, force: true });
			}
		} catch {
			// Ignore cleanup errors
		}
	}
}

// Singleton instance
export const helmChartSchemaFetcher = new HelmChartSchemaFetcher();