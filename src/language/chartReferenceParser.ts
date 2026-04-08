import { HelmReleaseInfo } from './helmReleaseDetector';

/**
 * Parsed chart reference with all necessary info to fetch schema
 */
export interface ChartReference {
	/** Chart name (e.g., 'traefik', 'postgresql') */
	chartName: string;
	/** Chart version (e.g., '10.0.0', '>=1.0.0') - may be undefined for latest */
	chartVersion?: string;
	/** Source kind (HelmRepository, GitRepository, OCIRepository) */
	sourceKind: string;
	/** Source name */
	sourceName: string;
	/** Source namespace (defaults to release namespace or 'flux-system') */
	sourceNamespace: string;
	/** The HelmRelease name for reference */
	releaseName: string;
	/** The HelmRelease namespace */
	releaseNamespace: string;
}

/**
 * Parses chart references from HelmRelease information
 */
export class ChartReferenceParser {

	/**
	 * Parse a ChartReference from HelmReleaseInfo
	 * Returns undefined if required fields are missing
	 */
	public parseChartReference(info: HelmReleaseInfo): ChartReference | undefined {
		// Chart name is required
		if (!info.chartName) {
			return undefined;
		}

		// Source reference is required
		if (!info.sourceRefKind || !info.sourceRefName) {
			return undefined;
		}

		return {
			chartName: info.chartName,
			chartVersion: info.chartVersion,
			sourceKind: info.sourceRefKind,
			sourceName: info.sourceRefName,
			sourceNamespace: info.sourceRefNamespace || info.namespace || 'flux-system',
			releaseName: info.name,
			releaseNamespace: info.namespace || 'default'
		};
	}

	/**
	 * Generate a unique cache key for a chart reference
	 */
	public getCacheKey(ref: ChartReference): string {
		const version = ref.chartVersion || 'latest';
		return `${ref.sourceKind}/${ref.sourceNamespace}/${ref.sourceName}/${ref.chartName}@${version}`;
	}

	/**
	 * Check if this is a HelmRepository source (most common, easiest to fetch)
	 */
	public isHelmRepositorySource(ref: ChartReference): boolean {
		return ref.sourceKind === 'HelmRepository';
	}

	/**
	 * Check if this is an OCI repository source
	 */
	public isOCIRepositorySource(ref: ChartReference): boolean {
		return ref.sourceKind === 'OCIRepository';
	}

	/**
	 * Check if this is a Git repository source
	 */
	public isGitRepositorySource(ref: ChartReference): boolean {
		return ref.sourceKind === 'GitRepository';
	}
}

// Singleton instance
export const chartReferenceParser = new ChartReferenceParser();