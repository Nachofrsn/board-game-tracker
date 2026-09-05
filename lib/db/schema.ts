import { pgTable, text, integer, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('displayUsername'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const userFriendships = pgTable('user_friendships', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  friendId: text('friend_id').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'rejected'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const boardGroups = pgTable('board_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull(),
  createdBy: text('created_by'),
  inviteCode: text('invite_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const boardPlayers = pgTable('board_players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  initials: text('initials').notNull(),
  color: text('color').notNull(),
  userId: text('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const boardGroupPlayers = pgTable('board_group_players', {
  groupId: text('group_id').notNull(),
  playerId: text('player_id').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.groupId, t.playerId] }),
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
  groupId: text('group_id').notNull(),
  gameId: text('game_id').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.groupId, t.gameId] }),
}))

export const boardMatches = pgTable('board_matches', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull(),
  gameId: text('game_id').notNull(),
  winnerId: text('winner_id').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  playedAt: timestamp('played_at', { withTimezone: true }).notNull().defaultNow(),
})

export const boardMatchPlayers = pgTable('board_match_players', {
  matchId: text('match_id').notNull(),
  playerId: text('player_id').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.matchId, t.playerId] }),
}))
