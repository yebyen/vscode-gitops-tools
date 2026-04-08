import * as vscode from 'vscode';
import { helmReleaseDetector } from './helmReleaseDetector';
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
	$ref?: string;
	oneOf?: SchemaProperty[];
	anyOf?: SchemaProperty[];
	allOf?: SchemaProperty[];
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
 * Provides code completion for HelmRelease values field
 */
export class HelmReleaseValuesCompletionProvider implements vscode.CompletionItemProvider {
	
	/** Cache of schemas by document URI */
	private schemaCache: Map<string, JsonSchema | null> = new Map();
	
	/** Pending schema fetch operations */
	private pendingFetches: Map<string, Promise<JsonSchema | undefined>> = new Map();

	/**
	 * Provide completion items for the current position
	 */
	public async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		_context: vscode.CompletionContext
	): Promise<vscode.CompletionItem[] | undefined> {
		// Check if we're in a HelmRelease values section
		if (!helmReleaseDetector.isPositionInValues(document, position)) {
			return undefined;
		}

		// Get the HelmRelease at this position
		const release = helmReleaseDetector.getHelmReleaseAtPosition(document, position);
		if (!release) {
			return undefined;
		}

		// Parse chart reference
		const chartRef = chartReferenceParser.parseChartReference(release);
		if (!chartRef) {
			return undefined;
		}

		// Get or fetch the schema
		const schema = await this.getSchema(document, chartRef);
		if (!schema) {
			return undefined;
		}

		// Determine the path within values where the cursor is
		const valuePath = this.getValuePath(document, position, release.valuesRange);
		
		// Get completions for this path
		return this.getCompletionsForPath(schema, valuePath, position);
	}

	/**
	 * Get the schema for a chart, using cache when possible
	 */
	private async getSchema(
		document: vscode.TextDocument, 
		chartRef: ReturnType<typeof chartReferenceParser.parseChartReference>
	): Promise<JsonSchema | undefined> {
		if (!chartRef) {
			return undefined;
		}

		const cacheKey = chartReferenceParser.getCacheKey(chartRef);
		
		// Check if we already have it cached
		if (this.schemaCache.has(cacheKey)) {
			const cached = this.schemaCache.get(cacheKey);
			return cached ?? undefined;
		}

		// Check if there's already a fetch in progress
		if (this.pendingFetches.has(cacheKey)) {
			return this.pendingFetches.get(cacheKey);
		}

		// Start a new fetch
		const fetchPromise = this.fetchAndCacheSchema(cacheKey, chartRef);
		this.pendingFetches.set(cacheKey, fetchPromise);

		try {
			const schema = await fetchPromise;
			return schema;
		} finally {
			this.pendingFetches.delete(cacheKey);
		}
	}

	/**
	 * Fetch a schema and cache it
	 */
	private async fetchAndCacheSchema(
		cacheKey: string,
		chartRef: ReturnType<typeof chartReferenceParser.parseChartReference>
	): Promise<JsonSchema | undefined> {
		if (!chartRef) {
			return undefined;
		}

		try {
			const schema = await helmChartSchemaFetcher.fetchSchema(chartRef);
			this.schemaCache.set(cacheKey, schema as JsonSchema ?? null);
			return schema as JsonSchema | undefined;
		} catch (error) {
			console.error('Failed to fetch schema:', error);
			this.schemaCache.set(cacheKey, null);
			return undefined;
		}
	}

	/**
	 * Determine the YAML path where the cursor is located within values
	 */
	private getValuePath(
		document: vscode.TextDocument,
		position: vscode.Position,
		valuesRange?: vscode.Range
	): string[] {
		if (!valuesRange) {
			return [];
		}

		const path: string[] = [];
		const currentLine = position.line;
		const currentIndent = this.getIndentLevel(document.lineAt(position.line).text);
		
		// Start from the line after "values:" and work through to current position
		const valuesStartLine = valuesRange.start.line;
		const valuesIndent = this.getIndentLevel(document.lineAt(valuesStartLine).text);

		// Walk backwards from current position to build path
		for (let lineNum = currentLine; lineNum > valuesStartLine; lineNum--) {
			const line = document.lineAt(lineNum).text;
			const lineIndent = this.getIndentLevel(line);
			
			// Skip empty lines and comments
			if (line.trim() === '' || line.trim().startsWith('#')) {
				continue;
			}

			// If this line has lower indent than what we're tracking, it's a parent
			if (lineIndent < currentIndent) {
				const keyMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*:/);
				if (keyMatch) {
					path.unshift(keyMatch[1]);
				}
			}
		}

		// Check if current line has a key being typed
		const currentLineText = document.lineAt(position.line).text;
		const beforeCursor = currentLineText.substring(0, position.character);
		
		// If we're after a colon, we might be typing a value, not a key
		if (!beforeCursor.includes(':')) {
			// We're typing a key, path is correct
		}

		return path;
	}

	/**
	 * Get the indentation level of a line (number of leading spaces)
	 */
	private getIndentLevel(line: string): number {
		const match = line.match(/^(\s*)/);
		return match ? match[1].length : 0;
	}

	/**
	 * Get completion items for a given path in the schema
	 */
	private getCompletionsForPath(
		schema: JsonSchema,
		path: string[],
		position: vscode.Position
	): vscode.CompletionItem[] {
		// Navigate to the correct place in schema
		let currentSchema: SchemaProperty | JsonSchema = schema;
		
		for (const key of path) {
			if (currentSchema.properties && currentSchema.properties[key]) {
				currentSchema = currentSchema.properties[key];
			} else {
				// Path not found in schema
				return [];
			}
		}

		// Get completions from properties at this level
		const completions: vscode.CompletionItem[] = [];
		
		if (currentSchema.properties) {
			for (const [propName, propSchema] of Object.entries(currentSchema.properties)) {
				const item = this.createCompletionItem(propName, propSchema, position);
				completions.push(item);
			}
		}

		return completions;
	}

	/**
	 * Create a completion item for a schema property
	 */
	private createCompletionItem(
		name: string,
		schema: SchemaProperty,
		position: vscode.Position
	): vscode.CompletionItem {
		const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Property);
		
		// Build documentation
		let documentation = '';
		if (schema.description) {
			documentation = schema.description;
		}
		
		// Add type info
		const typeInfo = this.getTypeString(schema);
		if (typeInfo) {
			documentation += documentation ? `\n\n**Type:** ${typeInfo}` : `**Type:** ${typeInfo}`;
		}
		
		// Add default value
		if (schema.default !== undefined) {
			const defaultStr = JSON.stringify(schema.default);
			documentation += `\n\n**Default:** \`${defaultStr}\``;
		}
		
		// Add enum values
		if (schema.enum && schema.enum.length > 0) {
			const enumStr = schema.enum.map(v => `\`${v}\``).join(', ');
			documentation += `\n\n**Allowed values:** ${enumStr}`;
		}

		if (documentation) {
			item.documentation = new vscode.MarkdownString(documentation);
		}

		// Set insert text based on type
		if (schema.type === 'object' || schema.properties) {
			item.insertText = new vscode.SnippetString(`${name}:\n  $0`);
		} else if (schema.type === 'array') {
			item.insertText = new vscode.SnippetString(`${name}:\n  - $0`);
		} else if (schema.type === 'boolean') {
			item.insertText = new vscode.SnippetString(`${name}: \${1|true,false|}`);
		} else if (schema.enum && schema.enum.length > 0) {
			const enumChoices = schema.enum.join(',');
			item.insertText = new vscode.SnippetString(`${name}: \${1|${enumChoices}|}`);
		} else if (schema.default !== undefined) {
			const defaultValue = typeof schema.default === 'string' ? 
				`"${schema.default}"` : JSON.stringify(schema.default);
			item.insertText = new vscode.SnippetString(`${name}: \${1:${defaultValue}}`);
		} else {
			item.insertText = new vscode.SnippetString(`${name}: $0`);
		}

		// Set detail (shown in completion list)
		if (typeInfo) {
			item.detail = typeInfo;
		}

		return item;
	}

	/**
	 * Get a human-readable type string from schema
	 */
	private getTypeString(schema: SchemaProperty): string {
		if (schema.type) {
			if (Array.isArray(schema.type)) {
				return schema.type.join(' | ');
			}
			return schema.type;
		}
		
		if (schema.enum) {
			return 'enum';
		}
		
		if (schema.properties) {
			return 'object';
		}
		
		if (schema.items) {
			return 'array';
		}
		
		if (schema.oneOf || schema.anyOf) {
			return 'union';
		}
		
		return '';
	}

	/**
	 * Clear cached schemas
	 */
	public clearCache(): void {
		this.schemaCache.clear();
	}
}

// Singleton instance
export const helmReleaseValuesCompletionProvider = new HelmReleaseValuesCompletionProvider();