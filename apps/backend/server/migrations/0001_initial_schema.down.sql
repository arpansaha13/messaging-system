-- Down migration: Drop all tables

DROP INDEX IF EXISTS idx_message_recipients_receiver_id;
DROP INDEX IF EXISTS idx_message_recipients_message_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_chats_sender_id;
DROP INDEX IF EXISTS idx_chats_receiver_id;
DROP INDEX IF EXISTS idx_groups_created_by;
DROP INDEX IF EXISTS idx_user_groups_user_id;
DROP INDEX IF EXISTS idx_user_groups_group_id;
DROP INDEX IF EXISTS idx_invites_group_id;
DROP INDEX IF EXISTS idx_invites_inviter_id;

DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS user_groups;
DROP TABLE IF EXISTS message_recipients;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS chats;
