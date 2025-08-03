import { pgTable, serial, varchar, jsonb, timestamp, integer, index } from "drizzle-orm/pg-core";

export const outboxEvents = pgTable('outbox_events', {
  id: serial('id').primaryKey(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
}, (table) => ([
  index('outbox_status_idx').on(table.status),
  index('outbox_created_at_idx').on(table.createdAt),
])); 