const { sqliteTable, text, index } = require('drizzle-orm/sqlite-core');
exports.feedback = sqliteTable('h2ostras_feedback', {
  id: text('id').primaryKey(),
  authorId: text('author_id').notNull(),
  authorEmail: text('author_email').notNull(),
  kind: text('kind').notNull(),
  message: text('message').notNull(),
  route: text('route').notNull(),
  pageTitle: text('page_title').notNull(),
  element: text('element').notNull(),
  selection: text('selection').notNull(),
  image: text('image'),
  status: text('status').notNull().default('Recebido'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, table => [index('feedback_author_date').on(table.authorId, table.createdAt), index('feedback_status_date').on(table.status, table.createdAt)]);
