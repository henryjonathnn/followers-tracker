CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ig_user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS snapshot_members (
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  member_ig_id TEXT NOT NULL,
  member_username TEXT NOT NULL,
  list_type TEXT NOT NULL CHECK (list_type IN ('follower','following')),
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (account_id, member_ig_id, list_type)
);

CREATE TABLE IF NOT EXISTS job_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  followers_before INTEGER,
  followers_after INTEGER,
  new_follower_count INTEGER,
  unfollow_count INTEGER,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('new_follower','unfollow')),
  member_ig_id TEXT NOT NULL,
  member_username TEXT NOT NULL,
  member_profile_pic_url TEXT,
  was_mutual INTEGER NOT NULL DEFAULT 0,
  detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  job_run_id INTEGER REFERENCES job_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_events_account_type_time
  ON events(account_id, event_type, detected_at);
