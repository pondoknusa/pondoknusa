import { registerVectorSearchDriver } from './search-driver.js';
import { MemoryVectorSearchDriver } from './memory-search-driver.js';
import { SqliteVectorSearchDriver } from './sqlite-vector-search-driver.js';

export function registerInMemoryVectorSearchDriver(): void {
  registerVectorSearchDriver(new MemoryVectorSearchDriver());
}

export function registerSqliteVectorSearchDriver(): void {
  registerVectorSearchDriver(new SqliteVectorSearchDriver());
}

export function registerLocalVectorSearchDriver(driver: 'memory' | 'sqlite' = 'sqlite'): void {
  if (driver === 'memory') {
    registerInMemoryVectorSearchDriver();
    return;
  }

  registerSqliteVectorSearchDriver();
}