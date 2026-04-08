import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Cached schema entry
 */
interface SchemaCacheEntry {
	/** The JSON schema object */
	schema: object;
	/** When this entry was cached (ISO timestamp) */
	cachedAt: string;
	/** Time-to-live in milliseconds */
	ttl: number;
}

/**
 * Cache for Helm chart JSON schemas
 * Provides both in-memory and disk caching
 */
export class SchemaCache {
	/** In-memory cache */
	private memoryCache: Map<string, SchemaCacheEntry> = new Map();
	
	/** Default TTL: 24 hours */
	private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000;
	
	/** Disk cache directory name */
	private readonly CACHE_DIR = 'helm-schemas';
	
	/** Extension context for storage path */
	private context?: vscode.ExtensionContext;

	/**
	 * Initialize the cache with extension context for disk storage
	 */
	public initialize(context: vscode.ExtensionContext): void {
		this.context = context;
		this.ensureCacheDirectory();
	}

	/**
	 * Get a schema from cache
	 * Checks memory first, then disk
	 */
	public get(key: string): object | undefined {
		// Check memory cache first
		const memEntry = this.memoryCache.get(key);
		if (memEntry && !this.isExpired(memEntry)) {
			return memEntry.schema;
		}

		// If expired in memory, remove it
		if (memEntry) {
			this.memoryCache.delete(key);
		}

		// Try disk cache
		const diskEntry = this.loadFromDisk(key);
		if (diskEntry && !this.isExpired(diskEntry)) {
			// Restore to memory cache
			this.memoryCache.set(key, diskEntry);
			return diskEntry.schema;
		}

		// If expired on disk, remove it
		if (diskEntry) {
			this.removeFromDisk(key);
		}

		return undefined;
	}

	/**
	 * Store a schema in cache (both memory and disk)
	 */
	public set(key: string, schema: object, ttl?: number): void {
		const entry: SchemaCacheEntry = {
			schema,
			cachedAt: new Date().toISOString(),
			ttl: ttl ?? this.DEFAULT_TTL
		};

		// Store in memory
		this.memoryCache.set(key, entry);

		// Store on disk
		this.saveToDisk(key, entry);
	}

	/**
	 * Check if a key exists in cache (and is not expired)
	 */
	public has(key: string): boolean {
		return this.get(key) !== undefined;
	}

	/**
	 * Remove a schema from cache
	 */
	public delete(key: string): void {
		this.memoryCache.delete(key);
		this.removeFromDisk(key);
	}

	/**
	 * Clear all cached schemas
	 */
	public clear(): void {
		this.memoryCache.clear();
		this.clearDiskCache();
	}

	/**
	 * Get cache statistics
	 */
	public getStats(): { memoryEntries: number; diskEntries: number } {
		const diskEntries = this.countDiskEntries();
		return {
			memoryEntries: this.memoryCache.size,
			diskEntries
		};
	}

	/**
	 * Check if a cache entry is expired
	 */
	private isExpired(entry: SchemaCacheEntry): boolean {
		const cachedTime = new Date(entry.cachedAt).getTime();
		const now = Date.now();
		return (now - cachedTime) > entry.ttl;
	}

	/**
	 * Get the disk cache directory path
	 */
	private getCacheDirectory(): string | undefined {
		if (!this.context) {
			return undefined;
		}
		return path.join(this.context.globalStorageUri.fsPath, this.CACHE_DIR);
	}

	/**
	 * Ensure the cache directory exists
	 */
	private ensureCacheDirectory(): void {
		const cacheDir = this.getCacheDirectory();
		if (cacheDir && !fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
	}

	/**
	 * Convert cache key to safe filename
	 */
	private keyToFilename(key: string): string {
		// Replace unsafe characters with underscores
		return key.replace(/[/\\:*?"<>|@]/g, '_') + '.json';
	}

	/**
	 * Load a schema from disk cache
	 */
	private loadFromDisk(key: string): SchemaCacheEntry | undefined {
		const cacheDir = this.getCacheDirectory();
		if (!cacheDir) {
			return undefined;
		}

		const filepath = path.join(cacheDir, this.keyToFilename(key));
		
		try {
			if (fs.existsSync(filepath)) {
				const content = fs.readFileSync(filepath, 'utf-8');
				return JSON.parse(content) as SchemaCacheEntry;
			}
		} catch (error) {
			// Corrupted cache file, ignore
			console.warn(`Failed to load schema cache for ${key}:`, error);
		}

		return undefined;
	}

	/**
	 * Save a schema to disk cache
	 */
	private saveToDisk(key: string, entry: SchemaCacheEntry): void {
		const cacheDir = this.getCacheDirectory();
		if (!cacheDir) {
			return;
		}

		this.ensureCacheDirectory();
		const filepath = path.join(cacheDir, this.keyToFilename(key));

		try {
			fs.writeFileSync(filepath, JSON.stringify(entry, null, 2), 'utf-8');
		} catch (error) {
			console.warn(`Failed to save schema cache for ${key}:`, error);
		}
	}

	/**
	 * Remove a schema from disk cache
	 */
	private removeFromDisk(key: string): void {
		const cacheDir = this.getCacheDirectory();
		if (!cacheDir) {
			return;
		}

		const filepath = path.join(cacheDir, this.keyToFilename(key));

		try {
			if (fs.existsSync(filepath)) {
				fs.unlinkSync(filepath);
			}
		} catch (error) {
			console.warn(`Failed to remove schema cache for ${key}:`, error);
		}
	}

	/**
	 * Clear all disk cache entries
	 */
	private clearDiskCache(): void {
		const cacheDir = this.getCacheDirectory();
		if (!cacheDir || !fs.existsSync(cacheDir)) {
			return;
		}

		try {
			const files = fs.readdirSync(cacheDir);
			for (const file of files) {
				if (file.endsWith('.json')) {
					fs.unlinkSync(path.join(cacheDir, file));
				}
			}
		} catch (error) {
			console.warn('Failed to clear schema disk cache:', error);
		}
	}

	/**
	 * Count disk cache entries
	 */
	private countDiskEntries(): number {
		const cacheDir = this.getCacheDirectory();
		if (!cacheDir || !fs.existsSync(cacheDir)) {
			return 0;
		}

		try {
			const files = fs.readdirSync(cacheDir);
			return files.filter(f => f.endsWith('.json')).length;
		} catch {
			return 0;
		}
	}
}

// Singleton instance
export const schemaCache = new SchemaCache();