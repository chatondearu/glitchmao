import { relations } from 'drizzle-orm'
import { boolean, index, pgEnum, pgTable, text, timestamp, uuid, varchar, char } from 'drizzle-orm/pg-core'

export const signatureStatusEnum = pgEnum('signature_status', ['AUTHENTIQUE', 'CORROMPU/INCONNU'])
export const signatureSourceTypeEnum = pgEnum('signature_source_type', ['image', 'pdf', 'text', 'markdown', 'plain_text'])
export const storageProviderEnum = pgEnum('storage_provider', ['none', 's3', 'custom'])
export const gpgKeyStatusEnum = pgEnum('gpg_key_status', ['active', 'compromised'])
export const gpgCompromiseReasonEnum = pgEnum('gpg_compromise_reason', ['user_report', 'suspected_leak', 'other'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  handle: varchar('handle', { length: 80 }).notNull().unique(),
  displayName: varchar('display_name', { length: 120 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  keyFingerprint: varchar('key_fingerprint', { length: 120 }),
  onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
  onboardingVersion: varchar('onboarding_version', { length: 32 }).default('v1').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  userIdIdx: index('idx_profiles_user_id').on(table.userId),
}))

export const gpgKeys = pgTable('gpg_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fingerprint: varchar('fingerprint', { length: 120 }).notNull().unique(),
  keyId: varchar('key_id', { length: 32 }),
  algorithm: varchar('algorithm', { length: 32 }),
  status: gpgKeyStatusEnum('status').default('active').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  userIdIdx: index('idx_gpg_keys_user_id').on(table.userId),
  defaultIdx: index('idx_gpg_keys_user_default').on(table.userId),
}))

export const gpgKeyCompromiseEvents = pgTable('gpg_key_compromise_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  gpgKeyId: uuid('gpg_key_id').notNull().references(() => gpgKeys.id, { onDelete: 'cascade' }),
  reason: gpgCompromiseReasonEnum('reason').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  keyIdx: index('idx_gpg_compromise_key_id').on(table.gpgKeyId),
}))

export const signatures = pgTable('signatures', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicId: varchar('public_id', { length: 24 }).notNull().unique(),
  contentHash: char('content_hash', { length: 64 }).notNull(),
  signature: text('signature').notNull(),
  creatorId: text('creator_id').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  sourceType: signatureSourceTypeEnum('source_type').default('plain_text').notNull(),
  contentMimeType: varchar('content_mime_type', { length: 120 }),
  verificationUrl: text('verification_url').notNull(),
  status: signatureStatusEnum('status').default('AUTHENTIQUE').notNull(),
  storageProvider: storageProviderEnum('storage_provider').default('none').notNull(),
  storageObjectUrl: text('storage_object_url'),
  signingKeyId: uuid('signing_key_id').references(() => gpgKeys.id, { onDelete: 'set null' }),
  signingKeyFingerprint: varchar('signing_key_fingerprint', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastVerificationAt: timestamp('last_verification_at', { withTimezone: true }),
}, table => ({
  contentHashIdx: index('idx_signatures_content_hash').on(table.contentHash),
  publicIdIdx: index('idx_signatures_public_id').on(table.publicId),
  createdAtIdx: index('idx_signatures_created_at').on(table.createdAt.desc()),
  profileCreatedAtIdx: index('idx_signatures_profile_created_at').on(table.profileId, table.createdAt.desc()),
  sourceCreatedAtIdx: index('idx_signatures_source_created_at').on(table.sourceType, table.createdAt.desc()),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  signatures: many(signatures),
  gpgKeys: many(gpgKeys),
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  signatures: many(signatures),
}))

export const gpgKeysRelations = relations(gpgKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [gpgKeys.userId],
    references: [users.id],
  }),
  signatures: many(signatures),
  compromiseEvents: many(gpgKeyCompromiseEvents),
}))

export const gpgKeyCompromiseEventsRelations = relations(gpgKeyCompromiseEvents, ({ one }) => ({
  key: one(gpgKeys, {
    fields: [gpgKeyCompromiseEvents.gpgKeyId],
    references: [gpgKeys.id],
  }),
}))

export const signaturesRelations = relations(signatures, ({ one }) => ({
  user: one(users, {
    fields: [signatures.userId],
    references: [users.id],
  }),
  profile: one(profiles, {
    fields: [signatures.profileId],
    references: [profiles.id],
  }),
  signingKey: one(gpgKeys, {
    fields: [signatures.signingKeyId],
    references: [gpgKeys.id],
  }),
}))
