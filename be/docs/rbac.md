# RBAC Design

Status: initial backend foundation.

## Principle

Auth and RBAC are separated:

- Auth answers: who is this user?
- RBAC answers: what can this user do?

The current implementation already has RBAC tables and a temporary trusted-header current-user middleware. Real auth can replace the middleware internals later without changing `GET /api/v1/me`.

## Tables

- `users`: identity record. Password auth can be added through `password_hash`; OAuth/OTP can be added later without changing RBAC.
- `roles`: system roles such as `ADMIN`, `TEACHER`, `DONOR`, `VALIDATOR`.
- `permissions`: granular actions such as `teachers:read`, `reports:approve`.
- `role_permissions`: permissions assigned to a role.
- `user_roles`: roles assigned to a user.

## Seeded Roles

| Role | Meaning |
| --- | --- |
| `ADMIN` | Yayasan operator/admin. Full permissions. |
| `TEACHER` | Guru penerima bantuan. Can manage own profile and reports. |
| `DONOR` | Donatur. Can view teachers/reports and create donations. |
| `VALIDATOR` | Kepala sekolah/validator. Can validate teacher submissions. |

## Seeded Permissions

| Permission | Purpose |
| --- | --- |
| `overview:read` | View program overview. |
| `teachers:read` | View teacher profiles. |
| `teachers:write` | Create/update teacher profiles. |
| `teachers:validate` | Validate teacher submissions. |
| `donations:read` | View donations and distribution data. |
| `donations:write` | Create donations. |
| `reports:read` | View teacher reports. |
| `reports:write` | Create teacher reports. |
| `reports:approve` | Approve/reject teacher reports. |
| `institutions:read` | View schools/institutions. |
| `institutions:write` | Manage schools/institutions. |
| `ledger:read` | View financial ledger. |
| `settings:write` | Manage program settings. |

## Initial Role Permissions

| Role | Permissions |
| --- | --- |
| `ADMIN` | All permissions. |
| `DONOR` | `overview:read`, `teachers:read`, `reports:read`, `donations:write` |
| `TEACHER` | `overview:read`, `teachers:read`, `teachers:write`, `reports:read`, `reports:write` |
| `VALIDATOR` | `overview:read`, `teachers:read`, `teachers:validate`, `institutions:read` |

## Current User Contract

`GET /api/v1/me` returns:

```json
{
  "data": {
    "id": "user-id",
    "email": "admin@beaguru.id",
    "name": "Admin",
    "role": "ADMIN",
    "roles": ["ADMIN"],
    "permissions": ["overview:read", "teachers:read"]
  }
}
```

Temporary dev headers:

- `X-User-ID`
- `X-User-Email`
- `X-User-Name`
- `X-User-Role`
- `X-User-Roles`
- `X-User-Permissions`

## Auth Later

When auth is implemented:

1. Validate session/JWT/API token in middleware.
2. Load user by ID/email.
3. Load roles and permissions from DB.
4. Set the same `CurrentUser` object in Gin context.
5. Keep `/api/v1/me` response shape stable.

