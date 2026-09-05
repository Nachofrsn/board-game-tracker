import { pgTable, text, integer, timestamp, primaryKey, boolean, index } from 'drizzle-orm/pg-core'

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('displayUsername'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const userFriendships = pgTable('user_friendships', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: text('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'rejected'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('idx_friendships_user').on(t.userId),
  friendIdx: index('idx_friendships_friend').on(t.friendId),
  userStatusIdx: index('idx_friendships_user_status').on(t.userId, t.status),
  friendStatusIdx: index('idx_friendships_friend_status').on(t.friendId, t.status),
}))

export const boardGroups = pgTable('board_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  inviteCode: text('invite_code').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdByIdx: index('idx_board_groups_created_by').on(t.createdBy),
}))

export const boardPlayers = pgTable('board_players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  initials: text('initials').notNull(),
  color: text('color').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('idx_board_players_user_id').on(t.userId),
}))

export const boardGroupPlayers = pgTable('board_group_players', {
  groupId: text('group_id').notNull().references(() => boardGroups.id, { onDelete: 'cascade' }),
  playerId: text('player_id').notNull().references(() => boardPlayers.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.groupId, t.playerId] }),
  playerIdx: index('idx_board_group_players_player').on(t.playerId),
}))

export const boardGames = pgTable('board_games', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  color: text('color').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const boardGroupGames = pgTable('board_group_games', {
  groupId: text('group_id').notNull().references(() => boardGroups.id, { onDelete: 'cascade' }),
  gameId: text('game_id').notNull().references(() => boardGames.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.groupId, t.gameId] }),
  gameIdx: index('idx_board_group_games_game').on(t.gameId),
}))

export const boardMatches = pgTable('board_matches', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => boardGroups.id, { onDelete: 'cascade' }),
  gameId: text('game_id').notNull().references(() => boardGames.id, { onDelete: 'cascade' }),
  winnerId: text('winner_id').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  playedAt: timestamp('played_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  groupIdx: index('idx_board_matches_group_id').on(t.groupId),
  gameIdx: index('idx_board_matches_game_id').on(t.gameId),
  winnerIdx: index('idx_board_matches_winner_id').on(t.winnerId),
  playedAtIdx: index('idx_board_matches_played_at').on(t.playedAt),
}))

export const boardMatchPlayers = pgTable('board_match_players', {
  matchId: text('match_id').notNull().references(() => boardMatches.id, { onDelete: 'cascade' }),
  playerId: text('player_id').notNull().references(() => boardPlayers.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.matchId, t.playerId] }),
  playerIdx: index('idx_board_match_players_player').on(t.playerId),
}))

