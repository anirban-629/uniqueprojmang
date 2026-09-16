import { randomUUID } from 'crypto';
import {
  DomainEvent,
  UserRegisteredEventPayload,
  UserLoggedInEventPayload,
  TenantCreatedEventPayload,
  MemberInvitedEventPayload
} from '@flowline/types';
import { eventBus } from '../../shared/event-bus.js';

export const AUTH_EVENTS = {
  USER_REGISTERED: 'auth:user_registered',
  USER_LOGGED_IN: 'auth:user_logged_in',
  TENANT_CREATED: 'auth:tenant_created',
  MEMBER_INVITED: 'auth:member_invited',
  TENANT_SWITCHED: 'auth:tenant_switched',
  MEMBER_ROLE_CHANGED: 'auth:member_role_changed'
} as const;

export function publishUserRegistered(payload: UserRegisteredEventPayload): void {
  const event: DomainEvent<UserRegisteredEventPayload> = {
    eventId: randomUUID(),
    tenantId: payload.tenantId,
    eventName: AUTH_EVENTS.USER_REGISTERED,
    occurredAt: new Date().toISOString(),
    payload
  };
  eventBus.publish(event);
}

export function publishUserLoggedIn(payload: UserLoggedInEventPayload): void {
  const event: DomainEvent<UserLoggedInEventPayload> = {
    eventId: randomUUID(),
    tenantId: payload.tenantId,
    eventName: AUTH_EVENTS.USER_LOGGED_IN,
    occurredAt: new Date().toISOString(),
    payload
  };
  eventBus.publish(event);
}

export function publishTenantCreated(payload: TenantCreatedEventPayload): void {
  const event: DomainEvent<TenantCreatedEventPayload> = {
    eventId: randomUUID(),
    tenantId: payload.tenantId,
    eventName: AUTH_EVENTS.TENANT_CREATED,
    occurredAt: new Date().toISOString(),
    payload
  };
  eventBus.publish(event);
}

export function publishMemberInvited(payload: MemberInvitedEventPayload): void {
  const event: DomainEvent<MemberInvitedEventPayload> = {
    eventId: randomUUID(),
    tenantId: payload.tenantId,
    eventName: AUTH_EVENTS.MEMBER_INVITED,
    occurredAt: new Date().toISOString(),
    payload
  };
  eventBus.publish(event);
}

export function publishMemberRoleChanged(payload: {
  tenantId: string;
  targetUserId: string;
  actorUserId: string;
  oldRole: string;
  newRole: string;
  projectId?: string;
}): void {
  const event: DomainEvent<typeof payload> = {
    eventId: randomUUID(),
    tenantId: payload.tenantId,
    eventName: AUTH_EVENTS.MEMBER_ROLE_CHANGED,
    occurredAt: new Date().toISOString(),
    payload
  };
  eventBus.publish(event);
}
