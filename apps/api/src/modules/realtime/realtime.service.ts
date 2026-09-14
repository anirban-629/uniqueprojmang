import { presenceStore, PresenceStore } from './realtime.presence.state.js';
import { PresenceUserDto, PresenceUpdateResultDto } from './realtime.types.js';

export class RealtimeService {
  constructor(private readonly store: PresenceStore = presenceStore) {}

  public updatePresence(dto: PresenceUserDto): PresenceUpdateResultDto {
    this.store.updatePresence(dto);
    const active = this.store.getActiveCollaborators(dto.projectId);
    return {
      activeCollaborators: active
    };
  }

  public getActiveCollaborators(projectId: string): PresenceUserDto[] {
    return this.store.getActiveCollaborators(projectId);
  }
}

export const realtimeService = new RealtimeService();
