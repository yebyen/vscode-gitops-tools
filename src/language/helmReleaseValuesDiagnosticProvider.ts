import * as vscode from 'vscode';
import { helmReleaseDetector, HelmReleaseInfo } from './helmReleaseDetector';
import { chartReferenceParser } from './chartReferenceParser';
import { helmChartSchemaFetcher } from './helmChartSchemaFetcher';

/**
 * JSON Schema property definition
 */
interface SchemaProperty {
	type?: string | string[];
	description?: string;
	default?: any;
	enum?: any[];
	properties?: { [key: string]: SchemaProperty };
	items?: SchemaProperty;
	required?: string[];
	additionalProperties?: boolean | SchemaProperty;
	minimum?: number;
	maximum?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
}

/**
 * JSON Schema structure
 */
interface JsonSchema {
	$schema?: string;
	type?: string;
	properties?: { [key: string]: SchemaProperty };
	required?: string[];
	definitions?: { [key: string]: SchemaProperty };
}

/**
 * Diagnostic information for a value error
 */
interface ValueDiagnostic {
	message: string;
	range: vscode.Range;
	severity: vscode.DiagnosticSeverity;
}

/**
 * Provides diagnostics (validation errors) for HelmRelease values
 */
export class HelmReleaseValuesDiagnosticProvider {
	/** Diagnostic collection for HelmRelease values */
	private diagnosticCollection: vscode.DiagnosticCollection;
	
	/** Cache of schemas by cache key */
	private schemaCache: Map<string, JsonSchema | null> = new Map();
	
	/** Debounce timer for validation */
	private validationTimer: NodeJS.Timeout | undefined;
	
	/** Debounce delay in milliseconds */
	private readonly DEBOUNCE_DELAY = 500;

	constructor() {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection('helmrelease-values');
	}

	/**
	 * Get the diagnostic collection for disposal
	 */
	public getDiagnosticCollection(): vscode.DiagnosticCollection {
		return this.diagnosticCollection;
	}

	/**
	 * Validate a document and update diagnostics
	 */
	public async validateDocument(document: vscode.TextDocument): Promise<void> {
		// Only process YAML files
		if (document.languageId !== 'yaml') {
			return;
		}

		// Clear previous timer
		if (this.validationTimer) {
			clearTimeout(this.validationTimer);
		}

		// Debounce validation
		this.validationTimer = setTimeout(async () => {
			await this.doValidation(document);
		}, this.DEBOUNCE_DELAY);
	}

	/**
	 * Perform the actual validation
	 */
	private async doValidation(document: vscode.TextDocument): Promise<void> {
		const diagnostics: vscode.Diagnostic[] = [];

		// Detect HelmReleases in the document
		const releases = helmReleaseDetector.detectHelmReleases(document);
		
		for (const release of releases) {
			if (!release.valuesRange) {
				continue;
			}

			// Get chart reference
			const chartRef = chartReferenceParser.parseChartReference(release);
			if (!chartRef) {
				continue;
			}

			// Get schema
			const schema = await this.getSchema(chartRef);
			if (!schema) {
				continue;
			}

			// Validate values against schema
			const valueDiagnostics = this.validateValues(document, release, schema);
			diagnostics.push(...valueDiagnostics);
		}

		// Update diagnostics
		this.diagnosticCollection.set(document.uri, diagnostics);
	}

	/**
	 * Get the schema for a chart, using cache when possible
	 */
	private async getSchema(
		chartRef: ReturnType<typeof chartReferenceParser.parseChartReference>
	): Promise<JsonSchema | undefined> {
		if (!chartRef) {
			return undefined;
		}

		const cacheKey = chartReferenceParser.getCacheKey(chartRef);
		
		if (this.schemaCache.has(cacheKey)) {
			const cached = this.schemaCache.get(cacheKey);
			return cached ?? undefined;
		}

		try {
			const schema = await helmChartSchemaFetcher.fetchSchema(chartRef);
			this.schemaCache.set(cacheKey, schema as JsonSchema ?? null);
			return schema as JsonSchema | undefined;
		} catch (error) {
			console.error('Failed to fetch schema for validation:', error);
			this.schemaCache.set(cacheKey, null);
			return undefined;
		}
	}

	/**
	 * Validate values in a HelmRelease against a schema
	 */
	private validateValues(
		document: vscode.TextDocument,
		release: HelmReleaseInfo,
		schema: JsonSchema
	): vscode.Diagnostic[] {
		const diagnostics: vscode.Diagnostic[] = [];
		
		if (!release.valuesRange) {
			return diagnostics;
		}

		// Parse the values section
		const valuesText = document.getText(release.valuesRange);
		const valuesStartLine = release.valuesRange.start.line;
		
		// Parse YAML structure and validate
		const parsed = this.parseYamlValues(valuesText, valuesStartLine, document);
		
		// Validate against schema
		this.validateObject(parsed, schema, [], diagnostics, document);
		
		return diagnostics;
	}

	/**
	 * Simple YAML parser for values section
	 * Returns a map of paths to their line numbers and values
	 */
	private parseYamlValues(
		text: string,
		startLine: number,
		document: vscode.TextDocument
	): Map<string, { line: number; value: string; indent: number }> {
		const result = new Map<string, { line: number; value: string; indent: number }>();
		const lines = text.split('\n');
		const pathStack: { key: string; indent: number }[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineNum = startLine + i;
			
			// Skip empty lines and comments
			if (line.trim() === '' || line.trim().startsWith('#')) {
				continue;
			}

			// Skip the "values:" line itself
			if (line.trim() === 'values:') {
				continue;
			}

			const indent = this.getIndentLevel(line);
			const keyValueMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
			
			if (keyValueMatch) {
				const key = keyValueMatch[2];
				const value = keyValueMatch[3].trim();

				// Pop items from stack that have same or higher indent
				while (pathStack.length > 0 && pathStack[pathStack.length - 1].indent >= indent) {
					pathStack.pop();
				}

				// Build the full path
				const pathParts = pathStack.map(p => p.key);
				pathParts.push(key);
				const fullPath = pathParts.join('.');

				result.set(fullPath, { line: lineNum, value, indent });

				// If no value on this line, it might be an object
				if (value === '' || value.startsWith('{') || value.startsWith('[')) {
					pathStack.push({ key, indent });
				}
			}
		}

		return result;
	}

	/**
	 * Get the indentation level of a line
	 */
	private getIndentLevel(line: string): number {
		const match = line.match(/^(\s*)/);
		return match ? match[1].length : 0;
	}

	/**
	 * Validate an object against a schema
	 */
	private validateObject(
		parsed: Map<string, { line: number; value: string; indent: number }>,
		schema: JsonSchema | SchemaProperty,
		path: string[],
		diagnostics: vscode.Diagnostic[],
		document: vscode.TextDocument
	): void {
		if (!schema.properties) {
			return;
		}

		const prefix = path.length > 0 ? path.join('.') + '.' : '';

		// Check for unknown properties
		for (const [fullPath, info] of parsed) {
			if (!fullPath.startsWith(prefix)) {
				continue;
			}

			const relativePath = prefix ? fullPath.substring(prefix.length) : fullPath;
			const parts = relativePath.split('.');
			
			if (parts.length === 1) {
				const propName = parts[0];
				
				// Check if property exists in schema
				if (!schema.properties[propName]) {
					// Only warn about unknown properties at this level
					const line = document.lineAt(info.line);
					const keyMatch = line.text.match(new RegExp(`^(\\s*)(${propName})\\s*:`));
					
					if (keyMatch) {
						const startCol = keyMatch[1].length;
						const endCol = startCol + propName.length;
						const range = new vscode.Range(
							info.line, startCol,
							info.line, endCol
						);
						
						diagnostics.push(new vscode.Diagnostic(
							range,
							`Unknown property '${propName}'`,
							vscode.DiagnosticSeverity.Warning
						));
					}
				} else {
					// Validate the value
					const propSchema = schema.properties[propName];
					this.validateValue(info, propSchema, propName, diagnostics, document);
				}
			}
		}

		// Check for required properties
		if (schema.required) {
			for (const required of schema.required) {
				const fullPath = prefix + required;
				if (!parsed.has(fullPath)) {
					// Find a good location to report this (the parent object line or values start)
					// For simplicity, we'll skip required checks for now as they can be noisy
					// during editing
				}
			}
		}

		// Recursively validate nested objects
		for (const [propName, propSchema] of Object.entries(schema.properties)) {
			if (propSchema.properties) {
				this.validateObject(
					parsed,
					propSchema,
					[...path, propName],
					diagnostics,
					document
				);
			}
		}
	}

	/**
	 * Validate a single value against its schema
	 */
	private validateValue(
		info: { line: number; value: string; indent: number },
		schema: SchemaProperty,
		propName: string,
		diagnostics: vscode.Diagnostic[],
		document: vscode.TextDocument
	): void {
		const value = info.value;
		
		// Skip empty values (might be objects/arrays)
		if (value === '' || value === '|' || value === '>') {
			return;
		}

		// Get the range for the value
		const line = document.lineAt(info.line);
		const colonIndex = line.text.indexOf(':');
		if (colonIndex === -1) {
			return;
		}
		
		const valueStartCol = colonIndex + 1;
		const valueText = line.text.substring(valueStartCol).trim();
		const valueStartInLine = line.text.indexOf(valueText, colonIndex);
		
		const range = new vscode.Range(
			info.line, valueStartInLine,
			info.line, valueStartInLine + valueText.length
		);

		// Validate type
		if (schema.type) {
			const types = Array.isArray(schema.type) ? schema.type : [schema.type];
			const actualType = this.inferType(value);
			
			if (!types.includes(actualType) && !types.includes('any')) {
				// Allow string to be compatible with most types during editing
				if (actualType !== 'string' || !types.some(t => t === 'string' || t === 'number' || t === 'integer' || t === 'boolean')) {
					diagnostics.push(new vscode.Diagnostic(
						range,
						`Expected type '${types.join(' | ')}' but got '${actualType}'`,
						vscode.DiagnosticSeverity.Warning
					));
				}
			}
		}

		// Validate enum
		if (schema.enum && schema.enum.length > 0) {
			const cleanValue = this.cleanYamlValue(value);
			if (!schema.enum.includes(cleanValue) && !schema.enum.map(String).includes(cleanValue)) {
				const allowedValues = schema.enum.map(v => `'${v}'`).join(', ');
				diagnostics.push(new vscode.Diagnostic(
					range,
					`Value must be one of: ${allowedValues}`,
					vscode.DiagnosticSeverity.Error
				));
			}
		}
	}

	/**
	 * Infer the type of a YAML value
	 */
	private inferType(value: string): string {
		const clean = value.trim();
		
		// Boolean
		if (clean === 'true' || clean === 'false' || clean === 'yes' || clean === 'no') {
			return 'boolean';
		}
		
		// Null
		if (clean === 'null' || clean === '~' || clean === '') {
			return 'null';
		}
		
		// Number
		if (/^-?\d+$/.test(clean)) {
			return 'integer';
		}
		if (/^-?\d+\.\d+$/.test(clean)) {
			return 'number';
		}
		
		// Array (inline)
		if (clean.startsWith('[')) {
			return 'array';
		}
		
		// Object (inline)
		if (clean.startsWith('{')) {
			return 'object';
		}
		
		return 'string';
	}

	/**
	 * Clean a YAML value (remove quotes, etc.)
	 */
	private cleanYamlValue(value: string): string {
		let clean = value.trim();
		
		// Remove quotes
		if ((clean.startsWith('"') && clean.endsWith('"')) ||
			(clean.startsWith("'") && clean.endsWith("'"))) {
			clean = clean.slice(1, -1);
		}
		
		return clean;
	}

	/**
	 * Clear diagnostics for a document
	 */
	public clearDiagnostics(document: vscode.TextDocument): void {
		this.diagnosticCollection.delete(document.uri);
	}

	/**
	 * Clear all diagnostics
	 */
	public clearAllDiagnostics(): void {
		this.diagnosticCollection.clear();
	}

	/**
	 * Clear cached schemas
	 */
	public clearCache(): void {
		this.schemaCache.clear();
	}

	/**
	 * Dispose of resources
	 */
	public dispose(): void {
		if (this.validationTimer) {
			clearTimeout(this.validationTimer);
		}
		this.diagnosticCollection.dispose();
	}
}

// Singleton instance
export const helmReleaseValuesDiagnosticProvider = new HelmReleaseValuesDiagnosticProvider();