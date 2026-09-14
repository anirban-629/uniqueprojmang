export interface PresenceUserDto {
  userId: string;
  userName: string;
  projectId: string;
  activeBoard: string;
  cursor?: { x: number; y: number };
  lastSeen?: number;
}

export interface PresenceUpdateResultDto {
  activeCollaborators: PresenceUserDto[];
}

export interface RealtimeStreamQueryDto {
  projectId?: string;
}

export interface RealtimeStreamRoute {
  Querystring: RealtimeStreamQueryDto;
}

export interface UpdatePresenceRoute {
  Body: PresenceUserDto;
}
