CREATE TABLE IF NOT EXISTS mining_jobs_next (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_error TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (wallet_id) REFERENCES mining_wallets(id)
);

INSERT INTO mining_jobs_next (id, user_id, wallet_id, status, created_at, updated_at, last_error)
SELECT id, user_id, wallet_id, status, created_at, updated_at, last_error
FROM mining_jobs;

DROP TABLE mining_jobs;

ALTER TABLE mining_jobs_next RENAME TO mining_jobs;

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON mining_jobs(user_id);
