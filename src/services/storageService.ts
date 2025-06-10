export interface StorageConfig {
  key: string;
  version: number;
  migrations?: Record<number, (data: any) => any>;
}

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class StorageService {
  private static instance: StorageService;
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async save<T>(config: StorageConfig, data: T): Promise<StorageResult<T>> {
    try {
      // Auto-backup before save
      await this.createBackup(config.key);
      
      const versionedData = {
        version: config.version,
        data,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(config.key, JSON.stringify(versionedData));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async load<T>(config: StorageConfig): Promise<StorageResult<T>> {
    try {
      const stored = localStorage.getItem(config.key);
      if (!stored) {
        return { success: true, data: undefined };
      }

      const parsed = JSON.parse(stored);
      
      // Handle version migrations
      if (parsed.version !== config.version && config.migrations) {
        const migrated = await this.runMigrations(parsed, config);
        if (migrated.success) {
          await this.save(config, migrated.data);
          return { success: true, data: migrated.data };
        }
        return migrated;
      }

      return { success: true, data: parsed.data };
    } catch (error) {
      // Try to restore from backup
      const backup = await this.restoreFromBackup<T>(config.key);
      if (backup.success) {
        return backup;
      }
      
      return {
        success: false,
        error: `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async clear(key: string): Promise<StorageResult<void>> {
    try {
      await this.createBackup(key);
      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async createBackup(key: string): Promise<void> {
    const existing = localStorage.getItem(key);
    if (existing) {
      localStorage.setItem(`${key}_backup`, existing);
      localStorage.setItem(`${key}_backup_timestamp`, new Date().toISOString());
    }
  }

  private async restoreFromBackup<T>(key: string): Promise<StorageResult<T>> {
    try {
      const backup = localStorage.getItem(`${key}_backup`);
      if (backup) {
        const parsed = JSON.parse(backup);
        localStorage.setItem(key, backup);
        return { success: true, data: parsed.data };
      }
      return { success: false, error: 'No backup available' };
    } catch (error) {
      return {
        success: false,
        error: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async runMigrations(data: any, config: StorageConfig): Promise<StorageResult<any>> {
    try {
      let migrated = data.data;
      const currentVersion = data.version || 1;
      
      if (config.migrations) {
        for (let version = currentVersion + 1; version <= config.version; version++) {
          if (config.migrations[version]) {
            migrated = config.migrations[version](migrated);
          }
        }
      }
      
      return { success: true, data: migrated };
    } catch (error) {
      return {
        success: false,
        error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const storageService = StorageService.getInstance(); 