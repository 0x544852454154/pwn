const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');

    const migrations = [
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties TEXT[]`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_solve_at TIMESTAMP`,
      `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS first_blood_user_id INTEGER REFERENCES users(id)`,
      `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS first_blood_at TIMESTAMP`,
      `CREATE TABLE IF NOT EXISTS writeups (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        visibility VARCHAR(20) DEFAULT 'PUBLIC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`,
    ];

    for (const sql of migrations) {
      await client.query(sql);
      console.log('✓', sql.split(' ')[2] || sql.split(' ')[0]);
    }

    console.log('✓ Migration completed successfully');
    await client.end();
  } catch (error) {
    console.error('✗ Migration error:', error);
    process.exit(1);
  }
}

migrate();
