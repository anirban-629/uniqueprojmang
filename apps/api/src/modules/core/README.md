# Core Module

## Purpose

The `core` module owns the primary work-management domain within Flowline. It manages projects, sprint cadences, work item taxonomy (issues/tickets), status workflows (Kanban transitions), discussion comment streams, and architectural decision records (ADRs).

## Public Interface

| Method | Path | Description | Auth Required |
|---|---|---|---|
| GET | `/api/projects` | Lists all projects within the active company tenant | Yes |
| POST | `/api/projects` | Creates a new project and auto-seeds its initial active sprint | Yes |
| GET | `/api/projects/:id` | Fetches project by UUID or case-insensitive project key | Yes |
| GET | `/api/sprints` | Lists sprints, optionally filtered by `projectId` | Yes |
| POST | `/api/sprints` | Creates a new sprint cadence for a project | Yes |
| GET | `/api/issues` | Queries cursor-paginated issues with full filter support | Yes |
| GET | `/api/issues/:id` | Fetches issue details by UUID or human-readable key (e.g. `ENG-1`) | Yes |
| POST | `/api/issues` | Creates a work item with assigned taxonomy and sequential key | Yes |
| PATCH | `/api/issues/:id` | Updates issue fields and transitions Kanban workflow statuses | Yes |
| GET | `/api/comments` | Fetches activity comment stream for an issue | Yes |
| POST | `/api/comments` | Appends a comment to an issue with UUID/key resolution | Yes |
| GET | `/api/decisions` | Lists active Architectural Decision Records (ADRs) | Yes |

## Request/Response Contracts

### Key DTOs

```typescript
export interface CreateProjectDto {
  name: string;
  key: string;
  description?: string;
  color?: string;
  leadId?: string;
}

export interface CreateSprintDto {
  projectId: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateIssueDto {
  projectId: string;
  title: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string;
  sprintId?: string;
  storyPoints?: number;
  reporterId?: string;
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string;
  sprintId?: string;
  storyPoints?: number;
}

export interface CreateCommentDto {
  issueId: string;
  body: string;
}
```

## Business Logic Summary

The domain operations are encapsulated in `CoreService`:

1. **Project Management (`createProject`, `getProjects`, `getProjectByIdOrKey`):**
   - Resolves tenant and lead IDs against PostgreSQL.
   - Generates project records with unique keys per tenant.
   - Automatically provisions a default "Sprint 1" active sprint for every new project.
   - Assigns project creator/lead as a project member.
   - Supports transparent lookup by either internal UUID or human-friendly key (e.g., `ENG`).

2. **Issue Lifecycle (`createIssue`, `updateIssue`, `listIssues`):**
   - Automatically derives sequential issue key tokens (e.g., `PROJ-1`, `PROJ-2`).
   - Resolves taxonomies for types (`story`, `task`, `bug`, `epic`, `subtask`), statuses (`backlog`, `todo`, `in_progress`, `in_review`, `done`), and priorities (`urgent`, `high`, `medium`, `low`).
   - Supports cursor pagination for high-concurrency 50,000+ backlog queries.
   - Triggers optimistic updates on Kanban drag-and-drop actions.

3. **Discussion & Activity (`addComment`, `getComments`):**
   - Persists comment records linking author, timestamp, and issue.
   - Transparently handles issue keys and UUID foreign keys.

4. **Architectural Decisions (`getDecisions`):**
   - Retrieves active ADR records governing monorepo architecture and constraints.

## Data Model

Managed by `CoreRepository` (`core.repository.ts`) using PostgreSQL:

- **`projects`**: `id` (UUID), `tenant_id` (FK), `key` (unique per tenant), `name`, `description`, `lead_id`, `created_at`, `updated_at`.
- **`project_members`**: `id` (UUID), `tenant_id` (FK), `project_id` (FK), `user_id` (FK), `role`.
- **`sprints`**: `id` (UUID), `tenant_id` (FK), `project_id` (FK), `name`, `goal`, `status`, `start_date`, `end_date`.
- **`issues`**: `id` (UUID), `tenant_id` (FK), `project_id` (FK), `key`, `summary`, `description`, `issue_type_id`, `status_id`, `priority_id`, `assignee_id`, `reporter_id`, `sprint_id`, `story_points`, `sequence_num`.
- **`comments`**: `id` (UUID), `tenant_id` (FK), `issue_id` (FK), `author_id` (FK), `body`, `created_at`, `updated_at`.
- **`issue_types`**, **`issue_statuses`**, **`priorities`**: System-wide taxonomies and state definitions.

## Domain Events

### Published

- **`issue:created`**: Fired on work item creation.
  - Payload: `{ issueId: string, key: string, projectId: string, title: string, reporterId: string }`
- **`issue:updated`**: Fired on status transitions, edits, or assignments.
  - Payload: `{ issueId: string, key: string, projectId: string, changes: UpdateIssueDto }`
- **`comment:added`**: Fired when a comment is posted.
  - Payload: `{ issueId: string, commentId: string, authorId: string }`

### Subscribed

None.

## Dependencies

- **Internal Modules / Packages:**
  - `@flowline/types` — Domain types, DTOs, and event payloads.
  - `@flowline/db` — PostgreSQL connection pool.
  - `apps/api/src/shared/event-bus.ts` — Typed event dispatcher.
  - `apps/api/src/shared/errors/` — `NotFoundError`, `ValidationError`, `ConflictError`.

## Error Handling

| Error Class | HTTP Status | Trigger Condition |
|---|---|---|
| `ValidationError` | 400 Bad Request | Missing required fields, invalid status/priority values |
| `NotFoundError` | 404 Not Found | Project, issue, or sprint does not exist |
| `ConflictError` | 409 Conflict | Duplicate project key within the same tenant |

## Known Limitations / TODOs

- In-memory ADR decision fallback will be migrated to dedicated `decisions` table in Phase 2 schema expansion.

## Configuration

None specific; inherits `DATABASE_URL` and standard tenancy configuration.
