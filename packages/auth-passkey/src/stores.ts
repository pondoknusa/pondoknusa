/**
 * In-memory challenge store and credential repository (default / testing).
 */

import type {
  PasskeyChallengeRecord,
  PasskeyChallengeStore,
  PasskeyCredential,
  PasskeyCredentialRepository,
} from './types.js';

export class MemoryChallengeStore implements PasskeyChallengeStore {
  private readonly records = new Map<string, PasskeyChallengeRecord>();

  async put(record: PasskeyChallengeRecord): Promise<void> {
    this.records.set(record.challenge, record);
  }

  async take(challenge: string): Promise<PasskeyChallengeRecord | null> {
    const record = this.records.get(challenge) ?? null;
    if (record) {
      this.records.delete(challenge);
    }
    if (record && record.expiresAt < Date.now()) {
      return null;
    }
    return record;
  }

  clear(): void {
    this.records.clear();
  }
}

export class MemoryCredentialRepository implements PasskeyCredentialRepository {
  private readonly byId = new Map<string, PasskeyCredential>();

  async findByCredentialId(id: string): Promise<PasskeyCredential | null> {
    return this.byId.get(id) ?? null;
  }

  async findByUserId(userId: string | number): Promise<PasskeyCredential[]> {
    const id = String(userId);
    return [...this.byId.values()].filter((c) => String(c.userId) === id);
  }

  async save(credential: PasskeyCredential): Promise<void> {
    this.byId.set(credential.id, {
      ...credential,
      publicKey: new Uint8Array(credential.publicKey),
      transports: credential.transports ? [...credential.transports] : undefined,
    });
  }

  async updateCounter(id: string, counter: number): Promise<void> {
    const existing = this.byId.get(id);
    if (!existing) {
      throw new Error(`Passkey credential not found: ${id}`);
    }
    existing.counter = counter;
  }

  async delete(id: string): Promise<void> {
    this.byId.delete(id);
  }

  clear(): void {
    this.byId.clear();
  }
}
