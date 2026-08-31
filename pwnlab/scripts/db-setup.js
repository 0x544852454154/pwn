const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        pin_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Discord accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS discord_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        discord_id VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        banner_url TEXT,
        rank_title VARCHAR(50),
        specialties TEXT[],
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_solve_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Challenge categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenge_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Challenges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER REFERENCES challenge_categories(id),
        difficulty VARCHAR(20) NOT NULL,
        points INTEGER NOT NULL,
        estimated_time INTEGER,
        storage_path TEXT,
        flag VARCHAR(255) NOT NULL,
        creator_id INTEGER REFERENCES users(id),
        visibility VARCHAR(20) DEFAULT 'PRIVATE',
        first_blood_user_id INTEGER REFERENCES users(id),
        first_blood_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Challenge objectives table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenge_objectives (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        objective TEXT NOT NULL,
        order_num INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Challenge hints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenge_hints (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        hint_text TEXT NOT NULL,
        point_penalty INTEGER DEFAULT 0,
        order_num INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Challenge submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenge_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        flag_submitted VARCHAR(255) NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, challenge_id)
      );
    `);

    // Challenge completions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenge_completions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        points_earned INTEGER,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, challenge_id)
      );
    `);

    // Machines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS machines (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        target_ip VARCHAR(15),
        ports TEXT,
        status VARCHAR(20) DEFAULT 'STOPPED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Active machine instances table
    await client.query(`
      CREATE TABLE IF NOT EXISTS machine_instances (
        id SERIAL PRIMARY KEY,
        machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        instance_id VARCHAR(50) UNIQUE,
        status VARCHAR(20) DEFAULT 'RUNNING',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        target_ip VARCHAR(15)
      );
    `);

    // Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Team members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'MEMBER',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      );
    `);

    // Competitions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS competitions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        creator_id INTEGER REFERENCES users(id),
        description TEXT,
        mode VARCHAR(20) DEFAULT 'TEAM',
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        status VARCHAR(20) DEFAULT 'SCHEDULED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Competition participants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS competition_participants (
        id SERIAL PRIMARY KEY,
        competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        points_earned INTEGER DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Writeups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS writeups (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        visibility VARCHAR(20) DEFAULT 'PUBLIC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Activity log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default categories
    const categories = [
      'LINUX',
      'NETWORKING',
      'WEB',
      'CRYPTOGRAPHY',
      'FORENSICS',
      'OSINT',
      'REVERSE ENGINEERING',
      'BINARY EXPLOITATION',
      'PRIVILEGE ESCALATION',
      'ACTIVE DIRECTORY',
      'API SECURITY',
      'STEGANOGRAPHY',
      'MALWARE ANALYSIS'
    ];

    for (const cat of categories) {
      await client.query(
        'INSERT INTO challenge_categories (name) VALUES ($1) ON CONFLICT DO NOTHING',
        [cat]
      );
    }

    console.log('✓ Database tables created successfully');
    await client.end();
  } catch (error) {
    console.error('✗ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
