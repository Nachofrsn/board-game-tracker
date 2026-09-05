import pg from 'pg'
const { Pool } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ Error: Falta definir DATABASE_URL en .env')
  process.exit(1)
}

const pool = new Pool({ connectionString })

const sql = `
-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  username TEXT UNIQUE,
  "displayUsername" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "scope" TEXT,
  password TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  issuer TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_accountId_uidx" ON account (issuer, "accountId");

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Board game tracker tables
CREATE TABLE IF NOT EXISTS board_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT NOT NULL,
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_group_players (
  group_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  PRIMARY KEY (group_id, player_id)
);

CREATE TABLE IF NOT EXISTS board_games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_group_games (
  group_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  PRIMARY KEY (group_id, game_id)
);

CREATE TABLE IF NOT EXISTS board_matches (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  winner_id TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_match_players (
  match_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  PRIMARY KEY (match_id, player_id)
);

-- Friendships table
CREATE TABLE IF NOT EXISTS user_friendships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_friendship UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON user_friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON user_friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_board_groups_invite_code ON board_groups(invite_code);

-- Alter columns in case tables already existed without them
ALTER TABLE board_groups ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE board_groups ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE board_players ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "displayUsername" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "user_username_uidx" ON "user" (username);
CREATE UNIQUE INDEX IF NOT EXISTS "user_username_lower_uidx" ON "user" (LOWER(username));
`

async function main() {
  console.log('⏳ Conectando a PostgreSQL y creando tablas...')
  const client = await pool.connect()
  try {
    await client.query(sql)
    console.log('✅ Todas las tablas se crearon correctamente.')
  } catch (err) {
    console.error('❌ Error ejecutando migración:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
