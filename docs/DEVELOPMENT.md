# Backend Development Checklist

## Setup Steps

- [ ] Install dependencies: `pnpm install`
- [ ] Build TypeScript: `pnpm run build`
- [ ] Run migrations: `pnpm run migrate:run`
- [ ] Verify database created: `backend.sqlite` should exist
- [ ] Start dev server: `pnpm run dev`
- [ ] Test auth endpoint: `curl http://localhost:4000/api/auth/check-auth`

## Available Endpoints

### Auth

- `GET /api/auth/check-auth` - Check if user is authenticated
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/validate-link/account/:hash` - Validate email verification link
- `POST /api/auth/verification/:hash` - Verify email with OTP

### Users

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Contacts

- `GET /api/contacts` - List contacts (requires `x-user-id` header)
- `GET /api/contacts?search=query` - Search contacts
- `POST /api/contacts` - Add new contact
- `PATCH /api/contacts/:contactId` - Edit contact alias
- `DELETE /api/contacts/:contactId` - Delete contact

### Groups

- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group by ID

### Channels

- `GET /api/channels/group/:groupId` - List channels in group
- `POST /api/channels/group/:groupId` - Create channel in group

### Messages

- `POST /api/messages/user/:receiverId` - Send message to user
- `GET /api/messages/user/:receiverId` - Get messages with user
- `GET /api/messages/channel/:channelId` - Get messages in channel

### Chats

- `GET /api/chats/with/:userId` - Get chat with user
- `POST /api/chats/ensure/:userId` - Ensure chat exists with user

### User Groups

- `GET /api/user-group/user/:userId` - Get user's groups
- `GET /api/user-group/group/:groupId/members` - Get group members
- `POST /api/user-group/group/:groupId/join` - Add user to group

### Invites

- `POST /api/invites/group/:groupId` - Create invite for group
- `GET /api/invites/:hash` - Get invite by hash

## Database

- **Type**: SQLite (default) or Postgres (configurable)
- **Location**: `backend.sqlite` (default)
- **Migrations**: `src/migrations/` (auto-compiled to `dist/migrations/`)
- **Entities**: `src/models/`

## Useful Commands

```bash
# Build
pnpm run build

# Dev (with hot reload)
pnpm run dev

# Migrations
pnpm run migrate:run        # Run pending
pnpm run migrate:revert     # Revert last
pnpm run migrate:show       # Show status

# Production build
pnpm run build
pnpm run start
```

## Notes

- Auth uses JWT + httpOnly cookies
- Use `x-user-id` header for testing endpoints that require authentication
- Default port: 4000 (set `PORT` env var to change)
- Default DB: SQLite at `backend.sqlite` (set `DB_PATH` env var to change)
