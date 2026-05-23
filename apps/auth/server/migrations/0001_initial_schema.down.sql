-- 1. Drop dependent/child tables first
DROP TABLE IF EXISTS user_providers;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS otps;
DROP TABLE IF EXISTS credentials;

-- 2. Drop the parent table last
DROP TABLE IF EXISTS users;

-- 3. (Optional) Explicitly drop indexes if they aren't tied to the tables
-- Note: PostgreSQL usually drops indexes automatically when the table is dropped,
-- but explicit cleanup is a "best practice" for complex migrations.
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_sessions_token;