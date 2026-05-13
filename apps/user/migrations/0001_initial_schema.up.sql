CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT PRIMARY KEY, -- Same as auth user id
    global_name TEXT NOT NULL,
    dp TEXT,
    bio TEXT DEFAULT 'Hey there!',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_profiles_deleted_at ON user_profiles(deleted_at);
