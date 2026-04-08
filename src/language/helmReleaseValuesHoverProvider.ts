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
	$ref?: string;
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
 * Provides hover documentation for HelmRelease values field
 */
export class HelmReleaseValuesHoverProvider implements vscode.HoverProvider {
	
	/** Cache of schemas by cache key */
	private schemaCache: Map<string, JsonSchema | null> = new Map();

	/**
	 * Provide hover information for the current position
	 */
	public async provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): Promise<vscode.Hover | undefined> {
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

		// Get the property name at cursor
		const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_-]+/);
		if (!wordRange) {
			return undefined;
		}

		const propertyName = document.getText(wordRange);
		
		// Check if this looks like a YAML key (followed by colon or at start of value line)
		const line = document.lineAt(position.line).text;
		const keyMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*:/);
		if (!keyMatch || keyMatch[1] !== propertyName) {
			// Not hovering over a key
			return undefined;
		}

		// Get the schema
		const schema = await this.getSchema(chartRef);
		if (!schema) {
			return undefined;
		}

		// Determine the path within values where the cursor is
		const valuePath = this.getValuePath(document, position, release.valuesRange);
		
		// Navigate to the property in schema
		const propertySchema = this.getPropertySchema(schema, valuePath, propertyName);
		if (!propertySchema) {
			return undefined;
		}

		// Build hover content
		const hoverContent = this.buildHoverContent(propertyName, propertySchema);
		return new vscode.Hover(hoverContent, wordRange);
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
		
		// Check if we already have it cached
		if (this.schemaCache.has(cacheKey)) {
			const cached = this.schemaCache.get(cacheKey);
			return cached ?? undefined;
		}

		// Fetch the schema
		try {
			const schema = await helmChartSchemaFetcher.fetchSchema(chartRef);
			this.schemaCache.set(cacheKey, schema as JsonSchema ?? null);
			return schema as JsonSchema | undefined;
		} catch (error) {
			console.error('Failed to fetch schema for hover:', error);
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
		
		// Start from the line after "values:"
		const valuesStartLine = valuesRange.start.line;

		// Walk backwards from current position to build path
		let trackIndent = currentIndent;
		for (let lineNum = currentLine - 1; lineNum > valuesStartLine; lineNum--) {
			const line = document.lineAt(lineNum).text;
			const lineIndent = this.getIndentLevel(line);
			
			// Skip empty lines and comments
			if (line.trim() === '' || line.trim().startsWith('#')) {
				continue;
			}

			// If this line has lower indent than what we're tracking, it's a parent
			if (lineIndent < trackIndent) {
				const keyMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*:/);
				if (keyMatch) {
					path.unshift(keyMatch[1]);
					trackIndent = lineIndent;
				}
			}
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
	 * Navigate to a property in the schema
	 */
	private getPropertySchema(
		schema: JsonSchema,
		path: string[],
		propertyName: string
	): SchemaProperty | undefined {
		let currentSchema: SchemaProperty | JsonSchema = schema;
		
		// Navigate through the path
		for (const key of path) {
			if (currentSchema.properties && currentSchema.properties[key]) {
				currentSchema = currentSchema.properties[key];
			} else {
				return undefined;
			}
		}

		// Get the target property
		if (currentSchema.properties && currentSchema.properties[propertyName]) {
			return currentSchema.properties[propertyName];
		}

		return undefined;
	}

	/**
	 * Build markdown hover content for a schema property
	 */
	private buildHoverContent(name: string, schema: SchemaProperty): vscode.MarkdownString {
		const md = new vscode.MarkdownString();
		md.isTrusted = true;

		// Property name as header
		md.appendMarkdown(`### \`${name}\`\n\n`);

		// Description
		if (schema.description) {
			md.appendMarkdown(`${schema.description}\n\n`);
		}

		// Type
		const typeInfo = this.getTypeString(schema);
		if (typeInfo) {
			md.appendMarkdown(`**Type:** \`${typeInfo}\`\n\n`);
		}

		// Default value
		if (schema.default !== undefined) {
			const defaultStr = typeof schema.default === 'string' 
				? `"${schema.default}"` 
				: JSON.stringify(schema.default, null, 2);
			md.appendMarkdown(`**Default:** \`${defaultStr}\`\n\n`);
		}

		// Enum values
		if (schema.enum && schema.enum.length > 0) {
			const enumStr = schema.enum.map(v => `\`${v}\``).join(', ');
			md.appendMarkdown(`**Allowed values:** ${enumStr}\n\n`);
		}

		// Required indicator
		// This would need context from parent to know if required

		// Nested properties hint
		if (schema.properties) {
			const propCount = Object.keys(schema.properties).length;
			md.appendMarkdown(`*This property has ${propCount} nested properties*\n`);
		}

		return md;
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
			const itemType = this.getTypeString(schema.items);
			return itemType ? `array<${itemType}>` : 'array';
		}
		
		return 'any';
	}

	/**
	 * Clear cached schemas
	 */
	public clearCache(): void {
		this.schemaCache.clear();
	}
}

// Singleton instance
export const helmReleaseValuesHoverProvider = new HelmReleaseValuesHoverProvider();