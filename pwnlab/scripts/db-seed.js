const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const seedData = {
  users: [
    { username: 'ShadowFox', pin: '583921' },
    { username: 'RootKid', pin: '294857' },
    { username: 'CyberNinja', pin: '712945' },
    { username: 'Operator', pin: '581203' },
    { username: 'Null', pin: '456789' },
  ],
  challenges: [
    {
      name: 'LOST CREDENTIALS',
      category: 'WEB',
      difficulty: 'EASY',
      points: 50,
      description: 'A website stores credentials in an insecure location. Find them.',
      flag: 'CTF{lost_creds_2024}',
      estimated_time: 15,
      objectives: ['Enumerate the website', 'Locate credential storage', 'Extract the flag'],
    },
    {
      name: 'HIDDEN HEADER',
      category: 'WEB',
      difficulty: 'EASY',
      points: 50,
      description: 'HTTP headers can reveal secrets. Investigate carefully.',
      flag: 'CTF{http_header_secret}',
      estimated_time: 10,
      objectives: ['Check HTTP response headers', 'Find the hidden value', 'Capture the flag'],
    },
    {
      name: 'TERMINAL ROOKIE',
      category: 'LINUX',
      difficulty: 'EASY',
      points: 50,
      description: 'Basic Linux command usage. Practice essential terminal skills.',
      flag: 'CTF{linux_basics_complete}',
      estimated_time: 20,
      objectives: ['Navigate directories', 'List files', 'Read the flag file'],
    },
    {
      name: 'BROKEN LOGIN',
      category: 'WEB',
      difficulty: 'MEDIUM',
      points: 150,
      description: 'Authentication bypass via SQL injection or parameter tampering.',
      flag: 'CTF{broken_auth_v1}',
      estimated_time: 30,
      objectives: ['Test login form', 'Identify vulnerability', 'Bypass authentication', 'Retrieve flag'],
    },
    {
      name: 'PACKET TRAIL',
      category: 'FORENSICS',
      difficulty: 'MEDIUM',
      points: 150,
      description: 'Analyze a packet capture file to find evidence of an attack.',
      flag: 'CTF{packet_forensics_detected}',
      estimated_time: 40,
      objectives: ['Open packet capture', 'Identify protocols', 'Find suspicious traffic', 'Extract flag'],
    },
    {
      name: 'CAESAR\'S REVENGE',
      category: 'CRYPTOGRAPHY',
      difficulty: 'EASY',
      points: 50,
      description: 'A classic cipher awaits. Rotate your way to victory.',
      flag: 'CTF{caesar_cipher_solved}',
      estimated_time: 15,
      objectives: ['Identify cipher type', 'Brute force rotation', 'Decode message'],
    },
    {
      name: 'SUSPICIOUS UPLOAD',
      category: 'WEB',
      difficulty: 'MEDIUM',
      points: 150,
      description: 'File upload vulnerability allows arbitrary code execution.',
      flag: 'CTF{file_upload_pwned}',
      estimated_time: 35,
      objectives: ['Find upload form', 'Bypass file filters', 'Upload malicious file', 'Execute code'],
    },
    {
      name: 'FORGOTTEN SERVICE',
      category: 'LINUX',
      difficulty: 'MEDIUM',
      points: 150,
      description: 'An unpatched service runs with elevated privileges.',
      flag: 'CTF{forgotten_service_exploited}',
      estimated_time: 45,
      objectives: ['Enumerate services', 'Find vulnerability', 'Exploit service', 'Gain shell'],
    },
    {
      name: 'DARK NETWORK',
      category: 'NETWORKING',
      difficulty: 'HARD',
      points: 250,
      description: 'Network segmentation failure exposes internal infrastructure.',
      flag: 'CTF{dark_network_mapping}',
      estimated_time: 60,
      objectives: ['Map network', 'Identify services', 'Find firewall gaps', 'Access internal systems'],
    },
    {
      name: 'BINARY SHADOWS',
      category: 'REVERSE ENGINEERING',
      difficulty: 'HARD',
      points: 250,
      description: 'Reverse engineer a binary to find the hidden logic.',
      flag: 'CTF{binary_reverse_engineered}',
      estimated_time: 90,
      objectives: ['Analyze binary', 'Find crypto', 'Unlock secret function', 'Extract flag'],
    },
    {
      name: 'ROOTED',
      category: 'PRIVILEGE ESCALATION',
      difficulty: 'HARD',
      points: 250,
      description: 'Escalate from user to root using kernel vulnerability.',
      flag: 'CTF{privilege_escalation_complete}',
      estimated_time: 75,
      objectives: ['Gain initial access', 'Enumerate system', 'Find privilege escalation path', 'Become root'],
    },
    {
      name: 'SHADOW DATABASE',
      category: 'WEB',
      difficulty: 'HARD',
      points: 250,
      description: 'Multi-stage exploitation chain targeting a development application.',
      flag: 'CTF{shadow_database_complete}',
      estimated_time: 90,
      objectives: ['Enumerate application', 'Identify vulnerability', 'Gain access', 'Capture database flag'],
    },
    {
      name: 'XSS PHANTOM',
      category: 'WEB',
      difficulty: 'EASY',
      points: 100,
      description: 'Reflected XSS vulnerability in a search parameter bypasses input sanitization.',
      flag: 'pwnlab{xss_phantom_strike}',
      estimated_time: 20,
      objectives: ['Identify XSS vector', 'Bypass filters', 'Craft payload', 'Steal session cookie'],
    },
    {
      name: 'COOKIE MONSTER',
      category: 'WEB',
      difficulty: 'MEDIUM',
      points: 150,
      description: 'Insecure session cookie handling allows privilege escalation to admin.',
      flag: 'pwnlab{cookie_monster_admin}',
      estimated_time: 30,
      objectives: ['Analyze cookies', 'Forge admin session', 'Access admin panel', 'Retrieve flag'],
    },
    {
      name: 'API INJECTION',
      category: 'WEB',
      difficulty: 'HARD',
      points: 250,
      description: 'GraphQL API introspection exposes sensitive fields and mutation abuse.',
      flag: 'pwnlab{api_injection_pwned}',
      estimated_time: 60,
      objectives: ['Introspect API schema', 'Find sensitive queries', 'Abuse mutations', 'Extract flag'],
    },
    {
      name: 'JWT JACKPOT',
      category: 'WEB',
      difficulty: 'MEDIUM',
      points: 200,
      description: 'Weak JWT implementation allows token forgery and privilege escalation.',
      flag: 'pwnlab{jwt_jackpot_forged}',
      estimated_time: 45,
      objectives: ['Analyze JWT structure', 'Find weak secret', 'Forge admin token', 'Access protected route'],
    },
    {
      name: 'BYTECODE GHOST',
      category: 'REVERSE ENGINEERING',
      difficulty: 'MEDIUM',
      points: 200,
      description: 'A Java bytecode challenge requires decompilation and dynamic analysis.',
      flag: 'pwnlab{bytecode_ghost_revealed}',
      estimated_time: 50,
      objectives: ['Decompile bytecode', 'Trace validation logic', 'Bypass checks', 'Extract flag'],
    },
    {
      name: 'ELF TRACER',
      category: 'REVERSE ENGINEERING',
      difficulty: 'HARD',
      points: 300,
      description: 'Linux ELF binary with anti-debugging and obfuscated control flow.',
      flag: 'pwnlab{elf_tracer_unpacked}',
      estimated_time: 90,
      objectives: ['Bypass anti-debug', 'Unpack binary', 'Analyze control flow', 'Find flag routine'],
    },
    {
      name: 'FIRMWARE EXTRACT',
      category: 'REVERSE ENGINEERING',
      difficulty: 'HARD',
      points: 350,
      description: 'Extract and reverse engineer embedded firmware to find hidden credentials.',
      flag: 'pwnlab{firmware_extract_root}',
      estimated_time: 120,
      objectives: ['Extract firmware', 'Identify filesystem', 'Find config files', 'Extract root credentials'],
    },
    {
      name: 'SHELLCODE LABYRINTH',
      category: 'REVERSE ENGINEERING',
      difficulty: 'MEDIUM',
      points: 250,
      description: 'Analyze position-independent shellcode to understand its behavior.',
      flag: 'pwnlab{shellcode_labyrinth_decoded}',
      estimated_time: 60,
      objectives: ['Set up analysis environment', 'Emulate shellcode', 'Identify syscalls', 'Decode embedded flag'],
    },
    {
      name: 'OBFUSCATED PYTHON',
      category: 'REVERSE ENGINEERING',
      difficulty: 'EASY',
      points: 100,
      description: 'A Python script with obfuscated strings hides the flag generation logic.',
      flag: 'pwnlab{obfuscated_python_deobfuscated}',
      estimated_time: 25,
      objectives: ['Deobfuscate strings', 'Trace execution flow', 'Identify flag generation', 'Recover flag'],
    },
  ],
  teams: [
    { name: 'NIGHT OWLS', owner: 'ShadowFox' },
    { name: 'ROOT ACCESS', owner: 'RootKid' },
    { name: 'NIGHT SHIFT', owner: 'CyberNinja' },
  ],
};

async function seedDatabase() {
  try {
    await client.connect();
    console.log('Seeding database...\n');

    // Seed users
    console.log('Adding users...');
    const userMap = {};
    for (const user of seedData.users) {
      const pin_hash = await bcrypt.hash(user.pin, 10);
      await client.query(
        'INSERT INTO users (username, pin_hash) VALUES ($1, $2)',
        [user.username, pin_hash]
      );
      const idResult = await client.query('SELECT id FROM users WHERE username = $1', [user.username]);
      userMap[user.username] = idResult.rows[0].id;
      console.log(`  ✓ ${user.username}`);
    }

    // Seed profiles
    console.log('\nAdding profiles...');
    for (const userId of Object.values(userMap)) {
      await client.query(
        'INSERT INTO profiles (user_id) VALUES ($1)',
        [userId]
      );
    }
    console.log('  ✓ Profiles created');

    // Seed categories (already done in setup, just verify)
    console.log('\nVerifying categories...');
    const categoriesResult = await client.query('SELECT id, name FROM challenge_categories ORDER BY name');
    const categoryMap = {};
    categoriesResult.rows.forEach(row => {
      categoryMap[row.name] = row.id;
    });
    console.log(`  ✓ ${categoriesResult.rows.length} categories available`);

    // Seed challenges
    console.log('\nAdding challenges...');
    const challengeMap = {};
    for (const challenge of seedData.challenges) {
      const categoryId = categoryMap[challenge.category];
      await client.query(
        `INSERT INTO challenges (name, description, category_id, difficulty, points, estimated_time, flag, creator_id, visibility)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PUBLIC')`,
        [
          challenge.name,
          challenge.description,
          categoryId,
          challenge.difficulty,
          challenge.points,
          challenge.estimated_time,
          challenge.flag,
          userMap['ShadowFox']
        ]
      );
      const challengeResult = await client.query('SELECT id FROM challenges WHERE name = $1', [challenge.name]);
      challengeMap[challenge.name] = challengeResult.rows[0].id;

      // Add objectives
      for (let i = 0; i < challenge.objectives.length; i++) {
        await client.query(
          'INSERT INTO challenge_objectives (challenge_id, objective, order_num) VALUES ($1, $2, $3)',
          [challengeResult.rows[0].id, challenge.objectives[i], i + 1]
        );
      }

      // Add sample hints
      await client.query(
        'INSERT INTO challenge_hints (challenge_id, hint_text, point_penalty, order_num) VALUES ($1, $2, $3, $4)',
        [challengeResult.rows[0].id, 'Check common vulnerability patterns', 10, 1]
      );

      console.log(`  ✓ ${challenge.name} (${challenge.difficulty})`);
    }

    // Seed teams
    console.log('\nAdding teams...');
    const teamMap = {};
    for (const team of seedData.teams) {
      await client.query(
        'INSERT INTO teams (name, owner_id) VALUES ($1, $2)',
        [team.name, userMap[team.owner]]
      );
      const teamResult = await client.query('SELECT id FROM teams WHERE name = $1', [team.name]);
      teamMap[team.name] = teamResult.rows[0].id;

      // Add owner to team
      await client.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
        [teamResult.rows[0].id, userMap[team.owner], 'OWNER']
      );

      console.log(`  ✓ ${team.name}`);
    }

    // Add some team members
    console.log('\nAdding team members...');
    await client.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [teamMap['NIGHT OWLS'], userMap['CyberNinja'], 'MEMBER']
    );
    await client.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [teamMap['NIGHT OWLS'], userMap['Operator'], 'MEMBER']
    );
    console.log('  ✓ Team members added');

    // Seed some completions and points
    console.log('\nAdding challenge completions...');
    const usernames = Object.keys(userMap);
    const challengeNames = Object.keys(challengeMap);
    
    // Assign some completions randomly
    for (let i = 0; i < usernames.length; i++) {
      const userId = userMap[usernames[i]];
      const numChallenges = Math.floor(Math.random() * 8) + 3;
      
      for (let j = 0; j < numChallenges; j++) {
        const challengeName = challengeNames[Math.floor(Math.random() * challengeNames.length)];
        const challengeId = challengeMap[challengeName];
        const challenge = seedData.challenges.find(c => c.name === challengeName);
        
        try {
          await client.query(
            `INSERT INTO challenge_completions (user_id, challenge_id, points_earned, completed_at)
             VALUES ($1, $2, $3, NOW() - INTERVAL '${Math.random() * 30} days')`,
            [userId, challengeId, challenge.points]
          );
        } catch (e) {
          // Ignore duplicates
        }
      }
    }
    console.log('  ✓ Completions added');

    // Log activity
    console.log('\nAdding activity...');
    for (const username of usernames) {
      await client.query(
        `INSERT INTO activity_log (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [userMap[username], 'CHALLENGE_COMPLETED', 'Completed a challenge']
      );
    }
    console.log('  ✓ Activity logged');

    console.log('\n✓ Database seeded successfully\n');
    await client.end();
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
