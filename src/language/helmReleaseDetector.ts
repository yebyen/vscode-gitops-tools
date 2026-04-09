import * as vscode from 'vscode';

/**
 * Information about a detected HelmRelease in a document
 */
export interface HelmReleaseInfo {
	/** The name of the HelmRelease from metadata.name */
	name: string;
	/** The namespace from metadata.namespace (optional) */
	namespace?: string;
	/** The chart name from spec.chart.spec.chart */
	chartName?: string;
	/** The chart version from spec.chart.spec.version */
	chartVersion?: string;
	/** The source reference kind (HelmRepository, GitRepository, etc.) */
	sourceRefKind?: string;
	/** The source reference name */
	sourceRefName?: string;
	/** The source reference namespace */
	sourceRefNamespace?: string;
	/** The range in the document where the HelmRelease starts */
	range: vscode.Range;
	/** The range of the 'values' field if present */
	valuesRange?: vscode.Range;
}

/**
 * Detects HelmRelease resources in YAML documents
 */
export class HelmReleaseDetector {
	
	/**
	 * Check if the document contains any HelmRelease resources
	 */
	public containsHelmRelease(document: vscode.TextDocument): boolean {
		if (document.languageId !== 'yaml') {
			return false;
		}
		
		const text = document.getText();
		return this.isHelmReleaseDocument(text);
	}

	/**
	 * Check if text contains HelmRelease markers
	 */
	private isHelmReleaseDocument(text: string): boolean {
		// Check for HelmRelease kind and Flux API group
		return /kind:\s*HelmRelease/i.test(text) && 
			   /apiVersion:\s*helm\.toolkit\.fluxcd\.io/i.test(text);
	}

	/**
	 * Detect all HelmRelease resources in a document
	 */
	public detectHelmReleases(document: vscode.TextDocument): HelmReleaseInfo[] {
		if (document.languageId !== 'yaml') {
			return [];
		}

		const text = document.getText();
		const releases: HelmReleaseInfo[] = [];

		// Split by YAML document separator (---)
		const documents = this.splitYamlDocuments(text);
		
		let currentOffset = 0;
		for (const doc of documents) {
			if (this.isHelmReleaseDocument(doc.content)) {
				const info = this.parseHelmRelease(document, doc.content, doc.startOffset);
				if (info) {
					releases.push(info);
				}
			}
			currentOffset += doc.content.length;
		}

		return releases;
	}

	/**
	 * Split text into YAML documents
	 */
	private splitYamlDocuments(text: string): Array<{ content: string; startOffset: number }> {
		const documents: Array<{ content: string; startOffset: number }> = [];
		const separator = /^---\s*$/gm;
		
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = separator.exec(text)) !== null) {
			if (lastIndex < match.index) {
				documents.push({
					content: text.substring(lastIndex, match.index),
					startOffset: lastIndex
				});
			}
			lastIndex = match.index + match[0].length + 1; // +1 for newline
		}

		// Add remaining content
		if (lastIndex < text.length) {
			documents.push({
				content: text.substring(lastIndex),
				startOffset: lastIndex
			});
		}

		// If no separator found, treat entire text as one document
		if (documents.length === 0) {
			documents.push({ content: text, startOffset: 0 });
		}

		return documents;
	}

	/**
	 * Parse a HelmRelease document and extract information
	 */
	private parseHelmRelease(
		document: vscode.TextDocument, 
		content: string, 
		startOffset: number
	): HelmReleaseInfo | null {
		const startPosition = document.positionAt(startOffset);
		const endPosition = document.positionAt(startOffset + content.length);

		// Extract metadata.name
		const nameMatch = content.match(/metadata:\s*\n(?:.*\n)*?\s+name:\s*["']?([^\s"'\n]+)["']?/);
		if (!nameMatch) {
			return null;
		}

		const info: HelmReleaseInfo = {
			name: nameMatch[1],
			range: new vscode.Range(startPosition, endPosition)
		};

		// Extract metadata.namespace
		const namespaceMatch = content.match(/metadata:\s*\n(?:.*\n)*?\s+namespace:\s*["']?([^\s"'\n]+)["']?/);
		if (namespaceMatch) {
			info.namespace = namespaceMatch[1];
		}

		// Extract spec.chart.spec.chart
		const chartMatch = content.match(/spec:\s*\n(?:.*\n)*?\s+chart:\s*\n(?:.*\n)*?\s+spec:\s*\n(?:.*\n)*?\s+chart:\s*["']?([^\s"'\n]+)["']?/);
		if (chartMatch) {
			info.chartName = chartMatch[1];
		}

		// Extract spec.chart.spec.version
		const versionMatch = content.match(/spec:\s*\n(?:.*\n)*?\s+chart:\s*\n(?:.*\n)*?\s+spec:\s*\n(?:.*\n)*?\s+version:\s*["']?([^\s"'\n]+)["']?/);
		if (versionMatch) {
			info.chartVersion = versionMatch[1];
		}

		// Extract sourceRef
		const sourceRefKindMatch = content.match(/sourceRef:\s*\n\s+kind:\s*["']?([^\s"'\n]+)["']?/);
		if (sourceRefKindMatch) {
			info.sourceRefKind = sourceRefKindMatch[1];
		}

		const sourceRefNameMatch = content.match(/sourceRef:\s*\n(?:.*\n)*?\s+name:\s*["']?([^\s"'\n]+)["']?/);
		if (sourceRefNameMatch) {
			info.sourceRefName = sourceRefNameMatch[1];
		}

		const sourceRefNamespaceMatch = content.match(/sourceRef:\s*\n(?:.*\n)*?\s+namespace:\s*["']?([^\s"'\n]+)["']?/);
		if (sourceRefNamespaceMatch) {
			info.sourceRefNamespace = sourceRefNamespaceMatch[1];
		}

		// Find the values field range
		const valuesRange = this.findValuesRange(document, content, startOffset);
		if (valuesRange) {
			info.valuesRange = valuesRange;
		}

		return info;
	}

	/**
	 * Find the range of the 'values' field in a HelmRelease
	 */
	private findValuesRange(
		document: vscode.TextDocument, 
		content: string, 
		startOffset: number
	): vscode.Range | undefined {
		// Find "values:" at the spec level (indented by 2 spaces typically)
		const valuesMatch = content.match(/^(\s*)values:\s*$/m);
		if (!valuesMatch) {
			// Check for inline values
			const inlineMatch = content.match(/^(\s*)values:\s*\{/m);
			if (inlineMatch) {
				const valuesStart = content.indexOf(inlineMatch[0]);
				// For inline, find matching closing brace (simplified)
				const startPos = document.positionAt(startOffset + valuesStart);
				const endPos = document.positionAt(startOffset + content.length);
				return new vscode.Range(startPos, endPos);
			}
			return undefined;
		}

		const valuesStart = content.indexOf(valuesMatch[0]);
		const valuesIndent = valuesMatch[1].length;
		
		// Find where the values block ends (next field at same or lower indent level)
		const lines = content.substring(valuesStart).split('\n');
		let valuesEnd = valuesStart + valuesMatch[0].length;
		
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			// Skip empty lines and comments
			if (line.trim() === '' || line.trim().startsWith('#')) {
				valuesEnd += line.length + 1;
				continue;
			}
			
			// Check indent level
			const lineIndent = line.match(/^(\s*)/)?.[1].length ?? 0;
			if (lineIndent <= valuesIndent && line.trim().length > 0) {
				// This line is at same or lower indent, values block ended
				break;
			}
			valuesEnd += line.length + 1;
		}

		const startPos = document.positionAt(startOffset + valuesStart);
		const endPos = document.positionAt(startOffset + valuesEnd);
		return new vscode.Range(startPos, endPos);
	}

	/**
	 * Check if a position is within the values field of a HelmRelease
	 */
	public isPositionInValues(document: vscode.TextDocument, position: vscode.Position): boolean {
		const releases = this.detectHelmReleases(document);
		
		for (const release of releases) {
			if (release.valuesRange && release.valuesRange.contains(position)) {
				return true;
			}
		}
		
		return false;
	}

	/**
	 * Get the HelmRelease info for a position in the document
	 */
	public getHelmReleaseAtPosition(
		document: vscode.TextDocument, 
		position: vscode.Position
	): HelmReleaseInfo | undefined {
		const releases = this.detectHelmReleases(document);
		
		for (const release of releases) {
			if (release.range.contains(position)) {
				return release;
			}
		}
		
		return undefined;
	}
}

// Singleton instance
export const helmReleaseDetector = new HelmReleaseDetector();