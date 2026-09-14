import { PresenceUserDto } from './realtime.types.js';

export class PresenceStore {
  private store = new Map<string, PresenceUserDto>();
  private readonly ttlMs: number;

  constructor(ttlMs = 30_000) {
    this.ttlMs = ttlMs;
  }

  public updatePresence(user: PresenceUserDto): void {
    this.store.set(user.userId, {
      ...user,
      lastSeen: Date.now()
    });
  }

  public getActiveCollaborators(projectId: string): PresenceUserDto[] {
    const cutoff = Date.now() - this.ttlMs;
    const active: PresenceUserDto[] = [];
    for (const [userId, user] of this.store.entries()) {
      if (user.lastSeen && user.lastSeen > cutoff && user.projectId === projectId) {
        active.push(user);
      } else if (user.lastSeen && user.lastSeen <= cutoff) {
        this.store.delete(userId); // lazy eviction of expired records
      }
    }
    return active;
  }

  public clear(): void {
    this.store.clear();
  }
}

export const presenceStore = new PresenceStore();
